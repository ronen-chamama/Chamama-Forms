import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import * as fs from "fs";
import * as path from "path";
import puppeteer, { Browser } from "puppeteer";
import nodemailer from "nodemailer";
import { FieldValue } from "firebase-admin/firestore";

// ---------- Types ----------
type Field = {
  id: string;
  type: "richtext" | "text" | "phone" | "email" | "select" | "radio" | "checkbox" | "signature";
  label: string;
  options?: string[];
  required?: boolean;
};

// ---------- Firebase init ----------
admin.initializeApp();

// ---------- Helpers ----------
function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
function fail(code: functions.https.FunctionsErrorCode, message: string, details?: any): never {
  console.error("[func error]", message, details || "");
  throw new functions.https.HttpsError(code, message, details);
}
function safeFileName(s: string) {
  return (s || "")
    .toString()
    .normalize("NFKD")
    .replace(/[\\/:*?"<>|]/g, " ")
    .replace(/[^\w\u0590-\u05FF.\- ]/g, "")
    .trim()
    .replace(/\s+/g, " ");
}
function fileToDataUrl(p: string, mime: string) {
  const b64 = fs.readFileSync(p).toString("base64");
  return `data:${mime};base64,${b64}`;
}
function parseEmails(val?: string | string[]): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean);
  return String(val)
    .split(/[,\s;]+/).map((s) => s.trim())
    .filter(Boolean);
}

// ---------- Asset paths (after build __dirname -> /lib) ----------
const ASSETS_DIR   = path.resolve(__dirname, "../assets");
const TEMPLATE_PATH= path.join(ASSETS_DIR, "templates", "submission.html");
const CSS_PATH     = path.join(ASSETS_DIR, "styles", "pdf.css");
const FONT_PATH    = path.join(ASSETS_DIR, "fonts", "NotoSansHebrew-Regular.ttf");
const HEADER_PNG   = path.join(ASSETS_DIR, "img", "header.png");
const HEADER_JPG   = path.join(ASSETS_DIR, "img", "header.jpg");

// ---------- Callable: submit + email PDF ----------
export const submitFormToDrive = functions
  .runWith({ memory: "1GB", timeoutSeconds: 120 })
  .https.onCall(async (data) => {
    const formId: string = data?.formId;
    const answers: Record<string, any> = data?.answers || {};
    const signatureDataUrl: string | null = data?.signatureDataUrl || null;
    if (!formId) fail("invalid-argument", "formId is required");

    // 1) Load form
    const db = admin.firestore();
    const formSnap = await db.doc(`forms/${formId}`).get();
    if (!formSnap.exists) fail("not-found", "form not found");
    const form = formSnap.data() as any;
    const title = String(form?.title || "טופס");
    const schema: Field[] = (form?.schema || []) as Field[];

    // Required global fields expected in answers
    const studentName = String(answers["studentName"] || "").trim();
    const groupVal    = String(answers["group"] || "").trim();
    if (!studentName) fail("invalid-argument", "answers.studentName is required");
    if (!groupVal)    fail("invalid-argument", "answers.group is required");

    // 2) Verify assets
    const missing: string[] = [];
    for (const p of [TEMPLATE_PATH, CSS_PATH, FONT_PATH]) {
      if (!fs.existsSync(p)) missing.push(p);
    }
    if (missing.length) fail("failed-precondition", "Missing asset files", { missing });

    const templateHtml = fs.readFileSync(TEMPLATE_PATH, "utf8");
    const css          = fs.readFileSync(CSS_PATH, "utf8");
    const fontB64      = fs.readFileSync(FONT_PATH).toString("base64");
    const fontDataUrl  = `data:font/ttf;base64,${fontB64}`;
    const headerDataUrl= fs.existsSync(HEADER_PNG)
      ? fileToDataUrl(HEADER_PNG, "image/png")
      : fs.existsSync(HEADER_JPG)
      ? fileToDataUrl(HEADER_JPG, "image/jpeg")
      : "";

    // Build rows from schema (skip signature fields)
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

    const signatureHtml = signatureDataUrl
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
      .replace(/{{\s*title\s*}}/gi, title)
      .replace(/{{\s*rows\s*}}/gi, rows)
      .replace(/{{\s*signature\s*}}/gi, signatureHtml)
      .replace(/{{\s*header\s*}}/gi, headerDataUrl ? `<img class="header" src="${headerDataUrl}" />` : "");

    // 3) Generate PDF
    let browser: Browser | null = null;
    try {
      const execPath = puppeteer.executablePath();
      browser = await puppeteer.launch({
        executablePath: execPath,
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
      });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });
      const pdfUint8 = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" },
        preferCSSPageSize: true,
      });
      const pdfBuffer = Buffer.from(pdfUint8);

      // 4) Resolve recipients: form.notifyEmails → FORMS_INBOX → DEFAULT_NOTIFY_EMAILS
      const fromForm: string[] = Array.isArray(form?.notifyEmails) ? form.notifyEmails.filter(Boolean) : [];
      const fallback = parseEmails(process.env.FORMS_INBOX || process.env.DEFAULT_NOTIFY_EMAILS || "");
      const recipients = fromForm.length ? fromForm : fallback;
      console.log("[recipients resolved]", recipients);
      if (!recipients.length) {
        fail("failed-precondition", "No recipients configured. Set FORMS_INBOX/DEFAULT_NOTIFY_EMAILS env or add notifyEmails on form doc.");
      }

      // 5) Send email with PDF
      const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
      const port   = Number(SMTP_PORT) || 465;
      const secure = port === 465;

      if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
        fail("failed-precondition", "Missing SMTP config (SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS/SMTP_FROM).");
      }

      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port,
        secure,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      });

      const prodDate = new Date().toLocaleDateString("he-IL");
      const subject  = `${title} – ${studentName} (${groupVal})`;
      const fileName = safeFileName(`${studentName} - ${groupVal} - ${title}.pdf`);

      const info = await transporter.sendMail({
        from: SMTP_FROM || SMTP_USER,
        to: recipients.join(","),
        subject,
        text: `טופס חתום מצורף כ-PDF.\nשם החניכ/ה: ${studentName}\nקבוצה: ${groupVal}\nתאריך: ${prodDate}`,
        html: `<p>טופס חתום מצורף כ-PDF.</p><p><b>שם החניכ/ה:</b> ${studentName}<br><b>קבוצה:</b> ${groupVal}<br><b>תאריך:</b> ${prodDate}</p>`,
        attachments: [
          { filename: fileName, content: pdfBuffer, contentType: "application/pdf" },
        ],
      });

      // 6) Increment counter on form
      await db.doc(`forms/${formId}`).update({
  submissionCount: FieldValue.increment(1),
      });

      console.log("[email] sent", { to: recipients, messageId: info.messageId });
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
