// functions/src/ai/generateFormHero.ts
import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { generateFluxImageBase64, toEnglishIfNeeded } from "./cf";

try { admin.app(); } catch { admin.initializeApp(); }

export const generateFormHero = onCall(
  { region: "us-central1", timeoutSeconds: 120, memory: "1GiB" },
  async (req) => {
    const { formId, title } = (req.data || {}) as { formId?: string; title?: string };
    if (!formId || !title) {
      throw new HttpsError("invalid-argument", "formId and title are required");
    }

    // 1) תרגום (אם צריך)
    const titleEn = await toEnglishIfNeeded(title);

    // 2) פרומפט “חכם” קצר ללא טקסט בתמונה
    const style =
      "professional minimal school form cover, clean composition, soft vivid colors, vector/flat illustration, no text, high quality";
    const prompt = `${style}. topic: ${titleEn}`.slice(0, 1500);

    // 3) יצירת תמונה
    const b64 = await generateFluxImageBase64(prompt, 6);
    const buffer = Buffer.from(b64, "base64");

    // 4) העלאה ל-Storage
    const bucket = admin.storage().bucket();
    const filePath = `forms/${formId}/hero-${Date.now()}.jpg`;

    const token =
      (globalThis as any).crypto?.randomUUID?.() || Math.random().toString(36).slice(2);

    await bucket.file(filePath).save(buffer, {
      resumable: false,
      metadata: {
        contentType: "image/jpeg",
        cacheControl: "public, max-age=31536000",
        metadata: { firebaseStorageDownloadTokens: token },
      },
    });

    const heroUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(
      filePath
    )}?alt=media&token=${token}`;

    // 5) עדכון הטופס
    await admin.firestore().collection("forms").doc(formId).set(
      { heroUrl, updatedAt: Date.now() },
      { merge: true }
    );

    return { heroUrl };
  }
);
