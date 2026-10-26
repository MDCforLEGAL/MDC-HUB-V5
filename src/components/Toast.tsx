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
        className="toast-in pointer-events-auto flex max-w-[92vw] items-center gap-2.5 rounded-xl border border-neon/25 bg-[#060d15]/95 py-2.5 pl-3 pr-2 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9),0_0_40px_-16px_rgba(0,240,255,0.6)] backdrop-blur-2xl"
      >
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-neon/30 bg-neon/[0.1] text-neon">
          <Check className="h-3 w-3" strokeWidth={2.4} />
        </span>
        <p className="text-[11.5px] text-white/75">{message}</p>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("toast.dismiss")}
          className="ml-1 grid h-6 w-6 shrink-0 place-items-center rounded-md text-white/25 transition-colors hover:bg-white/[0.06] hover:text-white/70"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
