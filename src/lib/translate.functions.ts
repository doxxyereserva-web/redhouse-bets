import { createServerFn } from "@tanstack/react-start";

type Input = { language: string; strings: string[] };

export const translateStrings = createServerFn({ method: "POST" })
  .inputValidator((input: Input) => {
    if (!input || typeof input.language !== "string" || !Array.isArray(input.strings)) {
      throw new Error("Invalid input");
    }
    return { language: input.language, strings: input.strings.slice(0, 200).map(String) };
  })
  .handler(async ({ data }): Promise<{ translations: Record<string, string>; error?: string }> => {
    if (data.strings.length === 0) return { translations: {} };
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { translations: {}, error: "AI is not configured." };

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "google/gemini-3.7-flash",
        messages: [
          {
            role: "system",
            content:
              "You localize UI strings for an online casino-style gaming app. Return ONLY a JSON object mapping each source English string to its translation. Keep placeholders, numbers, brand names (RedHouse, Robux, Roblox) and game names untranslated when they are proper nouns. Keep translations short enough for UI labels.",
          },
          {
            role: "user",
            content: `Target language: ${data.language}\nStrings: ${JSON.stringify(data.strings)}`,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (res.status === 429) return { translations: {}, error: "Too many translation requests. Try again shortly." };
    if (res.status === 402) return { translations: {}, error: "AI credits are exhausted for this workspace." };
    if (!res.ok) return { translations: {}, error: `Translation failed (${res.status}).` };

    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = json.choices?.[0]?.message?.content ?? "{}";
    try {
      const parsed = JSON.parse(content) as Record<string, unknown>;
      const out: Record<string, string> = {};
      for (const [k, v] of Object.entries(parsed)) if (typeof v === "string") out[k] = v;
      return { translations: out };
    } catch {
      return { translations: {}, error: "Unexpected translation response." };
    }
  });
