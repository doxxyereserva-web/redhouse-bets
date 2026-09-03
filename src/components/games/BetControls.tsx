import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Robux } from "@/components/Robux";

export function BetControls({
  wager,
  setWager,
  balance,
  disabled,
  children,
}: {
  wager: number;
  setWager: (v: number) => void;
  balance: number;
  disabled?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="panel space-y-4 p-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="wager">Wager</Label>
          <span className="text-xs text-muted-foreground">
            Balance <Robux amount={balance} />
          </span>
        </div>
        <Input
          id="wager"
          className="num"
          inputMode="decimal"
          value={String(wager)}
          disabled={disabled}
          onChange={(e) => {
            const n = Number(e.target.value.replace(/[^\d.]/g, ""));
            setWager(Number.isFinite(n) ? n : 0);
          }}
        />
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "1/2", fn: () => Math.max(1, Math.floor(wager / 2)) },
            { label: "2x", fn: () => Math.max(1, wager * 2) },
            { label: "+100", fn: () => wager + 100 },
            { label: "Max", fn: () => Math.max(1, Math.floor(balance)) },
          ].map((b) => (
            <Button
              key={b.label}
              type="button"
              size="sm"
              variant="secondary"
              disabled={disabled}
              onClick={() => setWager(b.fn())}
            >
              {b.label}
            </Button>
          ))}
        </div>
      </div>
      {children}
    </div>
  );
}
