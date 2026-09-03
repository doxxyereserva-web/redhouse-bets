import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lookupRobloxUser, startVerification, verifyRobloxBio } from "@/lib/roblox.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in with Roblox — RedHouse" },
      {
        name: "description",
        content: "Verify your Roblox account by pasting 8 words in your bio. No password needed.",
      },
      { property: "og:title", content: "Sign in with Roblox — RedHouse" },
      {
        property: "og:description",
        content: "Bio verification login for RedHouse. Fast, passwordless, Roblox-native.",
      },
    ],
  }),
  component: AuthPage,
});

type RobloxUser = {
  robloxId: number;
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

function AuthPage() {
  const navigate = useNavigate();
  const lookup = useServerFn(lookupRobloxUser);
  const start = useServerFn(startVerification);
  const verify = useServerFn(verifyRobloxBio);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [nick, setNick] = useState("");
  const [user, setUser] = useState<RobloxUser | null>(null);
  const [words, setWords] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  async function handleLookup() {
    setBusy(true);
    try {
      const found = await lookup({ data: { username: nick.trim() } });
      setUser(found);
      setStep(2);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Roblox user not found.");
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirm() {
    if (!user) return;
    setBusy(true);
    try {
      const res = await start({ data: { robloxId: user.robloxId, username: user.username } });
      setWords(res.words);
      setStep(3);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not start verification.");
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify() {
    if (!user) return;
    setBusy(true);
    try {
      const { tokenHash } = await verify({ data: { robloxId: user.robloxId } });
      const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "email" });
      if (error) throw new Error(error.message);
      toast.success(`Welcome, ${user.displayName}!`);
      navigate({ to: "/" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Verification failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-4 py-12">
      <h1 className="font-display text-3xl font-bold uppercase">Sign in with Roblox</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        No password. We verify you own the account by checking your Roblox bio.
      </p>

      <div className="panel mt-6 space-y-5 p-6">
        <ol className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
          {["Nickname", "Confirm", "Verify"].map((label, i) => (
            <li
              key={label}
              className={`rounded-sm px-2 py-1 ${step === i + 1 ? "bg-primary/20 text-primary" : ""}`}
            >
              {i + 1}. {label}
            </li>
          ))}
        </ol>

        {step === 1 && (
          <div className="space-y-3">
            <Label htmlFor="nick">Roblox username</Label>
            <Input
              id="nick"
              value={nick}
              maxLength={20}
              placeholder="builderman"
              onChange={(e) => setNick(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && nick.trim().length >= 3 && handleLookup()}
            />
            <Button className="w-full" disabled={busy || nick.trim().length < 3} onClick={handleLookup}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Find my character
            </Button>
          </div>
        )}

        {step === 2 && user && (
          <div className="space-y-4 text-center">
            <img
              src={user.avatarUrl ?? ""}
              alt={`${user.username} Roblox character`}
              className="mx-auto h-40 w-40 rounded-lg border border-border bg-surface-2 object-contain"
            />
            <div>
              <p className="font-display text-xl font-bold">{user.displayName}</p>
              <p className="num text-sm text-muted-foreground">@{user.username}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setStep(1)}>
                Not me
              </Button>
              <Button className="flex-1" disabled={busy} onClick={handleConfirm}>
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} That's me
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Paste these 8 words in your Roblox profile bio, save it, then hit verify. Code expires
              in 10 minutes.
            </p>
            <div className="flex flex-wrap gap-2 rounded-md bg-surface-2 p-3">
              {words.map((w) => (
                <span key={w} className="num rounded-sm bg-background px-2 py-1 text-sm text-gold">
                  {w}
                </span>
              ))}
            </div>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                navigator.clipboard.writeText(words.join(" "));
                toast.success("Code copied.");
              }}
            >
              <Copy className="mr-2 h-4 w-4" /> Copy code
            </Button>
            <Button className="w-full" disabled={busy} onClick={handleVerify}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Verify bio
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
