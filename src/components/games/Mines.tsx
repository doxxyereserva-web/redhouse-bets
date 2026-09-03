import { useState } from "react";
import { Bomb, Gem } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { BetControls } from "@/components/games/BetControls";
import { useWallet } from "@/hooks/useWallet";
import { formatMultiplier } from "@/lib/format";
import { edged } from "@/lib/fair";

const TILES = 25;

function multiplierFor(bombs: number, picks: number) {
  let m = 1;
  for (let i = 0; i < picks; i++) m *= (TILES - i) / (TILES - bombs - i);
  return edged(m);
}

export function Mines() {
  const { balance, settle, signedIn } = useWallet();
  const [wager, setWager] = useState(100);
  const [bombs, setBombs] = useState([3]);
  const [field, setField] = useState<boolean[]>([]);
  const [opened, setOpened] = useState<number[]>([]);
  const [active, setActive] = useState(false);
  const [lost, setLost] = useState(false);

  const bombCount = bombs[0]!;
  const current = opened.length ? multiplierFor(bombCount, opened.length) : 1;

  function start() {
    if (!signedIn) return toast.error("Sign in with your Roblox account first.");
    if (wager <= 0 || wager > balance) return toast.error("Invalid wager.");
    const next = Array.from({ length: TILES }, () => false);
    let placed = 0;
    while (placed < bombCount) {
      const i = Math.floor(Math.random() * TILES);
      if (!next[i]) {
        next[i] = true;
        placed++;
      }
    }
    setField(next);
    setOpened([]);
    setLost(false);
    setActive(true);
  }

  async function pick(i: number) {
    if (!active || opened.includes(i)) return;
    if (field[i]) {
      setActive(false);
      setLost(true);
      await settle("mines", wager, 0);
      toast.error("Boom.");
      return;
    }
    const next = [...opened, i];
    setOpened(next);
    if (next.length === TILES - bombCount) await cashOut(next.length);
  }

  async function cashOut(count = opened.length) {
    if (!active || count === 0) return;
    const m = multiplierFor(bombCount, count);
    setActive(false);
    const res = await settle("mines", wager, m);
    if (res) toast.success(`Cashed out at ${formatMultiplier(m)}`);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="panel p-4">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-2">
          {Array.from({ length: TILES }).map((_, i) => {
            const isOpen = opened.includes(i);
            const reveal = lost && field[i];
            return (
              <button
                key={i}
                onClick={() => pick(i)}
                disabled={!active}
                className={`grid aspect-square place-items-center rounded-md border text-sm transition-all ${
                  isOpen
                    ? "border-win/50 bg-win/15 text-win"
                    : reveal
                      ? "border-loss/50 bg-loss/15 text-loss"
                      : "border-border bg-surface-2 hover:border-primary/60 hover:bg-surface-2/70"
                }`}
                aria-label={`Tile ${i + 1}`}
              >
                {isOpen ? <Gem className="h-5 w-5" /> : reveal ? <Bomb className="h-5 w-5" /> : null}
              </button>
            );
          })}
        </div>
      </div>

      <BetControls wager={wager} setWager={setWager} balance={balance} disabled={active}>
        <div className="space-y-2">
          <Label>Bombs: {bombCount}</Label>
          <Slider min={1} max={24} step={1} value={bombs} onValueChange={setBombs} disabled={active} />
        </div>
        {active ? (
          <Button className="w-full" variant="secondary" onClick={() => cashOut()} disabled={!opened.length}>
            Cash out {formatMultiplier(current)}
          </Button>
        ) : (
          <Button className="w-full" onClick={start}>
            Bet
          </Button>
        )}
        <p className="text-xs text-muted-foreground">
          Next tile pays {formatMultiplier(multiplierFor(bombCount, opened.length + 1))}
        </p>
      </BetControls>
    </div>
  );
}
