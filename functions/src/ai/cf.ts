// functions/src/ai/cf.ts
import { HttpsError } from "firebase-functions/v2/https";

                                     
const ACCOUNT_ID = process.env.CF_ACCOUNT_ID ?? "";
const API_TOKEN  = process.env.CF_API_TOKEN  ?? "";

                  
function assertCreds() {
  if (!ACCOUNT_ID || !API_TOKEN) {
    throw new HttpsError("failed-precondition", "Missing CF_ACCOUNT_ID / CF_API_TOKEN");
  }
}

                                         
async function runWorkersAi(model: string, input: any) {
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

                    
function looksHebrew(s: string) {
  return /[\u0590-\u05FF]/.test(s || "");
}

                                
export async function toEnglishIfNeeded(title: string) {
  if (!looksHebrew(title)) return title;

                                      
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

                                                     
export async function generateFluxImageBase64(prompt: string, steps = 6) {
  const out = await runWorkersAi("@cf/black-forest-labs/flux-1-schnell", {
    prompt,
    steps,             
  });

  const b64 =
    out?.result?.image ??
    out?.image ??
    (Array.isArray(out?.result) ? out.result[0]?.image : undefined);

  if (!b64) throw new HttpsError("internal", "No image returned from Workers AI");
  return String(b64);
}
