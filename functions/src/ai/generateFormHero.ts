// functions/src/ai/generateFormHero.ts
import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { translateIfHebrewToEnglish, generateImageB64FromPrompt } from "./cf";

if (!admin.apps.length) admin.initializeApp();

export const generateFormHero = onCall({ cors: true, region: "us-central1" }, async (req) => {
  try {
    const uid = req.auth?.uid;
    if (!uid) throw new HttpsError("unauthenticated", "Must be signed in.");

    const rawTitle = (req.data?.title ?? "").toString().trim();
    if (!rawTitle) throw new HttpsError("invalid-argument", "Missing title.");

    // אם תרצה לא לייצר כששמירה אוטומטית – שלח flag מהקליינט ובדוק כאן (alreadyHandled וכו').
    const englishTitle = await translateIfHebrewToEnglish(rawTitle);

    // פרומפט בסיסי — אתה מוזמן לחדד סגנון/צבעוניות
    const prompt =
      `Generate a square, colorful, clean cover image for a high-school form titled: "${englishTitle}". ` +
      `Vector/flat illustration style, friendly, minimal, no text, no watermark. Education theme.`;

    const model = process.env.CF_IMAGE_MODEL || "@cf/black-forest-labs/flux-1-schnell";

    const b64 = await generateImageB64FromPrompt(model, prompt);

    // מחזירים כמה שמות כדי להיות תואמים לקליינט בכל מצב
    return {
      image: b64,                           // Base64 ללא prefix
      imageBase64: b64,                     // אליאס
      dataUrl: `data:image/png;base64,${b64}`, // נוח לשימוש ישיר בתגית <img>
      contentType: "image/png",
      title: rawTitle,
    };
  } catch (err: unknown) {
    logger.error("generateFormHero failed", err);
    if (err instanceof HttpsError) throw err;
    const msg = (err as any)?.message ?? "internal error";
    throw new HttpsError("internal", msg);
  }
});
