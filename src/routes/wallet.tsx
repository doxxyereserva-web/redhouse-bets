import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowDownToLine, ArrowUpFromLine, Gift, Wallet as WalletIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { Robux } from "@/components/Robux";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BetHistory } from "@/components/BetHistory";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/wallet")({
  head: () => ({
    meta: [
      { title: "Wallet — RedHouse demo Robux" },
      {
        name: "description",
        content:
          "Track your demo Robux balance, claim the faucet and simulate deposits and withdrawals on RedHouse.",
      },
      { property: "og:title", content: "Wallet — RedHouse demo Robux" },
      {
        property: "og:description",
        content: "Demo balance, faucet, deposit and withdraw simulation, and your full bet history.",
      },
    ],
  }),
  component: WalletPage,
});

function WalletPage() {
  const { profile, refresh, signedIn } = useProfile();
  const { t } = useI18n();
  const [amount, setAmount] = useState("1000");

  async function move(direction: 1 | -1) {
    if (!profile) return;
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error(t("Invalid amount."));
      return;
    }
    const next = Number(profile.balance) + direction * value;
    if (next < 0) {
      toast.error(t("Not enough Robux."));
      return;
    }
    const { error } = await supabase.rpc("set_demo_balance", { _amount: next });
    if (error) {
      toast.error(error.message);
      return;
    }
    refresh();
    toast.success(direction === 1 ? t("Deposit simulated.") : t("Withdrawal simulated."));
  }

  async function faucet() {
    if (!profile) return;
    const { error } = await supabase.rpc("set_demo_balance", {
      _amount: Number(profile.balance) + 500,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    refresh();
    toast.success(t("Faucet claimed: +500 Robux."));
  }

  if (!signedIn || !profile) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl font-bold uppercase">{t("Wallet")}</h1>
        <p className="mt-2 text-muted-foreground">
          {t("Verify your Roblox profile to open your demo wallet.")}
        </p>
        <Link to="/auth" className="mt-6 inline-block">
          <Button size="lg">{t("Sign in with Roblox")}</Button>
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 pb-16">
      <header className="mt-8 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-md bg-primary/15 text-primary">
          <WalletIcon className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-display text-3xl font-bold uppercase">{t("Wallet")}</h1>
          <p className="text-sm text-muted-foreground">{t("Demo balance — no real Robux.")}</p>
        </div>
      </header>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="panel relative overflow-hidden p-5">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gold/20 blur-2xl" />
          <p className="text-xs uppercase tracking-widest text-muted-foreground">{t("Balance")}</p>
          <Robux amount={profile.balance} className="mt-2 text-3xl font-bold text-gold" />
        </div>
        <div className="panel p-5">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">{t("Wagered")}</p>
          <Robux amount={profile.wagered} className="mt-2 text-2xl font-bold" />
        </div>
        <div className="panel p-5">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">{t("Profit")}</p>
          <Robux
            amount={profile.profit}
            className={`mt-2 text-2xl font-bold ${Number(profile.profit) >= 0 ? "text-win" : "text-loss"}`}
          />
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-[1fr_280px]">
        <div className="panel space-y-4 p-5">
          <div className="space-y-2">
            <Label htmlFor="amount">{t("Amount")}</Label>
            <Input
              id="amount"
              className="num"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button onClick={() => move(1)} className="w-full">
              <ArrowDownToLine className="mr-2 h-4 w-4" /> {t("Deposit")}
            </Button>
            <Button variant="secondary" onClick={() => move(-1)} className="w-full">
              <ArrowUpFromLine className="mr-2 h-4 w-4" /> {t("Withdraw")}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("Deposits and withdrawals are simulated for recording purposes only.")}
          </p>
        </div>

        <div className="panel flex flex-col justify-between gap-4 p-5">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              <Gift className="h-4 w-4 text-gold" /> {t("Faucet")}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("Out of Robux? Top up with a free demo drop.")}
            </p>
          </div>
          <Button variant="secondary" onClick={faucet}>
            {t("Claim 500")}
          </Button>
        </div>
      </section>

      <div className="mt-6">
        <BetHistory />
      </div>
    </main>
  );
}
