import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import * as fs from "fs";
import * as path from "path";
import puppeteer, { Browser } from "puppeteer";
import nodemailer from "nodemailer";
import type Mail from "nodemailer/lib/mailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import { getFirestore, FieldValue } from "firebase-admin/firestore";


/**
 * Required ENV (local + prod):
 *  - SMTP_HOST
 *  - SMTP_PORT                 (465 for SSL, 587 for STARTTLS)
 *  - SMTP_SECURE               ("true" for 465, else "false")
 *  - SMTP_USER
 *  - SMTP_PASS                 (use functions:secrets:set in prod)
 *  - SMTP_FROM                 (optional, fallback: SMTP_USER)
 *  - DEFAULT_NOTIFY_EMAILS     (optional, comma-separated fallback list)
 *
 * Client payload (callable):
 *  - formId: string
 *  - answers: Record<string, any>   (must include: studentName, group)
 *  - signatureDataUrl: string|null  (data:image/png;base64,...)
 */

type Field = {
  id: string;
  type: "richtext" | "text" | "phone" | "email" | "select" | "radio" | "checkbox" | "signature";
  label: string;
  options?: string[];
  required?: boolean;
};

admin.initializeApp();

/** ---------- helpers ---------- */
function stripHtml(html: string) {
  return String(html).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
function fail(code: functions.https.FunctionsErrorCode, message: string, details?: any): never {
  console.error("[func error]", message, details || "");
  throw new functions.https.HttpsError(code, message, details);
}
/** שמירת תווי עברית/אנגלית; מנקה תווים אסורים לשם קובץ */
function safeFileName(s: string) {
  return (s || "")
    .toString()
    .normalize("NFKD")
    .replace(/[\\/:*?"<>|]/g, " ")
    .replace(/[^\w\u0590-\u05FF.\- ]/g, "")
    .trim()
    .replace(/\s+/g, " ");
}
function escHtml(s: any) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** ---------- assets (after build, __dirname -> /lib) ---------- */
const ASSETS_DIR = path.resolve(__dirname, "../assets");
const TEMPLATE_PATH = path.join(ASSETS_DIR, "templates", "submission.html");
const CSS_PATH = path.join(ASSETS_DIR, "styles", "pdf.css");
const FONT_PATH = path.join(ASSETS_DIR, "fonts", "NotoSansHebrew-Regular.ttf");

/** =========================================================================
 *  submitFormToDrive  (שם נשמר לתאימות לקוח)
 *  - מייצר PDF RTL עם גופן עברי מוטמע
 *  - שולח את ה-PDF במייל (notifyEmails מהטופס או DEFAULT_NOTIFY_EMAILS)
 *  - מעלה קאונטר submissionCount בטופס
 *  ========================================================================= */
export const submitFormToDrive = functions
  .runWith({ memory: "1GB", timeoutSeconds: 120 })
  .https.onCall(async (data) => {
    const formId: string = data?.formId;
    const answers: Record<string, any> = data?.answers || {};
    const signatureDataUrl: string | null = data?.signatureDataUrl || null;

    if (!formId) fail("invalid-argument", "formId is required");

    // טוען את מסמך הטופס
    const db = getFirestore();
    const formSnap = await db.doc(`forms/${formId}`).get();
    if (!formSnap.exists) fail("not-found", "form not found");
    const form = formSnap.data() as any;

    const title = String(form?.title || "טופס");
    const schema: Field[] = (form?.schema || []) as Field[];

    // שדות חובה גלובליים (שדה ראשון ושדה קבוצה)
    const studentName = String(answers["studentName"] || "").trim();
    const groupVal = String(answers["group"] || "").trim();
    if (!studentName) fail("invalid-argument", "answers.studentName is required");
    if (!groupVal) fail("invalid-argument", "answers.group is required");

    // וידוא קבצי נכסים
    const missing: string[] = [];
    if (!fs.existsSync(TEMPLATE_PATH)) missing.push(TEMPLATE_PATH);
    if (!fs.existsSync(CSS_PATH)) missing.push(CSS_PATH);
    if (!fs.existsSync(FONT_PATH)) missing.push(FONT_PATH);
    if (missing.length) fail("failed-precondition", "Missing asset files", { missing });

    // קריאת נכסים
    const templateHtml = fs.readFileSync(TEMPLATE_PATH, "utf8");
    const css = fs.readFileSync(CSS_PATH, "utf8");
    const fontBase64 = fs.readFileSync(FONT_PATH).toString("base64");
    const fontDataUrl = `data:font/ttf;base64,${fontBase64}`;

    // בניית תוכן (meta rows + schema rows)
    const metaRows =
      `<div class="row"><div class="label">שם החניכ.ה</div><div class="value">${escHtml(studentName)}</div></div>` +
      `<div class="row"><div class="label">קבוצה</div><div class="value">${escHtml(groupVal)}</div></div>`;

    const rowsFromSchema = schema
      .filter((f) => f.type !== "signature")
      .map((f) => {
        let v = (answers as any)[f.id];
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

    // הפקת PDF
    let browser: Browser | null = null;
    try {
      browser = await puppeteer.launch({
        executablePath: puppeteer.executablePath(),
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
      });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });

      // שים לב: page.pdf מחזיר Uint8Array – ממירים ל-Buffer כדי להתאים ל-nodemailer
      const pdfUint8 = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" },
        preferCSSPageSize: true,
      });
      const pdfBuffer = Buffer.from(pdfUint8);

      // -------- שליחה במייל (במקום Drive) --------
      const fromForm: string[] = Array.isArray(form?.notifyEmails) ? form.notifyEmails : [];
      const fallbackList =
        (process.env.DEFAULT_NOTIFY_EMAILS || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

      const recipients = fromForm.length ? fromForm : fallbackList;
      if (recipients.length === 0) {
        fail(
          "failed-precondition",
          "No recipients configured. Add 'notifyEmails' array on the form doc OR set DEFAULT_NOTIFY_EMAILS env var."
        );
      }

      const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
const secure = Number(SMTP_PORT) === 465;  // 465 => true, אחרת false

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT),
  secure,
  auth: { user: SMTP_USER!, pass: SMTP_PASS! },
  connectionTimeout: 10000,
  socketTimeout: 20000,
  tls: { rejectUnauthorized: true },
} as SMTPTransport.Options);


      const fileName = `${safeFileName(studentName)} - ${safeFileName(groupVal)} - ${safeFileName(title)}.pdf`;
      const subject = `טופס חדש: ${title} — ${studentName} (${groupVal})`;
      const htmlBody = `
        <div dir="rtl" style="font-family:Arial,Helvetica,sans-serif">
          <p>שלום,</p>
          <p>התקבלה הגשה חדשה לטופס: <b>${escHtml(title)}</b>.</p>
          <p><b>שם החניכ.ה:</b> ${escHtml(studentName)}<br/>
             <b>קבוצה:</b> ${escHtml(groupVal)}</p>
          <p>מצורף קובץ ה-PDF הרשמי.</p>
        </div>
      `;
      const textBody = `התקבלה הגשה חדשה לטופס "${title}".\nשם החניכ.ה: ${studentName}\nקבוצה: ${groupVal}\nמצורף PDF.`;

      const mailOptions: Mail.Options = {
        from: SMTP_FROM || SMTP_USER,
        to: recipients.join(","),
        subject,
        text: textBody,
        html: htmlBody,
        attachments: [
          {
            filename: fileName,
            content: pdfBuffer,
            contentType: "application/pdf",
          },
        ],
      };

      const info: SMTPTransport.SentMessageInfo = await transporter.sendMail(mailOptions);
      console.log("[email] sent", { to: recipients, messageId: info.messageId });

      // קאונטר
      const resolvedFormId = formId || formSnap.ref.id; // ליתר ביטחון יש לנו מזהה תקף
await db.doc(`forms/${resolvedFormId}`).update({
  submissionCount: FieldValue.increment(1),
});

      return { ok: true, sentTo: recipients, messageId: info.messageId };
    } catch (err: any) {
      fail("internal", err?.message || "Email submission failed", {
        name: err?.name,
        stack: (err?.stack || "").split("\n").slice(0, 6).join("\n"),
      });
    } finally {
      if (browser) await browser.close().catch(() => {});
    }
  });
