import { getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA4vs3oghdTdmpw-KNaez0h7LLB8Woc9vs",
  authDomain: "mdc-hub-v5.firebaseapp.com",
  projectId: "mdc-hub-v5",
  storageBucket: "mdc-hub-v5.firebasestorage.app",
  messagingSenderId: "1008541898743",
  appId: "1:1008541898743:web:c40b05d1b44ddba6a400f2",
  measurementId: "G-3Y69PBWNLH",
};

const app = getApps()[0] ?? initializeApp(firebaseConfig);

export const firebaseAuth = getAuth(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

/** Opens the Firebase Google popup and returns a signed ID token. */
export async function requestGoogleIdToken(): Promise<string> {
  const result = await signInWithPopup(firebaseAuth, googleProvider);
  return result.user.getIdToken();
}

/** Clears the Firebase session when the MDC HUB session ends. */
export async function signOutOfFirebase(): Promise<void> {
  try {
    await signOut(firebaseAuth);
  } catch {
    // The Firebase session is not required for the MDC session to end.
  }
}
