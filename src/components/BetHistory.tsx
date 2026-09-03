import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { Robux } from "@/components/Robux";
import { formatMultiplier } from "@/lib/format";

export function BetHistory({ game }: { game?: string }) {
  const { profile } = useProfile();

  const { data } = useQuery({
    queryKey: ["bet-history", profile?.id, game ?? "all"],
    enabled: !!profile?.id,
    queryFn: async () => {
      let q = supabase
        .from("bets")
        .select("id, game, wager, multiplier, payout, won, created_at")
        .eq("user_id", profile!.id)
        .order("created_at", { ascending: false })
        .limit(15);
      if (game) q = q.eq("game", game);
      const { data } = await q;
      return data ?? [];
    },
  });

  if (!profile) return null;

  return (
    <section className="panel p-4">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        Your last bets
      </h2>
      <div className="mt-3 divide-y divide-border/60">
        {(data ?? []).length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">No bets recorded yet.</p>
        )}
        {(data ?? []).map((b) => (
          <div key={b.id} className="flex items-center justify-between py-2 text-sm">
            <span className="capitalize text-muted-foreground">{b.game}</span>
            <Robux amount={b.wager} className="text-muted-foreground" />
            <span className="num text-xs text-muted-foreground">
              {formatMultiplier(Number(b.multiplier))}
            </span>
            <Robux amount={b.payout} className={b.won ? "text-win" : "text-loss line-through"} />
          </div>
        ))}
      </div>
    </section>
  );
}
