import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Flame, ShieldCheck, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GAMES } from "@/lib/games";
import { Robux } from "@/components/Robux";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useProfile";
import { formatMultiplier } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RedHouse — Roblox Bet House" },
      {
        name: "description",
        content:
          "Crash, Mines, Roulette, Plinko and leveraged markets. Sign in with your Roblox profile and play with demo Robux.",
      },
      { property: "og:title", content: "RedHouse — Roblox Bet House" },
      {
        property: "og:description",
        content: "Nine games, live bet feed and leveraged markets, powered by demo Robux.",
      },
    ],
  }),
  component: Lobby,
});

type BetRow = {
  id: string;
  game: string;
  wager: number;
  multiplier: number;
  payout: number;
  won: boolean;
  created_at: string;
};

function LiveFeed() {
  const [rows, setRows] = useState<BetRow[]>([]);

  const { data } = useQuery({
    queryKey: ["live-bets"],
    queryFn: async () => {
      const { data } = await supabase
        .from("bets")
        .select("id, game, wager, multiplier, payout, won, created_at")
        .order("created_at", { ascending: false })
        .limit(12);
      return (data ?? []) as BetRow[];
    },
  });

  useEffect(() => {
    if (data) setRows(data);
  }, [data]);

  useEffect(() => {
    const channel = supabase
      .channel("live-bets")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "bets" }, (payload) => {
        setRows((prev) => [payload.new as BetRow, ...prev].slice(0, 12));
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="panel p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        <Flame className="h-4 w-4 text-primary" /> Live bets
      </h2>
      <ul className="mt-3 space-y-1.5">
        {rows.length === 0 && (
          <li className="py-6 text-center text-sm text-muted-foreground">No bets yet. Be first.</li>
        )}
        {rows.map((bet) => (
          <li
            key={bet.id}
            className="flex items-center justify-between rounded-md bg-surface-2/60 px-3 py-2 text-sm"
          >
            <span className="capitalize text-muted-foreground">{bet.game}</span>
            <span className="num text-xs text-muted-foreground">
              {formatMultiplier(Number(bet.multiplier))}
            </span>
            <Robux
              amount={bet.payout}
              className={bet.won ? "text-win" : "text-muted-foreground line-through"}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function Lobby() {
  const { signedIn, profile } = useProfile();

  return (
    <main className="mx-auto max-w-7xl px-4 pb-16">
      <section className="relative mt-8 overflow-hidden rounded-2xl border border-border bg-[linear-gradient(135deg,oklch(0.24_0.06_24),oklch(0.16_0.02_20))] px-6 py-12 md:px-12 md:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary">
          Demo house · 18+
        </p>
        <h1 className="mt-4 max-w-2xl text-4xl font-bold uppercase leading-[1.05] md:text-6xl">
          The house where <span className="text-gold">Robux</span> moves fast
        </h1>
        <p className="mt-4 max-w-xl text-muted-foreground">
          Nine games, a live bet feed and a leveraged market desk. Verify your Roblox profile in 30
          seconds and start playing with demo Robux.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {signedIn ? (
            <Link to="/games/$game" params={{ game: "crash" }}>
              <Button size="lg">Play Crash</Button>
            </Link>
          ) : (
            <Link to="/auth">
              <Button size="lg">Sign in with Roblox</Button>
            </Link>
          )}
          <Link to="/markets">
            <Button size="lg" variant="secondary">
              Open Markets
            </Button>
          </Link>
        </div>
        <div className="mt-10 flex flex-wrap gap-6 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-win" /> Bio verification login
          </span>
          <span className="inline-flex items-center gap-2">
            <Zap className="h-4 w-4 text-gold" /> Instant demo payouts
          </span>
        </div>
      </section>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <h2 className="font-display text-xl font-bold uppercase tracking-wide">Games</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {GAMES.map((game) => (
              <Link
                key={game.id}
                to="/games/$game"
                params={{ game: game.id }}
                className="panel group relative overflow-hidden p-5 transition-transform hover:-translate-y-1"
              >
                <div
                  className={`absolute -right-10 -top-10 h-28 w-28 rounded-full blur-2xl transition-opacity group-hover:opacity-90 ${
                    game.accent === "gold"
                      ? "bg-gold/25"
                      : game.accent === "win"
                        ? "bg-win/20"
                        : "bg-primary/25"
                  }`}
                />
                {game.original && (
                  <span className="rounded-sm bg-gold/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-gold">
                    RedHouse original
                  </span>
                )}
                <h3 className="mt-3 font-display text-2xl font-bold uppercase">{game.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{game.tagline}</p>
              </Link>
            ))}
          </div>
        </div>

        <aside className="space-y-4">
          {profile && (
            <div className="panel p-4">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Your balance</p>
              <Robux amount={profile.balance} className="mt-1 text-2xl font-bold text-gold" />
              <p className="mt-2 text-xs text-muted-foreground">
                Wagered <Robux amount={profile.wagered} /> · Profit{" "}
                <Robux amount={profile.profit} className={Number(profile.profit) >= 0 ? "text-win" : "text-loss"} />
              </p>
            </div>
          )}
          <LiveFeed />
        </aside>
      </div>
    </main>
  );
}
