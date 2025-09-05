import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import * as fs from "fs";
import * as path from "path";
import puppeteer, { Browser } from "puppeteer";

type Field = {
  id: string;
  type: "richtext" | "text" | "phone" | "email" | "select" | "radio" | "checkbox" | "signature";
  label: string;
  options?: string[];
  required?: boolean;
};

// ---- אתחול Firebase עם bucket ברירת מחדל (חשוב ל-Storage גם באמולטור) ----
const firebaseConfigEnv = process.env.FIREBASE_CONFIG ? JSON.parse(process.env.FIREBASE_CONFIG) : null;
const PROJECT_ID =
  process.env.GCLOUD_PROJECT ||
  process.env.GCP_PROJECT ||
  firebaseConfigEnv?.projectId ||
  "demo-chamama";
const DEFAULT_BUCKET = process.env.STORAGE_BUCKET || `${PROJECT_ID}.appspot.com`;

admin.initializeApp({ storageBucket: DEFAULT_BUCKET });

// ---- עזרי קבצים/טקסט ----
function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
function isStorageEmulator() {
  return !!process.env.FIREBASE_STORAGE_EMULATOR_HOST;
}
function emulatorDownloadUrl(bucketName: string, objectPath: string) {
  const host = process.env.FIREBASE_STORAGE_EMULATOR_HOST || "localhost:9199";
  const enc = encodeURIComponent(objectPath);
  return `http://${host}/v0/b/${bucketName}/o/${enc}?alt=media`;
}
function fail(code: functions.https.FunctionsErrorCode, message: string, details?: any): never {
  console.error("[makePdf error]", message, details || "");
  throw new functions.https.HttpsError(code, message, details);
}

// ---- נתיבי נכסים (אחרי build __dirname מצביע ל-/lib) ----
const ASSETS_DIR = path.resolve(__dirname, "../assets");
const TEMPLATE_PATH = path.join(ASSETS_DIR, "templates", "submission.html");
const CSS_PATH = path.join(ASSETS_DIR, "styles", "pdf.css");
const FONT_PATH = path.join(ASSETS_DIR, "fonts", "NotoSansHebrew-Regular.ttf");

export const makePdf = functions
  .runWith({ memory: "1GB", timeoutSeconds: 120 })
  .https.onCall(async (data) => {
    const formId: string = data?.formId;
    const submissionId: string = data?.submissionId;
    if (!formId || !submissionId) {
      fail("invalid-argument", "formId & submissionId are required");
    }

    console.log("[makePdf start]", { formId, submissionId, bucket: DEFAULT_BUCKET, ASSETS_DIR });

    // בדיקת קיום נכסים מראש
    const missing: string[] = [];
    if (!fs.existsSync(TEMPLATE_PATH)) missing.push(TEMPLATE_PATH);
    if (!fs.existsSync(CSS_PATH)) missing.push(CSS_PATH);
    if (!fs.existsSync(FONT_PATH)) missing.push(FONT_PATH);
    if (missing.length) {
      fail("failed-precondition", "Missing asset files", { missing });
    }

    // משיכת נתונים
    const db = admin.firestore();
    const [formSnap, subSnap] = await Promise.all([
      db.doc(`forms/${formId}`).get(),
      db.doc(`forms/${formId}/submissions/${submissionId}`).get(),
    ]);
    if (!formSnap.exists || !subSnap.exists) {
      fail("not-found", "form or submission not found", {
        formExists: formSnap.exists,
        subExists: subSnap.exists,
      });
    }
    const form = formSnap.data();
    const submission = subSnap.data() as any;

    // קרא נכסים
    const templateHtml = fs.readFileSync(TEMPLATE_PATH, "utf8");
    const css = fs.readFileSync(CSS_PATH, "utf8");
    const fontBase64 = fs.readFileSync(FONT_PATH).toString("base64");
    const fontDataUrl = `data:font/ttf;base64,${fontBase64}`;

    // בנה HTML RTL
    const schema: Field[] = (form?.schema || []) as Field[];
    const answers: Record<string, any> = submission?.answers || {};
    const rows = schema
      .filter((f) => f.type !== "signature")
      .map((f) => {
        let v = answers[f.id];
        if (v == null) v = "";
        if (Array.isArray(v)) v = v.join(", ");
        if (f.type === "richtext") v = stripHtml(String(v));
        return `<div class="row"><div class="label">${f.label}</div><div class="value">${String(v)}</div></div>`;
      })
      .join("\n");

    const sigImg = submission?.signatureUrl
      ? `<div class="signature"><div class="sig-label">חתימה:</div><img src="${submission.signatureUrl}" alt="signature"/></div>`
      : "";

    const style = `
      <style>
        @font-face {
          font-family: 'NotoHeb';
          src: url('${fontDataUrl}') format('truetype');
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }
        ${css}
      </style>`;

   const titleText = String(form?.title || "טופס");

    const html = templateHtml
  .replace(/<!--STYLE-->/, style)            // סגנונות
  .replace(/{{\s*title\s*}}/gi, titleText)   // כותרת — תומך גם {{TITLE}} וגם {{title}}
  .replace(/{{\s*rows\s*}}/gi, rows)         // שורות השדות
  .replace(/{{\s*signature\s*}}/gi, sigImg); // חתימה

    // הפקת PDF
    let browser: Browser | null = null; // ← שינוי כאן
    try {
      const execPath = puppeteer.executablePath();
      console.log("[makePdf] launching Chromium", { execPath });

      browser = await puppeteer.launch({
        executablePath: execPath,
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
      });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });
      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" },
        preferCSSPageSize: true,
      });

      // שמירה ל-Storage
      const bucket = admin.storage().bucket();
      const objectPath = `pdf/${formId}/${submissionId}.pdf`;
      console.log("[makePdf] saving to bucket", { bucket: bucket.name, objectPath });
      await bucket.file(objectPath).save(pdfBuffer, { contentType: "application/pdf" });

      // URL
      const pdfUrl = isStorageEmulator()
        ? emulatorDownloadUrl(bucket.name, objectPath)
        : (await bucket.file(objectPath).getSignedUrl({
            action: "read",
            expires: Date.now() + 1000 * 60 * 60 * 24 * 365,
          }))[0];

      await db.doc(`forms/${formId}/submissions/${submissionId}`).update({ pdfUrl });
      console.log("[makePdf] done", { pdfUrl });

      return { pdfUrl };
    } catch (err: any) {
      fail("internal", err?.message || "PDF generation failed", {
        name: err?.name,
        stack: err?.stack?.split("\n").slice(0, 5).join("\n"),
      });
    } finally {
      if (browser) await browser.close().catch(() => {});
    }
  });
