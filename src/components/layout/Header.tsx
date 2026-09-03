import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Settings2, LogOut, TrendingUp, Trophy, Dices, LayoutDashboard } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { Robux } from "@/components/Robux";
import { UserAvatar } from "@/components/UserAvatar";
import { LanguagePicker } from "@/components/layout/LanguagePicker";
import { useI18n } from "@/lib/i18n";
import markAsset from "@/assets/redhouse-mark.png.asset.json";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";


function CreatorPanel() {
  const { profile, refresh } = useProfile();
  const [amount, setAmount] = useState("100000");
  const [luck, setLuck] = useState([Number(profile?.luck ?? 1)]);
  const [boost, setBoost] = useState([Number(profile?.multiplier_boost ?? 1)]);
  const [open, setOpen] = useState(false);

  async function save() {
    const value = Number(amount);
    if (!Number.isFinite(value) || value < 0) {
      toast.error("Invalid amount.");
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .update({ balance: value, luck: luck[0]!, multiplier_boost: boost[0]! })
      .eq("id", profile!.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    refresh();
    setOpen(false);
    toast.success("Demo settings applied.");
  }

  if (!profile) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Creator mode">
          <Settings2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Creator mode</DialogTitle>
          <DialogDescription>
            Demo controls for recording. Set your balance, luck and payout boost.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="bal">Balance</Label>
            <Input id="bal" value={amount} onChange={(e) => setAmount(e.target.value)} className="num" />
          </div>
          <div className="space-y-2">
            <Label>Luck ×{luck[0]!.toFixed(2)}</Label>
            <Slider min={0} max={5} step={0.05} value={luck} onValueChange={setLuck} />
          </div>
          <div className="space-y-2">
            <Label>Payout boost ×{boost[0]!.toFixed(2)}</Label>
            <Slider min={0.1} max={10} step={0.1} value={boost} onValueChange={setBoost} />
          </div>
          <Button className="w-full" onClick={save}>
            Apply
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function Header() {
  const { profile, signedIn } = useProfile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useI18n();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const navLink =
    "rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground";

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-foreground/95 p-1">
            <img src={markAsset.url} alt="RedHouse logo" className="h-full w-full object-contain" />
          </span>
          <span className="font-display text-lg font-bold uppercase tracking-widest">
            Red<span className="text-primary">House</span>
          </span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 md:flex">
          <Link
            to="/"
            className={navLink}
            activeProps={{ className: "text-foreground bg-secondary" }}
            activeOptions={{ exact: true }}
          >
            <span className="inline-flex items-center gap-2">
              <Dices className="h-4 w-4" /> {t("Casino")}
            </span>
          </Link>
          <Link to="/markets" className={navLink} activeProps={{ className: "text-foreground bg-secondary" }}>
            <span className="inline-flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> {t("Markets")}
            </span>
          </Link>
          <Link to="/leaderboard" className={navLink} activeProps={{ className: "text-foreground bg-secondary" }}>
            <span className="inline-flex items-center gap-2">
              <Trophy className="h-4 w-4" /> {t("Leaderboard")}
            </span>
          </Link>
          {signedIn && (
            <Link to="/dashboard" className={navLink} activeProps={{ className: "text-foreground bg-secondary" }}>
              <span className="inline-flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4" /> {t("Dashboard")}
              </span>
            </Link>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <LanguagePicker />
          {signedIn && profile ? (
            <>
              <div className="panel hidden items-center gap-2 px-3 py-2 sm:flex">
                <Robux amount={profile.balance} className="text-sm font-semibold" />
              </div>
              <CreatorPanel />
              <Link to="/wallet">
                <Button variant="secondary" size="sm">
                  {t("Wallet")}
                </Button>
              </Link>
              <Link to="/dashboard" aria-label={t("Dashboard")}>
                <UserAvatar url={profile.avatar_url} username={profile.username} />
              </Link>
              <Button variant="ghost" size="icon" onClick={signOut} aria-label={t("Sign out")}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button size="sm">{t("Sign in with Roblox")}</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );

}
