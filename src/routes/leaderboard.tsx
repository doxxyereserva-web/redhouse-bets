import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Crown, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Robux } from "@/components/Robux";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — RedHouse" },
      {
        name: "description",
        content: "Top RedHouse players ranked by demo Robux profit and total wagered.",
      },
      { property: "og:title", content: "Leaderboard — RedHouse" },
      {
        property: "og:description",
        content: "See who is running hot on Crash, Mines, Plinko and the RedHouse originals.",
      },
    ],
  }),
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const { t } = useI18n();
  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, profit, wagered, balance")
        .order("profit", { ascending: false })
        .limit(50);
      return data ?? [];
    },
  });

  return (
    <main className="mx-auto max-w-4xl px-4 pb-16">
      <header className="mt-8 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-md bg-gold/15 text-gold">
          <Trophy className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-display text-3xl font-bold uppercase">{t("Leaderboard")}</h1>
          <p className="text-sm text-muted-foreground">{t("Ranked by demo profit, all time.")}</p>
        </div>
      </header>

      <div className="panel mt-6 overflow-hidden">
        {isLoading && (
          <p className="py-16 text-center text-sm text-muted-foreground">{t("Loading…")}</p>
        )}
        {!isLoading && (data ?? []).length === 0 && (
          <p className="py-16 text-center text-sm text-muted-foreground">
            {t("No players yet. Be the first on the board.")}
          </p>
        )}
        <ul className="divide-y divide-border/60">
          {(data ?? []).map((p, i) => (
            <li key={p.id} className="flex items-center gap-3 px-4 py-3">
              <span
                className={`num w-8 text-center text-sm font-bold ${
                  i === 0 ? "text-gold" : i < 3 ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {i + 1}
              </span>
              <img
                src={p.avatar_url ?? ""}
                alt={`${p.username} Roblox avatar`}
                loading="lazy"
                className="h-10 w-10 rounded-md border border-border bg-surface-2 object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {p.display_name}
                  {i === 0 && <Crown className="ml-1 inline h-3.5 w-3.5 text-gold" />}
                </p>
                <p className="truncate text-xs text-muted-foreground">@{p.username}</p>
              </div>
              <div className="text-right">
                <Robux
                  amount={p.profit}
                  className={`text-sm font-semibold ${Number(p.profit) >= 0 ? "text-win" : "text-loss"}`}
                />
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {t("wagered")} <Robux amount={p.wagered} className="text-[10px]" />
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
