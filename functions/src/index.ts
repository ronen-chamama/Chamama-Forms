import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import * as fs from "fs";
import * as path from "path";
import puppeteer from "puppeteer";

admin.initializeApp();

type Field = {
  id: string;
  type: "richtext" | "text" | "phone" | "email" | "select" | "radio" | "checkbox" | "signature";
  label: string;
  options?: string[];
  required?: boolean;
};

function readFileUtf8(p: string) {
  return fs.readFileSync(p, { encoding: "utf8" });
}
function readFileBase64(p: string) {
  const buf = fs.readFileSync(p);
  return buf.toString("base64");
}

// הפיכת HTML שדה עשיר לטקסט קצר (לשימוש ב-PDF לצד הצגה עשירה)
function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function renderHtml(form: any, submission: any, fontDataUrl: string, css: string, templateHtml: string) {
  const schema: Field[] = form?.schema || [];
  const answers: Record<string, any> = submission?.answers || {};
  const rows = schema
    .filter((f) => f.type !== "signature") // חתימה נציג כתמונה נפרד
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

  // הטמעת הגופן וה-CSS ישירות לתוך הדף
  const fontFace = `
  @font-face {
    font-family: 'NotoHeb';
    src: url('${fontDataUrl}') format('truetype');
    font-weight: 400;
    font-style: normal;
    font-display: swap;
  }`;

  const style = `
  <style>
    ${fontFace}
    ${css}
  </style>`;

  // תבנית בסיסית עם placeholders
  return templateHtml
    .replace("<!--STYLE-->", style)
    .replace("{{TITLE}}", String(form?.title || "טופס"))
    .replace("{{ROWS}}", rows)
    .replace("{{SIGNATURE}}", sigImg);
}

function isEmulator() {
  return !!process.env.FIRESTORE_EMULATOR_HOST || !!process.env.FIREBASE_STORAGE_EMULATOR_HOST;
}

// יוצר קישור הורדה ידידותי באמולטור
function emulatorDownloadUrl(bucketName: string, objectPath: string, token?: string) {
  const host = process.env.FIREBASE_STORAGE_EMULATOR_HOST || "localhost:9199";
  const enc = encodeURIComponent(objectPath);
  const q = token ? `&token=${token}` : "";
  return `http://${host}/v0/b/${bucketName}/o/${enc}?alt=media${q}`;
}

export const makePdf = functions.https.onCall(async (data, context) => {
  // data: { formId, submissionId }
  const formId = data?.formId;
  const submissionId = data?.submissionId;
  if (!formId || !submissionId) {
    throw new functions.https.HttpsError("invalid-argument", "formId & submissionId are required");
  }

  // משיכת נתונים
  const db = admin.firestore();
  const formRef = db.doc(`forms/${formId}`);
  const subRef = db.doc(`forms/${formId}/submissions/${submissionId}`);
  const [formSnap, subSnap] = await Promise.all([formRef.get(), subRef.get()]);
  if (!formSnap.exists || !subSnap.exists) {
    throw new functions.https.HttpsError("not-found", "form or submission not found");
  }
  const form = formSnap.data();
  const submission = subSnap.data();

  // קריאת תבניות/נכסים
  const assetsDir = path.join(process.cwd(), "assets");
  const templateHtml = readFileUtf8(path.join(assetsDir, "templates", "submission.html"));
  const css = readFileUtf8(path.join(assetsDir, "styles", "pdf.css"));
  const fontBase64 = readFileBase64(path.join(assetsDir, "fonts", "NotoSansHebrew-Regular.ttf"));
  const fontDataUrl = `data:font/ttf;base64,${fontBase64}`;

  // רינדור HTML RTL
  const html = renderHtml(form, submission, fontDataUrl, css, templateHtml);

  // יצירת PDF עם Puppeteer
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" },
    preferCSSPageSize: true,
  });
  await browser.close();

  // העלאה ל-Storage
  const bucket = admin.storage().bucket(); // ברירת המחדל של הפרויקט/אמולטור
  const objectPath = `pdf/${formId}/${submissionId}.pdf`;
  const file = bucket.file(objectPath);
  await file.save(pdfBuffer, { contentType: "application/pdf" });

  let pdfUrl: string;
  if (isEmulator()) {
    // באמולטור נייצר URL להורדה
    const token = undefined; // אפשר ליצור UUID ולשמור כ-x-goog-meta-token; להשאיר ריק לאמולטור
    pdfUrl = emulatorDownloadUrl(bucket.name, objectPath, token);
  } else {
    // בענן: קבל Signed URL לשנה
    const [signed] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + 1000 * 60 * 60 * 24 * 365,
    });
    pdfUrl = signed;
  }

  await subRef.update({ pdfUrl });

  return { pdfUrl };
});
