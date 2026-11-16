/**
 * Session tokens are credentials, so they must not be written to localStorage
 * in clear text. This module keeps the token in memory for the current tab and
 * persists only AES-GCM ciphertext. The non-extractable AES key lives in
 * IndexedDB, so reading localStorage alone does not expose the token.
 */

const TOKEN_KEY = "mdc-hub.session";
const DB_NAME = "mdc-hub.secure";
const STORE_NAME = "keys";
const KEY_ID = "session";
const CIPHER_PREFIX = "v1";

let memoryToken: string | null = null;
let keyPromise: Promise<CryptoKey> | null = null;

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("idb_request_failed"));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("idb_transaction_failed"));
    transaction.onabort = () => reject(transaction.error ?? new Error("idb_transaction_aborted"));
  });
}

function openKeyDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("idb_open_failed"));
    request.onblocked = () => reject(new Error("idb_blocked"));
  });
}

async function getSessionKey(): Promise<CryptoKey> {
  if (!keyPromise) {
    keyPromise = (async () => {
      const db = await openKeyDb();
      try {
        const existing = await requestToPromise<CryptoKey | undefined>(
          db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(KEY_ID),
        );
        if (existing) return existing;

        const key = await crypto.subtle.generateKey(
          { name: "AES-GCM", length: 256 },
          false,
          ["encrypt", "decrypt"],
        );
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const done = transactionDone(transaction);
        const write = transaction.objectStore(STORE_NAME).put(key, KEY_ID);
        await requestToPromise(write);
        await done;
        return key;
      } finally {
        db.close();
      }
    })();

    // A blocked/private IndexedDB should not poison every later attempt.
    keyPromise.catch(() => {
      keyPromise = null;
    });
  }

  return keyPromise;
}

/** Encrypts the credential before it is persisted. */
async function encryptSessionToken(token: string): Promise<string> {
  const key = await getSessionKey();
  const iv = crypto.getRandomValues(new Uint8Array(new ArrayBuffer(12)));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(token),
  );
  return `${CIPHER_PREFIX}.${bytesToBase64(iv)}.${bytesToBase64(new Uint8Array(ciphertext))}`;
}

async function decryptSessionToken(payload: string): Promise<string | null> {
  const [version, ivValue, ciphertextValue] = payload.split(".");
  if (version !== CIPHER_PREFIX || !ivValue || !ciphertextValue) return null;

  try {
    const key = await getSessionKey();
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: base64ToBytes(ivValue) },
      key,
      base64ToBytes(ciphertextValue),
    );
    return new TextDecoder().decode(plaintext);
  } catch {
    return null;
  }
}

export async function getStoredToken(): Promise<string | null> {
  if (memoryToken) return memoryToken;

  let stored: string | null = null;
  try {
    stored = window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
  if (!stored) return null;

  // Migrate a legacy plaintext token without ever writing it back in clear text.
  if (/^[a-f0-9]{64}$/.test(stored)) {
    memoryToken = stored;
    await storeToken(stored);
    return stored;
  }

  const token = await decryptSessionToken(stored);
  if (!token) {
    try {
      window.localStorage.removeItem(TOKEN_KEY);
    } catch {
      // Storage may be unavailable; there is nothing else to clean up.
    }
    return null;
  }

  memoryToken = token;
  return token;
}

export async function storeToken(token: string): Promise<void> {
  memoryToken = token;

  try {
    const encrypted = await encryptSessionToken(token);
    window.localStorage.setItem(TOKEN_KEY, encrypted);
  } catch {
    // Without encrypted persistence the session still works for this tab.
    try {
      window.localStorage.removeItem(TOKEN_KEY);
    } catch {
      // Nothing else to do.
    }
  }
}

export function clearStoredToken(): void {
  memoryToken = null;
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Storage may be unavailable.
  }
}
