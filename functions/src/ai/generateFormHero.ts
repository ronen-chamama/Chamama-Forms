import * as admin from "firebase-admin";
import { onCall, CallableRequest } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import { CF_ACCOUNT_ID, CF_API_TOKEN, CF_IMAGE_MODEL, runCFModel } from "./cf";
import { v2 as TranslateV2 } from "@google-cloud/translate";

// ensure Admin initialized once
try {
  admin.app();
} catch {
  admin.initializeApp();
}

// נתוני קונפיג/ברירות מחדל
const DEFAULT_IMAGE_MODEL = "@cf/black-forest-labs/flux-1-schnell";

type Payload = { formId: string; title: string };

/**
 * בודק אם יש עברית/ערבית/כתב לא-לטיני — נשתמש פה לזיהוי אם צריך תרגום.
 */
function looksNonLatin(input: string) {
  // טווח עברית \u0590-\u05FF, ערבית \u0600-\u06FF; אפשר להרחיב בהמשך
  const nonLatin = /[\u0590-\u05FF\u0600-\u06FF]/;
  return nonLatin.test(input);
}

/**
 * תרגום/שכתוב כותרת לאנגלית קצרה — עכשיו עם Google Cloud Translation (הרשמי).
 * אם אין צורך/נכשל — נחזיר את המקור.
 */
async function translateToEnglishIfNeeded(title: string): Promise<string> {
  const trimmed = (title || "").trim();
  if (!trimmed) return "";

  if (!looksNonLatin(trimmed)) {
    logger.info("[hero] title looks Latin, skip translate", { title: trimmed });
    return trimmed;
  }

  // לקוח V2 — פשוט ויציב; משתמש ב-ADC של פונקציות.
  const translate = new TranslateV2.Translate();

  try {
    const [translated] = await translate.translate(trimmed, "en");
    const clean = String(translated ?? "").trim();
    logger.info("[hero] translatedPrompt (gcloud)", {
      original: trimmed,
      translated: clean,
    });
    return clean || trimmed;
  } catch (e: any) {
    logger.warn("[hero] translate (gcloud) failed, fallback to original", {
      error: String(e),
    });
    return trimmed;
  }
}

/**
 * בנייה עדינה של פרומפט "בטוח" ל-FLUX (SFW).
 */
function buildSafePrompt(englishShort: string) {
  const core = englishShort || "abstract minimal website header";
  return [
    "A manga style illustration of",
    core,
    "((no text)), ((no logos))",
    "high School, teenagers, education, colorful background",
  ].join(", ");
}

/**
 * שמירה ל-Storage במסלול forms/<formId>/hero.png ויצירת URL ציבורי עם token.
 */
async function savePngToStorage(formId: string, pngBase64: string): Promise<string> {
  const bucket = admin.storage().bucket();
  const path = `forms/${formId}/hero.png`;

  const buffer = Buffer.from(pngBase64, "base64");
  const token =
    (globalThis.crypto?.randomUUID?.() || require("crypto").randomUUID());

  await bucket.file(path).save(buffer, {
    contentType: "image/png",
    public: false,
    metadata: {
      cacheControl: "public, max-age=31536000, immutable",
      metadata: {
        firebaseStorageDownloadTokens: token,
      },
    },
  });

  const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(
    path
  )}?alt=media&token=${token}`;
  return url;
}

/**
 * פונקציית ה-Callable — יוצרת הירו, שומרת ב-Storage, מעדכנת ב-forms/{id}.heroUrl ומחזירה heroUrl.
 */
export const generateFormHero = onCall<Payload>(
  {
    region: "us-central1",
    timeoutSeconds: 60,
    memory: "512MiB",
    secrets: [CF_ACCOUNT_ID, CF_API_TOKEN, CF_IMAGE_MODEL],
  },
  async (req: CallableRequest<Payload>) => {
    const formId = (req.data?.formId || "").trim();
    const title  = (req.data?.title  || "").trim();

    if (!formId || !title) {
      logger.warn("[hero] missing formId/title", { formIdOk: !!formId, titleOk: !!title });
      throw new Error("formId and title are required");
    }

    const imageModel = CF_IMAGE_MODEL.value() || DEFAULT_IMAGE_MODEL;
    logger.info("[hero] start", { formId, imageModel });

    // שלב 1: תרגום/שכתוב לאנגלית (רק אם צריך) + לוג
    const english = await translateToEnglishIfNeeded(title);
    const prompt  = buildSafePrompt(english);
    logger.info("[hero] finalPromptForImage", { prompt });

    // שלב 2: יצירת תמונה עם FLUX — ללא שינוי
    const w = 1344, h = 768; // 16:9
    const genBody = {
      prompt,
      width: w,
      height: h,
      steps: 6, // FLUX Schnell מגביל ל-<=8
    };

    let imageB64: string | undefined;
    try {
      const res = await runCFModel(imageModel, genBody);
      imageB64 = (res as any)?.result?.image || (res as any)?.image || "";
    } catch (e: any) {
      logger.error("[hero] image model failed", { error: String(e) });
      throw new Error("image_generation_failed");
    }

    if (!imageB64) {
      logger.error("[hero] empty image payload");
      throw new Error("empty_image");
    }

    // שלב 3: שמירה ל-Storage והחזרת URL
    const heroUrl = await savePngToStorage(formId, imageB64);

    // עדכון השדה ב-forms/<id>
    try {
      const db = admin.firestore();
      await db.collection("forms").doc(formId).set({ heroUrl }, { merge: true });
    } catch (e: any) {
      logger.warn("[hero] failed to update Firestore (forms.heroUrl) — still returning URL", {
        formId, error: String(e),
      });
    }

    logger.info("[hero] done", { formId, heroUrl });

    return { heroUrl, translatedPrompt: english };
  }
);
