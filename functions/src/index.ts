import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import * as fs from "fs";
import * as path from "path";
import nodemailer from "nodemailer";
import { beforeUserCreated, beforeUserSignedIn } from "firebase-functions/v2/identity";
import { HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import chromium from "@sparticuz/chromium";
import puppeteer, { Browser } from "puppeteer-core";




if (admin.apps.length === 0) admin.initializeApp();


export { generateFormHero } from "./ai/generateFormHero";

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

const ALLOW_GOOGLE_ONLY = true;


// נירמול אימייל
function normEmail(email?: string | null): string | null {
  if (!email) return null;
  return email.trim().toLowerCase();
}

// בדיקת הרשאה מול Firestore: אוסף allowedUsers, מזהה המסמך = כתובת אימייל (באותיות קטנות).
// אפשר (לא חובה) להחזיק שדה enabled:boolean כדי לנטרל משתמש ברשימה.
async function isAllowed(email?: string | null): Promise<boolean> {
  if (!email) return false;
  const id = email.toLowerCase().trim();
  try {
    const snap = await admin.firestore().doc(`allowedUsers/${id}`).get();
    return snap.exists;
  } catch (e) {
    logger.error("allowlist lookup failed", { email: id, error: (e as Error).message });
    return false;
  }
}

// אכיפת ספק Google בלבד (רק אם ALLOW_GOOGLE_ONLY=true)
function assertGoogle(event: any) {
  if (!ALLOW_GOOGLE_ONLY) return;

  // v2: providerData הוא מערך AuthUserInfo[]; לעיתים יש גם credential.providerId
  const provs = (event?.data?.providerData ?? []) as Array<{ providerId?: string }>;
  const credProv = (event as any)?.credential?.providerId;
  const hasGoogle =
    provs.some((p) => p?.providerId === "google.com") || credProv === "google.com";

  if (!hasGoogle) {
    throw new HttpsError("permission-denied", "Login provider not allowed (Google only).");
  }
}

export const allowlistOnCreate = beforeUserCreated(
  { region: "us-central1" },
  async (event) => {
    const ok = await isAllowed(event.data.email ?? null);
    if (!ok) {
      throw new HttpsError("permission-denied", "המשתמש אינו מורשה (allowlist).");
    }
    return;
  }
);

export const allowlistOnSignIn = beforeUserSignedIn(
  { region: "us-central1" },
  async (event) => {
    const ok = await isAllowed(event.data.email ?? null);
    if (!ok) {
      throw new HttpsError("permission-denied", "המשתמש אינו מורשה (allowlist).");
    }
    return;
  }
);


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
  .filter((f: any) => String((f as any).type || "") !== "signature")
  .map((f: any) => {
    // קרא ערך התשובה לשדה הנוכחי
    let v = answers ? answers[f.id] : undefined;

    // טיפוס כשורת טקסט כדי להימנע מהשוואה נגד union צר
    const t = String((f as any).type || "");

    if (t === "consent") {
      // אם מסומן → תציג את טקסט ההסכמה (description או label), אחרת ריק
      const desc = typeof f.description === "string" ? f.description : undefined;
      const label = typeof f.label === "string" ? f.label : undefined;
      v = v === true ? (desc || label || "הסכמה") : "";
    } else if (t === "checkboxes") {
      // בחירה מרובה: מערך → מחרוזת עם פסיקים
      v = Array.isArray(v) ? v.join(", ") : "";
    } else if (t === "checkbox") {
      // תיבה בודדת: אם מסומן → מציגים את התווית; אחרת ריק
      const label = typeof f.label === "string" ? f.label : undefined;
      v = v === true ? (label || "מסומן") : "";
    } else {
      // שדות אחרים
      if (v == null) v = "";
      if (Array.isArray(v)) v = v.join(", ");
      if (t === "richtext") v = stripHtml(String(v));
    }

    v = v == null ? "" : String(v);

    // אם ריק (למשל הסכמה שלא סומנה) – לא מוסיפים שורה
    return v ? rowHtml((f.label || t || String(f.id)) as string, v) : "";
  })
  .filter(Boolean);

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
  const isEmulator =
    process.env.FUNCTIONS_EMULATOR === "true" ||
    process.env.FUNCTIONS_EMULATOR === "1";

  // בענן נשתמש ב-executable של @sparticuz/chromium; בלוקאל אפשר להשאיר undefined
  const executablePath = isEmulator ? undefined : await chromium.executablePath();

  const browser = await puppeteer.launch({
    executablePath,
    // סט דגלים מתאים לענן; בלוקאל מספיק מינ' דגלים
    args: isEmulator ? ["--no-sandbox", "--disable-setuid-sandbox"] : chromium.args,
    headless: true,
    // למנוע שגיאת טיפוסים של Viewport – נגדיר במפורש בלוקאל; בענן ניקח ברירת מחדל של החבילה
    defaultViewport: isEmulator
      ? {
          width: 1280,
          height: 800,
          deviceScaleFactor: 1,
          isMobile: false,
          isLandscape: false,
          hasTouch: false
        }
      : chromium.defaultViewport
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const buf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" },
      preferCSSPageSize: true
    });
    return Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
  } finally {
    await browser.close().catch(() => {});
  }
}


/** ---------- Mailer (FIXED) ---------- */
async function sendMailWithPdf(
  recipients: string[],
  from: string,
  subject: string,
  bodyHtml: string,
  fileName: string,
  pdfBuffer: Buffer
) {
  const { smtp: { host, port, user, pass } } = getConfig();

  // פורט מגיע כ-string ("465") — נמיר למספר ונגדיר secure נכון
  const portNum = typeof port === "string" ? parseInt(port, 10) : port;

  const transporter = nodemailer.createTransport({
    host,
    port: portNum,
    secure: portNum === 465, // 465 = SSL מלא; 587 = STARTTLS
    auth: { user, pass },
    connectionTimeout: 20000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
    tls: {
      servername: host,
      rejectUnauthorized: true,
    },
  });

  const info = await transporter.sendMail({
    from,
    to: recipients, // אפשר גם מחרוזת אחת; נשארנו עם מערך
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

// ===== submitFormToDrive – (unchanged except recipients normalization) =====
export const submitFormToDrive = functions
  .region("us-central1")
  .runWith({ timeoutSeconds: 120, memory: "1GB" })
  .https.onCall(async (data: SubmitPayload, context) => {
    console.log("[submitFormToDrive] args keys:", Object.keys(data || {}));

    // אימות קריאה
    if (!context.auth) {
      return fail("unauthenticated", "auth required");
    }
    if (!data || typeof data !== "object") {
      return fail("invalid-argument", "payload required");
    }

    const { formId, publicId, answers, signatureDataUrl } = data;

    if (!answers || typeof answers !== "object") {
      return fail("invalid-argument", "answers are required");
    }

    // טוענים טופס
    const db = admin.firestore();
    const docId = formId || publicId;
    if (!docId) return fail("invalid-argument", "formId or publicId is required");

    const formRef = db.doc(`forms/${docId}`);
    const formSnap = await formRef.get();
    if (!formSnap.exists) return fail("not-found", "form not found");
    const form = formSnap.data() || {};

    // רנדר HTML ל-PDF
    const assets = loadAssets();
    const { html, titleText, studentName, groupLabel } = renderPdfHtml(
      form,
      { answers, signatureDataUrl: signatureDataUrl || null },
      assets
    );

    // שם קובץ
    const safeTitle   = sanitizeFilename(titleText);
    const safeStudent = sanitizeFilename(studentName || "");
    const safeGroup   = sanitizeFilename(groupLabel || "");
    const fileName =
      [safeStudent, safeGroup, safeTitle].filter(Boolean).join("-") + ".pdf";

    console.log("[submitFormToDrive] render done", { title: titleText, fileName });

    // בניית PDF
    const pdfBuffer = await createPdfBuffer(html);

    // שליחה למייל
    const cfg = getConfig();
    const recipients = Array.isArray(cfg.inbox) ? cfg.inbox : [cfg.inbox]; // נוודא מערך
    const from = cfg.smtp.from || cfg.smtp.user;
    const subject = `Chamama Forms – ${titleText}`;
    const bodyHtml = `<div dir="rtl">מצורף PDF חתום לטופס <b>${titleText}</b>.</div>`;

    console.log("[recipients resolved]", recipients);
    await sendMailWithPdf(recipients, from, subject, bodyHtml, fileName, pdfBuffer);
    // עדכון אטומי של המונה + חותמת זמן אחרונה
try {
  await formRef.update({
    submissionCount: admin.firestore.FieldValue.increment(1),
    lastSubmissionAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log("[submitFormToDrive] submissionCount incremented");
} catch (e) {
  console.error("[submitFormToDrive] failed to increment submissionCount", e);
  // לא מפילים את כל התהליך אם המייל נשלח — רק לוג
}

    return { ok: true, fileName, mailedTo: recipients };
  });
