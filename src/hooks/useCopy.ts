import { useCallback, useEffect, useRef, useState } from "react";
import { copyText } from "../lib/clipboard";
import { useI18n } from "../i18n";

export function useCopy(onNotify?: (message: string) => void) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const copy = useCallback(
    async (text: string, message?: string) => {
      const ok = await copyText(text);
      if (!ok) {
        onNotify?.(t("toast.copyFailed"));
        return false;
      }

      setCopied(true);
      onNotify?.(message ?? t("toast.copied"));
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2200);
      return true;
    },
    [onNotify, t],
  );

  return { copied, copy };
}
