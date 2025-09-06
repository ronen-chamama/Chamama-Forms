import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import * as fs from "fs";
import * as path from "path";
import puppeteer from "puppeteer";
import nodemailer from "nodemailer";

/** ---------- Types ---------- */
type Field = {
  id: string;
  type: "richtext" | "text" | "phone" | "email" | "select" | "radio" | "checkbox" | "signature";
  label: string;
  options?: string[];
  required?: boolean;
};

type SubmitPayload = {
  formId?: string;                  // preferred
  publicId?: string;                // fallback
  answers: Record<string, any>;
  signatureDataUrl?: string | null; // dataURL from the parent form page
};

/** ---------- Firebase init ---------- */
const firebaseConfigEnv = process.env.FIREBASE_CONFIG ? JSON.parse(process.env.FIREBASE_CONFIG) : null;
const PROJECT_ID =
  process.env.GCLOUD_PROJECT ||
  process.env.GCP_PROJECT ||
  firebaseConfigEnv?.projectId ||
  "demo-chamama";

const DEFAULT_BUCKET = process.env.STORAGE_BUCKET || `${PROJECT_ID}.appspot.com`;

if (!admin.apps.length) {
  admin.initializeApp({ storageBucket: DEFAULT_BUCKET });
}

/** ---------- Assets paths (after TS build __dirname -> lib) ---------- */
const ASSETS_DIR     = path.resolve(__dirname, "../assets");
const TEMPLATE_HTML  = path.join(ASSETS_DIR, "templates", "submission.html");
const CSS_PATH       = path.join(ASSETS_DIR, "styles", "pdf.css");
const FONT_PATH      = path.join(ASSETS_DIR, "fonts", "NotoSansHebrew-Regular.ttf");
const HEADER_PNG     = path.join(ASSETS_DIR, "img", "header.png");
const HEADER_JPG     = path.join(ASSETS_DIR, "img", "header.jpg");

/** ---------- Utils ---------- */
function fail(code: functions.https.FunctionsErrorCode, message: string, details?: any): never {
  console.error("[func error]", message, details || "");
  throw new functions.https.HttpsError(code, message, details);
}

function readUtf8(p: string) { return fs.readFileSync(p, "utf8"); }
function readBase64(p: string) { return fs.readFileSync(p).toString("base64"); }

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

const GROUP_LABELS = ["ברקן", "גרניום", "דוריאן", "הל"];
const GROUP_MAP: Record<string, string> = {
  barkan: "ברקן",
  geranium: "גרניום",
  geranium_he: "גרניום",
  durian: "דוריאן",
  hel: "הל",
};
function labelForGroup(v: string) {
  if (!v) return "";
  if (GROUP_LABELS.includes(v)) return v;
  const key = v.toLowerCase().trim();
  return GROUP_MAP[key] || v;
}

function rowHtml(label: string, value: string) {
  return `<div class="row"><div class="label">${label}</div><div class="value">${value || ""}</div></div>`;
}

function sanitizeFilename(s: string) {
  return (s || "טופס")
    .toString()
    .normalize("NFKD")
    .replace(/[^\w\s.\-\u0590-\u05FF]/g, "") // allow hebrew, letters/digits, space, dot, dash
    .trim()
    .replace(/\s+/g, "_");
}

/** ---------- Config (ENV first, then functions.config) ---------- */
function getConfig() {
  const env = process.env;
  const cfgEnv = {
    smtp: {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT ? parseInt(env.SMTP_PORT, 10) : undefined,
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
      from: env.SMTP_FROM,
    },
    inbox: env.FORMS_INBOX ? env.FORMS_INBOX.split(",").map(s => s.trim()).filter(Boolean) : undefined,
  };

  const cfgFns = (functions as any).config ? (functions as any).config() as any : {};

  if (!cfgFns.smtp && !cfgEnv.smtp.host) {
    console.warn("It looks like you're trying to access functions.config().smtp but there is no value there.");
  }
  if (!cfgFns.forms && !cfgEnv.inbox) {
    console.warn("It looks like you're trying to access functions.config().forms but there is no value there.");
  }

  const merged = {
    smtp: {
      host: cfgEnv.smtp.host || cfgFns?.smtp?.host || "smtp.gmail.com",
      port: cfgEnv.smtp.port || cfgFns?.smtp?.port || 465,
      user: cfgEnv.smtp.user || cfgFns?.smtp?.user,
      pass: cfgEnv.smtp.pass || cfgFns?.smtp?.pass,
      from: cfgEnv.smtp.from || cfgFns?.smtp?.from || cfgEnv.smtp.user,
    },
    inbox: (cfgEnv.inbox ||
            (cfgFns?.forms?.inbox ? (Array.isArray(cfgFns.forms.inbox) ? cfgFns.forms.inbox : [cfgFns.forms.inbox]) : [])).filter(Boolean),
  };

  if (!merged.smtp.host || !merged.smtp.port || !merged.smtp.user || !merged.smtp.pass) {
    fail("failed-precondition", "SMTP configuration missing (host/port/user/pass).");
  }
  if (!merged.inbox.length) {
    fail("failed-precondition", "No recipients configured. Set FORMS_INBOX or functions.config().forms.inbox.");
  }

  return merged;
}

/** ---------- Assets loader ---------- */
function loadAssets() {
  const missing: string[] = [];
  if (!fs.existsSync(TEMPLATE_HTML)) missing.push(TEMPLATE_HTML);
  if (!fs.existsSync(CSS_PATH)) missing.push(CSS_PATH);
  if (!fs.existsSync(FONT_PATH)) missing.push(FONT_PATH);
  if (missing.length) fail("failed-precondition", "Missing asset files", { missing });

  const templateHtml = readUtf8(TEMPLATE_HTML);
  const css = readUtf8(CSS_PATH);
  const fontBase64 = readBase64(FONT_PATH);
  const fontDataUrl = `data:font/ttf;base64,${fontBase64}`;

  let headerDataUri = "";
  if (fs.existsSync(HEADER_PNG)) headerDataUri = `data:image/png;base64,${readBase64(HEADER_PNG)}`;
  else if (fs.existsSync(HEADER_JPG)) headerDataUri = `data:image/jpeg;base64,${readBase64(HEADER_JPG)}`;

  return { templateHtml, css, fontDataUrl, headerDataUri };
}

/** ---------- HTML renderer ---------- */
function renderPdfHtml(
  form: any,
  submission: { answers: Record<string, any>; signatureDataUrl?: string | null },
  assets: { templateHtml: string; css: string; fontDataUrl: string; headerDataUri?: string }
) {
  const { templateHtml, css, fontDataUrl, headerDataUri } = assets;

  const schema: Field[] = Array.isArray(form?.schema) ? form.schema : [];
  const answers = submission.answers || {};

  const titleText = String(form?.title || "טופס");
  const descriptionHtml = String(form?.description || form?.descriptionHtml || "");

  const studentName =
    (answers.studentName ??
      answers["student_name"] ??
      answers["שם החניכ.ה"] ??
      "") + "";

  const groupRaw =
    (answers.group ??
      answers.groupId ??
      answers["קבוצה"] ??
      "") + "";
  const groupLabel = labelForGroup(groupRaw);

  const coreRows: string[] = [];
  if (studentName.trim()) coreRows.push(rowHtml("שם החניכ.ה", studentName.trim()));
  if (groupLabel.trim()) coreRows.push(rowHtml("קבוצה", groupLabel.trim()));

  const otherRows = schema
    .filter((f) => f.type !== "signature")
    .map((f) => {
      let v = answers[f.id];
      if (v == null) v = "";
      if (Array.isArray(v)) v = v.join(", ");
      if (f.type === "richtext") v = stripHtml(String(v));
      return rowHtml(f.label, String(v));
    });

  const rowsHtml = [...coreRows, ...otherRows].join("\n");

  const signatureHtml = submission.signatureDataUrl
    ? `<div class="signature"><div class="sig-label">חתימה:</div><img src="${submission.signatureDataUrl}" alt="signature" /></div>`
    : "";

  const fontFace = `
    @font-face {
      font-family: 'NotoHeb';
      src: url('${fontDataUrl}') format('truetype');
      font-weight: 400;
      font-style: normal;
      font-display: swap;
    }`;
  const style = `<style>${fontFace}\n${css}</style>`;
  const headerTag = headerDataUri ? `<img src="${headerDataUri}" alt="" />` : "";

  const printDate = new Intl.DateTimeFormat("he-IL", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date());

  const html = templateHtml
    .replace("<!--STYLE-->", style)
    .replace(/{{\s*title\s*}}/gi, titleText)
    .replace(/{{\s*description\s*}}/gi, descriptionHtml)
    .replace(/{{\s*rows\s*}}/gi, rowsHtml)
    .replace(/{{\s*signature\s*}}/gi, signatureHtml)
    .replace(/{{\s*header_img\s*}}/gi, headerTag)
    .replace(/{{\s*printDate\s*}}/gi, printDate);

  return { html, titleText, studentName: studentName.trim(), groupLabel: groupLabel.trim() };
}

/** ---------- PDF maker ---------- */
async function createPdfBuffer(html: string): Promise<Buffer> {
  const execPath = puppeteer.executablePath?.();
  const browser = await puppeteer.launch({
    executablePath: execPath,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const buf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" },
      preferCSSPageSize: true,
    });
    return Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
  } finally {
    await browser.close().catch(() => {});
  }
}

/** ---------- Mailer ---------- */
async function sendMailWithPdf(
  recipients: string[],
  from: string,
  subject: string,
  bodyHtml: string,
  fileName: string,
  pdfBuffer: Buffer
) {
  const { smtp: { host, port, user, pass } } = getConfig();

  const transporter = nodemailer.createTransport({
    host, port,
    secure: port === 465, // 465 = SSL, 587 = STARTTLS
    auth: { user, pass },
  });

  const info = await transporter.sendMail({
    from,
    to: recipients,
    subject,
    html: bodyHtml,
    attachments: [
      {
        filename: fileName,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });

  console.log("[email] sent", { to: recipients, messageId: info.messageId });
  return info;
}

/** ---------- Callable: submitFormToDrive ---------- */
export const submitFormToDrive = functions
  .runWith({ timeoutSeconds: 120, memory: "1GB" })
  .https.onCall(async (data: SubmitPayload) => {
    const { formId, publicId, answers, signatureDataUrl } = data || {};
    console.log("[submitFormToDrive] args keys:", Object.keys(data || {}));

    if (!answers || typeof answers !== "object") {
      fail("invalid-argument", "answers are required");
    }

    // Load form
    const db = admin.firestore();
    const docId = formId || publicId;
    if (!docId) fail("invalid-argument", "formId or publicId is required");

    const formRef = db.doc(`forms/${docId}`);
    const formSnap = await formRef.get();
    if (!formSnap.exists) fail("not-found", "form not found");
    const form = formSnap.data() || {};

    // Render HTML
    const assets = loadAssets();
    const { html, titleText, studentName, groupLabel } = renderPdfHtml(
      form,
      { answers, signatureDataUrl: signatureDataUrl || null },
      assets
    );

    // Filename
    const safeTitle   = sanitizeFilename(titleText);
    const safeStudent = sanitizeFilename(studentName || "");
    const safeGroup   = sanitizeFilename(groupLabel || "");
    const fileName = [safeStudent, safeGroup, safeTitle].filter(Boolean).join("-") + ".pdf";
    console.log("[submitFormToDrive] render done", { title: titleText, fileName });

    // Build PDF
    const pdfBuffer = await createPdfBuffer(html);

    // Mail
    const cfg = getConfig();
    const recipients = cfg.inbox; // always your inbox
    const from = cfg.smtp.from || cfg.smtp.user;
    const subject = `Chamama Forms – ${titleText}`;
    const bodyHtml = `<div dir="rtl">מצורף PDF חתום לטופס <b>${titleText}</b>.</div>`;

    console.log("[recipients resolved]", recipients);
    await sendMailWithPdf(recipients, from, subject, bodyHtml, fileName, pdfBuffer);

    // No writes to Storage or Firestore
    return { ok: true, fileName, mailedTo: recipients };
  });
