import { cn } from "@/lib/utils";
import { formatRobux } from "@/lib/format";
import robuxAsset from "@/assets/robux.png.asset.json";

export function RobuxIcon({ className }: { className?: string }) {
  return (
    <img
      src={robuxAsset.url}
      alt=""
      aria-hidden="true"
      className={cn("h-4 w-4 select-none object-contain", className)}
      draggable={false}
    />
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
      <RobuxIcon className={cn("h-[1em] w-[1em]", iconClassName)} />
      {formatRobux(amount)}
    </span>
  );
}
