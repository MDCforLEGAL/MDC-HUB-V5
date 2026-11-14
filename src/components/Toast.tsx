import { useI18n } from "../i18n";
import { Check, X } from "./Icons";

interface ToastProps {
  message: string;
  onClose: () => void;
}

export function Toast({ message, onClose }: ToastProps) {
  const { t } = useI18n();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[100] flex justify-center px-4">
      <div
        role="status"
        aria-live="polite"
        className="toast-in toast-card pointer-events-auto flex max-w-[92vw] items-center gap-2.5 py-2.5 pl-3 pr-2"
      >
        <span className="grid h-6 w-6 shrink-0 place-items-center border border-[var(--info)] text-[var(--info)]">
          <Check className="h-3 w-3" strokeWidth={2.4} />
        </span>
        <p className="text-[0.72rem] text-[var(--ink-soft)]">{message}</p>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("toast.dismiss")}
          className="ml-1 grid h-6 w-6 shrink-0 place-items-center text-[var(--faint)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
