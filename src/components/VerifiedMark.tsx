import type { AuthRole } from "../lib/api";
import { cn } from "../lib/cn";
import { useI18n } from "../i18n";
import { BadgeCheck } from "./Icons";

interface VerifiedMarkProps {
  role?: AuthRole;
  verified?: boolean;
  className?: string;
}

/** Blue check for verified members, red check for site admins. */
export function VerifiedMark({ role, verified, className }: VerifiedMarkProps) {
  const { t } = useI18n();

  if (role === "admin") {
    return (
      <BadgeCheck
        className={cn(
          "shrink-0 text-[#ff5252] drop-shadow-[0_0_6px_rgba(255,50,50,0.45)]",
          className,
        )}
        aria-label={t("card.adminBadge")}
      />
    );
  }

  if (!verified) return null;

  return (
    <BadgeCheck
      className={cn("shrink-0 text-neon/80", className)}
      aria-label={t("card.verifiedCommunity")}
    />
  );
}
