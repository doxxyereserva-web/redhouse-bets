import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Activity, Flame, Target, TrendingDown, TrendingUp, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { Robux } from "@/components/Robux";
import { UserAvatar } from "@/components/UserAvatar";
import { BetHistory } from "@/components/BetHistory";
import { Button } from "@/components/ui/button";
import { formatMultiplier } from "@/lib/format";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Player Dashboard — RedHouse" },
      {
        name: "description",
        content:
          "Track your demo Robux balance, profit, win rate, favourite games and global rank on RedHouse.",
      },
      { property: "og:title", content: "Player Dashboard — RedHouse" },
      {
        property: "og:description",
        content: "Your RedHouse stats: profit, win rate, biggest hit and global rank.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

function Stat({
  label,
  children,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  children: React.ReactNode;
  icon: React.ElementType;
  tone?: "default" | "win" | "loss" | "gold";
}) {
  const tones = {
    default: "text-foreground",
    win: "text-win",
    loss: "text-loss",
    gold: "text-gold",
  } as const;
  return (
    <div className="panel p-4">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className={`num mt-2 text-2xl font-bold ${tones[tone]}`}>{children}</div>
    </div>
  );
}

function DashboardPage() {
  const { profile, signedIn } = useProfile();

  const { data: bets } = useQuery({
    queryKey: ["dashboard-bets", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("bets")
        .select("game, wager, multiplier, payout, won, created_at")
        .eq("user_id", profile!.id)
        .order("created_at", { ascending: false })
        .limit(300);
      return data ?? [];
    },
  });

  const { data: rank } = useQuery({
    queryKey: ["dashboard-rank", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { count } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gt("profit", Number(profile?.profit ?? 0));
      return (count ?? 0) + 1;
    },
  });

  if (!signedIn || !profile) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl font-bold uppercase">Dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in with your Roblox account to see your stats.
        </p>
        <Link to="/auth" className="mt-6 inline-block">
          <Button>Sign in with Roblox</Button>
        </Link>
      </main>
    );
  }

  const rows = bets ?? [];
  const wins = rows.filter((b) => b.won).length;
  const winRate = rows.length ? (wins / rows.length) * 100 : 0;
  const best = rows.reduce((m, b) => Math.max(m, Number(b.multiplier ?? 0)), 0);
  const biggestWin = rows.reduce((m, b) => Math.max(m, Number(b.payout ?? 0)), 0);
  const profit = Number(profile.profit ?? 0);

  const byGame = Object.entries(
    rows.reduce<Record<string, { plays: number; wagered: number; net: number }>>((acc, b) => {
      const g = (acc[b.game] ??= { plays: 0, wagered: 0, net: 0 });
      g.plays += 1;
      g.wagered += Number(b.wager ?? 0);
      g.net += Number(b.payout ?? 0) - Number(b.wager ?? 0);
      return acc;
    }, {}),
  ).sort((a, b) => b[1].plays - a[1].plays);

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16">
      <header className="mt-8 flex flex-wrap items-center gap-4">
        <UserAvatar url={profile.avatar_url} username={profile.username} className="h-16 w-16 rounded-lg" />
        <div className="mr-auto">
          <h1 className="font-display text-3xl font-bold uppercase">
            {profile.display_name ?? profile.username}
          </h1>
          <p className="text-sm text-muted-foreground">@{profile.username}</p>
        </div>
        <div className="panel flex items-center gap-3 px-4 py-3">
          <Trophy className="h-5 w-5 text-gold" />
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Global rank</p>
            <p className="num text-xl font-bold text-gold">#{rank ?? "—"}</p>
          </div>
        </div>
      </header>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Balance" icon={Activity}>
          <Robux amount={profile.balance} />
        </Stat>
        <Stat label="Net profit" icon={profit >= 0 ? TrendingUp : TrendingDown} tone={profit >= 0 ? "win" : "loss"}>
          <Robux amount={profit} />
        </Stat>
        <Stat label="Total wagered" icon={Target}>
          <Robux amount={profile.wagered} />
        </Stat>
        <Stat label="Win rate" icon={Flame} tone="gold">
          {winRate.toFixed(1)}%
        </Stat>
      </section>

      <section className="mt-3 grid gap-3 sm:grid-cols-3">
        <Stat label="Bets placed" icon={Activity}>
          {rows.length}
        </Stat>
        <Stat label="Best multiplier" icon={Flame} tone="gold">
          {formatMultiplier(best)}
        </Stat>
        <Stat label="Biggest payout" icon={Trophy} tone="win">
          <Robux amount={biggestWin} />
        </Stat>
      </section>

      <section className="panel mt-6 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Game breakdown
        </h2>
        {byGame.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No bets yet. Pick a table and start your run.
          </p>
        ) : (
          <div className="mt-3 divide-y divide-border/60">
            {byGame.map(([game, s]) => (
              <div key={game} className="flex items-center gap-3 py-2.5 text-sm">
                <Link
                  to="/games/$game"
                  params={{ game }}
                  className="w-28 shrink-0 capitalize text-foreground hover:text-primary"
                >
                  {game}
                </Link>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.min(100, (s.plays / rows.length) * 100)}%` }}
                  />
                </div>
                <span className="num w-16 text-right text-xs text-muted-foreground">{s.plays}x</span>
                <Robux
                  amount={s.net}
                  className={`w-28 justify-end text-xs ${s.net >= 0 ? "text-win" : "text-loss"}`}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="mt-6">
        <BetHistory />
      </div>
    </main>
  );
}
