import { cn } from "@/lib/utils";
import { formatRobux } from "@/lib/format";

export function RobuxIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("h-4 w-4", className)} aria-hidden="true" fill="none">
      <path
        d="M6.2 3.6 20.4 7.4a1 1 0 0 1 .7 1.2L17.3 22.8 3.1 19a1 1 0 0 1-.7-1.2L6.2 3.6Z"
        fill="currentColor"
        opacity="0.95"
      />
      <path d="M9.7 9.3 15 10.7l-1.4 5.3-5.3-1.4 1.4-5.3Z" fill="var(--background)" />
    </svg>
  );
}

export function Robux({
  amount,
  className,
  iconClassName,
}: {
  amount: number | string | null | undefined;
  className?: string;
  iconClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 num", className)}>
      <RobuxIcon className={cn("h-[0.9em] w-[0.9em] text-gold", iconClassName)} />
      {formatRobux(amount)}
    </span>
  );
}
