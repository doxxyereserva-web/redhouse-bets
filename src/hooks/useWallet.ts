import { useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { MAX_MULTIPLIER } from "@/lib/fair";

export function useWallet() {
  const { profile, refresh, signedIn, session, ready } = useProfile();

  const balance = Number(profile?.balance ?? 0);
  const luck = Number(profile?.luck ?? 1);
  const boost = Number(profile?.multiplier_boost ?? 1);

  /** Rolls a win using the demo luck factor. */
  const roll = useCallback(
    (baseChance: number) => Math.random() < Math.min(baseChance * luck, 0.999),
    [luck],
  );

  const settle = useCallback(
    async (game: string, wager: number, multiplier: number) => {
      if (!signedIn) {
        toast.error("Sign in with your Roblox account first.");
        return null;
      }
      const finalMultiplier =
        multiplier > 0 ? Math.min(multiplier * boost, MAX_MULTIPLIER) : 0;
      const payout = Number((wager * finalMultiplier).toFixed(2));
      const { data, error } = await supabase.rpc("apply_bet", {
        _game: game,
        _wager: wager,
        _multiplier: finalMultiplier,
        _payout: payout,
      });
      if (error) {
        toast.error(error.message.includes("insufficient") ? "Not enough Robux." : error.message);
        return null;
      }
      refresh();
      return { payout, balance: Number(data) };
    },
    [signedIn, boost, refresh],
  );

  return { profile, balance, luck, boost, roll, settle, refresh, signedIn, session, ready };
}
