import { useCallback, useEffect, useRef, useState } from "react";
import { copyText } from "../lib/clipboard";

export function useCopy(onNotify?: (message: string) => void) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const copy = useCallback(
    async (text: string, message = "Kod panoya kopyalandı") => {
      const ok = await copyText(text);
      if (!ok) {
        onNotify?.("Kopyalanamadı · tarayıcı iznini kontrol et");
        return false;
      }

      setCopied(true);
      onNotify?.(message);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2200);
      return true;
    },
    [onNotify],
  );

  return { copied, copy };
}
