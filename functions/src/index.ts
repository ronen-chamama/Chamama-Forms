import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import * as fs from "fs";
import * as path from "path";
import puppeteer, { Browser } from "puppeteer";
import { google } from "googleapis";
import { Readable } from "stream";

/** טיפוס שדה בסיסי (ל־legacy PDF) */
type Field = {
  id: string;
  type: "richtext" | "text" | "phone" | "email" | "select" | "radio" | "checkbox" | "signature";
  label: string;
  options?: string[];
  required?: boolean;
};

/** אתחול Firebase עם bucket ברירת מחדל (ל־Storage ב־legacy) */
const firebaseConfigEnv = process.env.FIREBASE_CONFIG ? JSON.parse(process.env.FIREBASE_CONFIG) : null;
const PROJECT_ID =
  process.env.GCLOUD_PROJECT ||
  process.env.GCP_PROJECT ||
  firebaseConfigEnv?.projectId ||
  "demo-chamama";
const DEFAULT_BUCKET = process.env.STORAGE_BUCKET || `${PROJECT_ID}.appspot.com`;

admin.initializeApp({ storageBucket: DEFAULT_BUCKET });

/** עזרי טקסט/שגיאות */
function stripHtml(html: string) {
  return String(html).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
function isStorageEmulator() {
  return !!process.env.FIREBASE_STORAGE_EMULATOR_HOST;
}
function emulatorDownloadUrl(bucketName: string, objectPath: string) {
  const host = process.env.FIREBASE_STORAGE_EMULATOR_HOST || "127.0.0.1:9199";
  const enc = encodeURIComponent(objectPath);
  return `http://${host}/v0/b/${bucketName}/o/${enc}?alt=media`;
}
function fail(code: functions.https.FunctionsErrorCode, message: string, details?: any): never {
  console.error("[func error]", message, details || "");
  throw new functions.https.HttpsError(code, message, details);
}
/** שומר עברית ואנגלית, רווח/נקודה/מקף/קו תחתון */
function safeFileName(s: string) {
  return (s || "")
    .toString()
    .normalize("NFKD")
    .replace(/[^\w\u0590-\u05FF\s.\-]/g, "")
    .trim()
    .replace(/\s+/g, " ");
}

/** נתיבי נכסים (אחרי build __dirname מצביע ל-/lib) */
const ASSETS_DIR = path.resolve(__dirname, "../assets");
const TEMPLATE_PATH = path.join(ASSETS_DIR, "templates", "submission.html");
const CSS_PATH = path.join(ASSETS_DIR, "styles", "pdf.css");
const FONT_PATH = path.join(ASSETS_DIR, "fonts", "NotoSansHebrew-Regular.ttf");

/** יצירת/איתור תיקייה בדרייב (תומך גם בכוננים שיתופיים) */
async function ensureFolder(drive: any, name: string, parentId: string): Promise<string> {
  const esc = String(name).replace(/'/g, "\\'");
  const q = `name = '${esc}' and mimeType = 'application/vnd.google-apps.folder' and '${parentId}' in parents and trashed = false`;

  const { data } = await drive.files.list({
    q,
    fields: "files(id,name)",
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
    pageSize: 10,
  });

  if (data.files && data.files.length > 0 && data.files[0].id) {
    return data.files[0].id as string;
  }

  const create = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    },
    fields: "id",
    supportsAllDrives: true,
  });

  if (!create.data.id) throw new Error("Failed to create Drive folder (no id returned)");
  return create.data.id;
}

/* =========================================================================
   (1) NEW: submitFormToDrive — ייצור PDF ושמירה ל-Google Drive
   ROOT → <קבוצה> → <שם הטופס> → "<שם החניכ.ה> - <קבוצה> - <כותרת הטופס>.pdf"
   ========================================================================= */

export const submitFormToDrive = functions
  .runWith({ memory: "1GB", timeoutSeconds: 120 })
  .https.onCall(async (data) => {
    const formId: string = data?.formId;
    const answers: Record<string, any> = data?.answers || {};
    const signatureDataUrl: string | null = data?.signatureDataUrl || null;

    if (!formId) fail("invalid-argument", "formId is required");

    // טען טופס
    const db = admin.firestore();
    const formSnap = await db.doc(`forms/${formId}`).get();
    if (!formSnap.exists) fail("not-found", "form not found");
    const form = formSnap.data() as any;

    const title = String(form?.title || "טופס");
    const schema: Array<{ id: string; type: string; label: string; options?: string[] }> = form?.schema || [];

    // שדות חובה גלובליים
    const studentName = String(answers["studentName"] || "").trim();
    const groupVal = String(answers["group"] || "").trim();
    if (!studentName) fail("invalid-argument", "studentName is required");
    if (!groupVal) fail("invalid-argument", "group is required");

    // נכסי PDF
    const missing: string[] = [];
    if (!fs.existsSync(TEMPLATE_PATH)) missing.push(TEMPLATE_PATH);
    if (!fs.existsSync(CSS_PATH)) missing.push(CSS_PATH);
    if (!fs.existsSync(FONT_PATH)) missing.push(FONT_PATH);
    if (missing.length) fail("failed-precondition", "Missing asset files", { missing });

    const templateHtml = fs.readFileSync(TEMPLATE_PATH, "utf8");
    const css = fs.readFileSync(CSS_PATH, "utf8");
    const fontBase64 = fs.readFileSync(FONT_PATH).toString("base64");
    const fontDataUrl = `data:font/ttf;base64,${fontBase64}`;

    const escHtml = (s: any) =>
      String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

    const metaRows =
      `<div class="row"><div class="label">שם החניכ.ה</div><div class="value">${escHtml(studentName)}</div></div>` +
      `<div class="row"><div class="label">קבוצה</div><div class="value">${escHtml(groupVal)}</div></div>`;

    const rowsFromSchema = schema
      .filter((f) => f.type !== "signature")
      .map((f) => {
        let v = answers[f.id];
        if (v == null) v = "";
        if (Array.isArray(v)) v = v.join(", ");
        if (f.type === "richtext") v = stripHtml(String(v));
        return `<div class="row"><div class="label">${escHtml(f.label)}</div><div class="value">${escHtml(v)}</div></div>`;
      })
      .join("\n");

    const sigHtml = signatureDataUrl
      ? `<div class="signature"><div class="sig-label">חתימה:</div><img src="${signatureDataUrl}" alt="signature"/></div>`
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

    const html = templateHtml
      .replace(/<!--STYLE-->/, style)
      .replace(/{{\s*title\s*}}/gi, escHtml(title))
      .replace(/{{\s*rows\s*}}/gi, metaRows + rowsFromSchema)
      .replace(/{{\s*signature\s*}}/gi, sigHtml);

    // יצירת PDF
    let browser: Browser | null = null;
    try {
      browser = await puppeteer.launch({
        executablePath: puppeteer.executablePath(),
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

      // Google Drive
      const DRIVE_ROOT = process.env.DRIVE_ROOT_FOLDER_ID;
      if (!DRIVE_ROOT) fail("failed-precondition", "DRIVE_ROOT_FOLDER_ID is not set");

      const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/drive.file"] });
      const client = await auth.getClient();
      const projectId =
        (await auth.getProjectId().catch(() => process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT)) ||
        null;

      console.log("[ADC identity]", {
        projectId,
        clientType: (client as any)?.constructor?.name,
        clientEmail: (client as any).email || (client as any).subject || null,
      });

      const drive = google.drive({ version: "v3", auth });

      // מבנה תיקיות: ROOT → קבוצה → שם הטופס
      const groupFolderId = await ensureFolder(drive, groupVal, DRIVE_ROOT);
      const formFolderId = await ensureFolder(drive, title, groupFolderId);

      const fileName = `${safeFileName(studentName)} - ${safeFileName(groupVal)} - ${safeFileName(title)}.pdf`;

      const createRes = await drive.files.create({
        requestBody: {
          name: fileName,
          parents: [formFolderId],
          mimeType: "application/pdf",
        },
        media: {
          mimeType: "application/pdf",
          body: Readable.from([pdfBuffer]), // ← חשוב: Stream, לא Buffer
        },
        fields: "id, webViewLink, webContentLink",
        supportsAllDrives: true,
      });

      // קאונטר (לא שומרים קבצים אונליין אצלנו)
      await db.doc(`forms/${formId}`).update({
        submissionCount: admin.firestore.FieldValue.increment(1),
      });

      return {
        driveFileId: createRes.data.id,
        webViewLink: createRes.data.webViewLink,
        webContentLink: createRes.data.webContentLink,
      };
    } catch (err: any) {
      fail("internal", err?.message || "Drive submission failed", {
        name: err?.name,
        stack: (err?.stack || "").split("\n").slice(0, 6).join("\n"),
      });
    } finally {
      if (browser) await browser.close().catch(() => {});
    }
  });

/* =========================================================================
   (2) LEGACY: makePdf — יצירת PDF ושמירה ל-Storage (לשימושי פיתוח)
   ========================================================================= */

export const makePdf = functions
  .runWith({ memory: "1GB", timeoutSeconds: 120 })
  .https.onCall(async (data) => {
    const formId: string = data?.formId;
    const submissionId: string = data?.submissionId;
    if (!formId || !submissionId) fail("invalid-argument", "formId & submissionId are required");

    console.log("[makePdf start]", { formId, submissionId, bucket: DEFAULT_BUCKET, ASSETS_DIR });

    // נכסים
    const missing: string[] = [];
    if (!fs.existsSync(TEMPLATE_PATH)) missing.push(TEMPLATE_PATH);
    if (!fs.existsSync(CSS_PATH)) missing.push(CSS_PATH);
    if (!fs.existsSync(FONT_PATH)) missing.push(FONT_PATH);
    if (missing.length) fail("failed-precondition", "Missing asset files", { missing });

    // נתונים
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

    // HTML
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
      .replace(/<!--STYLE-->/, style)
      .replace(/{{\s*title\s*}}/gi, titleText)
      .replace(/{{\s*rows\s*}}/gi, rows)
      .replace(/{{\s*signature\s*}}/gi, sigImg);

    // PDF
    let browser: Browser | null = null;
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

      // Storage (legacy)
      const bucket = admin.storage().bucket();
      const objectPath = `pdf/${formId}/${submissionId}.pdf`;
      const fileName = `${safeFileName(form?.title || "טופס")}-${submissionId}.pdf`;

      console.log("[makePdf] saving to bucket", { bucket: bucket.name, objectPath, fileName });

      await bucket.file(objectPath).save(pdfBuffer, {
        contentType: "application/pdf",
        metadata: {
          contentDisposition: `attachment; filename="${fileName}"`,
        },
      });

      const pdfUrl = isStorageEmulator()
        ? emulatorDownloadUrl(bucket.name, objectPath)
        : (
            await bucket
              .file(objectPath)
              .getSignedUrl({ action: "read", expires: Date.now() + 1000 * 60 * 60 * 24 * 365 })
          )[0];

      await db.doc(`forms/${formId}/submissions/${submissionId}`).update({ pdfUrl });
      console.log("[makePdf] done", { pdfUrl, fileName });

      return { pdfUrl, fileName };
    } catch (err: any) {
      fail("internal", err?.message || "PDF generation failed", {
        name: err?.name,
        stack: (err?.stack || "").split("\n").slice(0, 5).join("\n"),
      });
    } finally {
      if (browser) await browser.close().catch(() => {});
    }
  });
