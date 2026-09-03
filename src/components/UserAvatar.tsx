import { useState } from "react";
import { cn } from "@/lib/utils";

export function UserAvatar({
  url,
  username,
  className,
}: {
  url?: string | null;
  username?: string | null;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const initials = (username ?? "?").slice(0, 2).toUpperCase();

  return (
    <span
      className={cn(
        "relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-md border border-border bg-surface-2",
        className,
      )}
    >
      {url && !failed ? (
        <img
          src={url}
          alt={`${username ?? "Player"} Roblox avatar`}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
          draggable={false}
        />
      ) : (
        <span className="font-display text-xs font-bold uppercase text-muted-foreground">
          {initials}
        </span>
      )}
    </span>
  );
}
