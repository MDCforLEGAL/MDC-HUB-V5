import { useState } from "react";
import type { AuthUser } from "../lib/api";
import { cn } from "../lib/cn";

interface UserAvatarProps {
  user: AuthUser;
  className?: string;
}

export function UserAvatar({ user, className }: UserAvatarProps) {
  const [failed, setFailed] = useState(false);
  const initial = (user.displayName || user.username || "?").slice(0, 1).toUpperCase();

  if (!user.avatarUrl || failed) {
    return (
      <span
        aria-hidden="true"
        className={cn(
          "grid shrink-0 place-items-center rounded-full border border-white/15 bg-gradient-to-br from-neon/25 to-electric/25 font-mono text-[10px] font-semibold text-white",
          className,
        )}
      >
        {initial}
      </span>
    );
  }

  return (
    <img
      src={user.avatarUrl}
      alt=""
      width={40}
      height={40}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={cn("shrink-0 rounded-full border border-white/15 object-cover", className)}
    />
  );
}
