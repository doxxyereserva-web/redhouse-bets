import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const WORDS = [
  "crimson","vault","joker","orbit","pixel","tiger","nebula","cobalt","falcon","matrix",
  "lucky","spade","rocket","velvet","onyx","zenith","cipher","quartz","dragon","echo",
  "harbor","ivory","jackpot","kingdom","lantern","mirage","nitro","oracle","phantom","quasar",
  "ruby","sable","thunder","umbra","vortex","whisper","xenon","yonder","zephyr","anchor",
];

function makeCode() {
  const out: string[] = [];
  const pool = [...WORDS];
  for (let i = 0; i < 8; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    out.push(pool.splice(idx, 1)[0]!);
  }
  return out.join(" ");
}

async function robloxLookup(username: string) {
  const res = await fetch("https://users.roblox.com/v1/usernames/users", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ usernames: [username], excludeBannedUsers: false }),
  });
  if (!res.ok) throw new Error("Roblox is not responding right now.");
  const json = (await res.json()) as { data?: Array<{ id: number; name: string; displayName: string }> };
  const user = json.data?.[0];
  if (!user) throw new Error("Roblox user not found.");
  const thumbRes = await fetch(
    `https://thumbnails.roblox.com/v1/users/avatar?userIds=${user.id}&size=420x420&format=Png&isCircular=false`,
  );
  const thumbJson = (await thumbRes.json().catch(() => ({}))) as {
    data?: Array<{ imageUrl?: string }>;
  };
  return {
    robloxId: user.id,
    username: user.name,
    displayName: user.displayName,
    avatarUrl: thumbJson.data?.[0]?.imageUrl ?? null,
  };
}

export const lookupRobloxUser = createServerFn({ method: "POST" })
  .inputValidator((data: { username: string }) =>
    z.object({ username: z.string().trim().min(3).max(20) }).parse(data),
  )
  .handler(async ({ data }) => robloxLookup(data.username));

export const startVerification = createServerFn({ method: "POST" })
  .inputValidator((data: { robloxId: number; username: string }) =>
    z.object({ robloxId: z.number().int().positive(), username: z.string().min(1).max(50) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const code = makeCode();
    await supabaseAdmin.from("roblox_verifications").delete().eq("roblox_id", data.robloxId);
    const { error } = await supabaseAdmin.from("roblox_verifications").insert({
      roblox_id: data.robloxId,
      username: data.username,
      code,
    });
    if (error) throw new Error("Could not start verification. Try again.");
    return { code, words: code.split(" "), expiresInSeconds: 600 };
  });

export const verifyRobloxBio = createServerFn({ method: "POST" })
  .inputValidator((data: { robloxId: number }) =>
    z.object({ robloxId: z.number().int().positive() }).parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: row } = await supabaseAdmin
      .from("roblox_verifications")
      .select("*")
      .eq("roblox_id", data.robloxId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!row) throw new Error("No pending verification. Start again.");
    if (new Date(row.expires_at).getTime() < Date.now()) {
      throw new Error("Verification code expired. Generate a new one.");
    }

    const profileRes = await fetch(`https://users.roblox.com/v1/users/${data.robloxId}`);
    if (!profileRes.ok) throw new Error("Could not read your Roblox profile.");
    const profile = (await profileRes.json()) as { description?: string; name: string; displayName: string };
    const bio = (profile.description ?? "").toLowerCase().replace(/\s+/g, " ");

    if (!bio.includes(row.code.toLowerCase())) {
      throw new Error("Code not found in your bio yet. Paste it, save, then verify again.");
    }

    const email = `roblox-${data.robloxId}@redhouse.demo`;
    let userId: string | null = null;

    const created = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { roblox_id: data.robloxId, username: profile.name },
    });

    if (created.data.user) {
      userId = created.data.user.id;
    } else {
      const { data: existing } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("roblox_id", data.robloxId)
        .maybeSingle();
      userId = existing?.id ?? null;
    }

    if (!userId) throw new Error("Could not create your RedHouse account.");

    const thumb = await robloxLookup(profile.name).catch(() => null);

    await supabaseAdmin.from("profiles").upsert(
      {
        id: userId,
        roblox_id: data.robloxId,
        username: profile.name,
        display_name: profile.displayName ?? profile.name,
        avatar_url: thumb?.avatarUrl ?? null,
      },
      { onConflict: "id" },
    );

    await supabaseAdmin.from("roblox_verifications").delete().eq("roblox_id", data.robloxId);

    const link = await supabaseAdmin.auth.admin.generateLink({ type: "magiclink", email });
    const tokenHash = link.data?.properties?.hashed_token;
    if (!tokenHash) throw new Error("Could not open your session. Try again.");

    return { tokenHash };
  });
