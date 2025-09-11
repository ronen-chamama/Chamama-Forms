// functions/src/ai/cf.ts
import fetch from "node-fetch";

/** זיהוי טקסט בעברית */
export function looksHebrew(s: string): boolean {
  return /[\u0590-\u05FF]/.test(s);
}

/** type guard לאובייקט JSON כללי */
type Json = Record<string, unknown>;
function isRecord(x: unknown): x is Json {
  return typeof x === "object" && x !== null;
}

/** חילוץ טקסט מתורגם מתשובת Workers AI (אפשר כמה פורמטים) */
function extractTranslatedText(out: unknown): string | undefined {
  if (!isRecord(out)) return undefined;

  // out.result.translated_text
  if (isRecord(out.result) && typeof (out.result as Json).translated_text === "string") {
    return (out.result as Json).translated_text as string;
  }
  // out.translated_text
  if (typeof (out as Json).translated_text === "string") {
    return (out as Json).translated_text as string;
  }
  // אלטרנטיבות נפוצות
  if (isRecord(out.result) && typeof (out.result as Json).output_text === "string") {
    return (out.result as Json).output_text as string;
  }
  if (typeof (out as Json).output_text === "string") {
    return (out as Json).output_text as string;
  }
  return undefined;
}

/** חילוץ תמונה Base64 מתשובת Workers AI (אובייקט/מערך) */
function extractImageB64(out: unknown): string | undefined {
  if (!isRecord(out)) return undefined;

  // out.image
  if (typeof (out as Json).image === "string") {
    return (out as Json).image as string;
  }
  // out.result.image
  if (isRecord(out.result) && typeof (out.result as Json).image === "string") {
    return (out.result as Json).image as string;
  }
  // out.result[0].image
  const res = (out as Json).result;
  if (Array.isArray(res)) {
    const first = res[0] as unknown;
    if (isRecord(first) && typeof (first as Json).image === "string") {
      return (first as Json).image as string;
    }
  }
  return undefined;
}

/** קריאה כללית ל-Workers AI דרך Gateway (אם קיים) או ישירות דרך accounts */
export async function runWorkersAi(model: string, payload: unknown): Promise<unknown> {
  const accountId = process.env.CF_ACCOUNT_ID;
  const apiToken  = process.env.CF_API_TOKEN;
  const gateway   = process.env.CF_GATEWAY_URL;

  const url = gateway
    ? `${gateway.replace(/\/+$/, "")}/models/${encodeURIComponent(model)}`
    : `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${encodeURIComponent(model)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(gateway ? {} : { Authorization: `Bearer ${apiToken}` }),
    },
    body: JSON.stringify(payload ?? {}),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Workers AI ${res.status}: ${txt}`);
  }
  return res.json().catch(() => ({}));
}

/** תרגום לעברית→אנגלית רק אם באמת צריך */
export async function translateIfHebrewToEnglish(text: string): Promise<string> {
  if (!looksHebrew(text)) return text;
  // עדכן למודל/פרמטרים שלך אם צריך
  const out = await runWorkersAi("@cf/meta/m2m100-1.2b", { text, target_lang: "en" });
  return extractTranslatedText(out) ?? text;
}

/** יצירת תמונה ומחזיר Base64 (ללא prefix) */
export async function generateImageB64FromPrompt(model: string, prompt: string): Promise<string> {
  const out = await runWorkersAi(model, { prompt });
  const img = extractImageB64(out);
  if (!img) throw new Error("Workers AI: no image in response");
  return img;
}
