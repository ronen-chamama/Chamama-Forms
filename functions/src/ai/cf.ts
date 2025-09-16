import { defineSecret } from "firebase-functions/params";
import { logger } from "firebase-functions";

/**
 * סודות "חובה" בלבד — אין כאן CF_TRANSLATE_MODEL כדי לא לחייב אותו בזמן deploy.
 */
export const CF_ACCOUNT_ID = defineSecret("CF_ACCOUNT_ID");
export const CF_API_TOKEN  = defineSecret("CF_API_TOKEN");
export const CF_IMAGE_MODEL = defineSecret("CF_IMAGE_MODEL");

/**
 * הרצה כללית של מודל ב-Cloudflare Workers AI.
 * משמשת גם לטקסט (llama) וגם לתמונה (flux).
 */
export async function runCFModel(model: string, body: unknown) {
  const accountId = CF_ACCOUNT_ID.value();
  const token     = CF_API_TOKEN.value();
  if (!accountId || !token) {
    throw new Error("Missing CF account/token secrets");
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(body ?? {}),
  });

  const text = await res.text();
  if (!res.ok) {
    logger.error("[cf.run] HTTP error", { status: res.status, text, model, url });
    throw new Error(`CF_HTTP_${res.status}: ${text}`);
  }

  try {
    return JSON.parse(text);
  } catch {
    // יש מודלים שמחזירים טקסט פשוט — נחזיר אותו כמו שהוא
    return { result: text, raw: text };
  }
}
