// functions/src/ai/cf.ts
import { HttpsError } from "firebase-functions/v2/https";

// קרדנציאלס מה־env (ראה הוראות למטה)
const ACCOUNT_ID = process.env.CF_ACCOUNT_ID ?? "";
const API_TOKEN  = process.env.CF_API_TOKEN  ?? "";

// בדיקת קרדנציאלס
function assertCreds() {
  if (!ACCOUNT_ID || !API_TOKEN) {
    throw new HttpsError("failed-precondition", "Missing CF_ACCOUNT_ID / CF_API_TOKEN");
  }
}

// קריאה כללית למודל של Workers AI (REST)
export async function runWorkersAi(model: string, input: any) {
  assertCreds();
  const url = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(
    ACCOUNT_ID
  )}/ai/run/${encodeURIComponent(model)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new HttpsError("internal", `Cloudflare AI error ${res.status}: ${body}`);
  }
  return res.json();
}

// זיהוי עברית בסיסי
export function looksHebrew(s: string) {
  return /[\u0590-\u05FF]/.test(s || "");
}

// תרגום לעברית→אנגלית (אם צריך)
export async function toEnglishIfNeeded(title: string) {
  if (!looksHebrew(title)) return title;

  // מודל תרגום של Cloudflare (M2M100)
  const out = await runWorkersAi("@cf/meta/m2m100-1.2b", {
    text: String(title),
    source_lang: "hebrew",
    target_lang: "english",
  });

  const translated =
    out?.result?.translated_text ??
    out?.translated_text ??
    "";
  return translated || title;
}

// יצירת תמונה עם FLUX schnell – מחזיר Base64 של JPEG
export async function generateFluxImageBase64(prompt: string, steps = 6) {
  const out = await runWorkersAi("@cf/black-forest-labs/flux-1-schnell", {
    prompt,
    steps, // 1–8 מקובל
  });

  const b64 =
    out?.result?.image ??
    out?.image ??
    (Array.isArray(out?.result) ? out.result[0]?.image : undefined);

  if (!b64) throw new HttpsError("internal", "No image returned from Workers AI");
  return String(b64);
}
