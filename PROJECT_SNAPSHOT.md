# Chamama Forms — Project Snapshot
_גרסת עוגן תמציתית לעבודה נוחה ולהמשך פיתוח_

תאריך: 2025-09-06 13:09

## 1) סטאק וכללי
- **Frontend**: Next.js (App Router), TypeScript, Tailwind v4, React 19.
- **Auth/DB/Emu**: Firebase (Auth, Firestore, Emulators).
- **פונקציות**: Cloud Functions (TypeScript) + Puppeteer ל־PDF + Nodemailer לשליחת מיילים.
- **אחסון חתימות**: באמולטור/Storage (לשימוש זמני); כעת אנו **לא** שומרים PDF קבוע, אלא שולחים במייל.
- **טווח RTL/עברית**: תמיכה מלאה ב־RTL ו־NotoSansHebrew לקבצי PDF.

## 2) מבנה תיקיות (עיקרי)
```
/app
  /login/page.tsx           # התחברות
  /forms/[id]/edit/page.tsx # עורך טופס + Drag & Drop לשדות
  /f/[id]/page.tsx          # טופס להורה (מילוי/שליחה)
  /globals.css              # Tailwind v4 + Quill CSS
/components
  RichTextEditor.tsx        # עורך WYSIWYG (Quill) עם RTL
  SignaturePad.tsx          # שדה חתימה (react-signature-canvas)
/lib
  firebaseClient.ts         # אתחול Firebase צד-לקוח
/functions
  /src/index.ts             # submitFormToDrive + makePdf (Puppeteer) + מייל (Nodemailer)
  /assets
    /templates/submission.html
    /styles/pdf.css
    /img/header.png|jpg     # הדר ל־PDF
  package.json
  tsconfig.json
  .runtimeconfig.json       # (אופציונלי לאמולטור, ראה סעיף SMTP)
firebaserun.ps1             # מריץ אמולטורים + FRONT + ENV מקומי
firebase.json               # אמולטורים (Auth/Firestore/Functions/Storage...) + predeploy build
tailwind.config.ts          # Tailwind v4 (preset)
postcss.config.js           # Tailwind via @tailwindcss/postcss
```

## 3) מודל נתונים (Firestore)
- **forms/{{formId}}**
  - `title: string` — כותרת הטופס (מופיע גם ב־PDF).
  - `descriptionHtml: string` — מלל עשיר HTML לטופס (WYSIWYG), מוצג ב־PDF.
  - `schema: Field[]` — מערך שדות (text/textarea/phone/email/select/radio/checkbox/signature).
  - `ownerUid: string`
  - `createdAt, updatedAt`
  - `submissionCount: number` — מונה הגשות (מנוהל בפונקציה, אם מופעל).
  - _לא חובה יותר_: `notifyStaffEmails` — עברנו להרצה שמוגדרת קבוע לכתובת הארגון.

- **forms/{{formId}}/submissions/{{submissionId}}**
  - `answers: Record<string, any>` — תשובות לפי `field.id`.
  - `signatureUrl?: string` — אם נשמרה תמונת חתימה (אופציונלי).
  - `group: "ברקן"|"גרניום"|"דוריאן"|"הל"` — קבוצת החניך/ה (שדה חובה להורה).
  - `studentName: string` — שם החניך/ה (חובה).
  - `submittedAt`

> **שדות חובה** בטופס ההורה: _שם החניכ.ה_ ו־_קבוצה בחממה_.

## 4) זרימת שליחה (הורה → PDF במייל)
1. ההורה ממלא: שם חניכ/ה + קבוצה + שדות הטופס + חתימה.
2. הצד־לקוח קורא ל־`functions.httpsCallable("submitFormToDrive")` עם:
   ```ts
   {{ formId, publicId, answers, signatureDataUrl }}
   ```
3. **submitFormToDrive** ב־`/functions/src/index.ts`:
   - טוען form + submission.
   - מרנדר HTML ל־PDF: משתמש ב־`assets/templates/submission.html` + `pdf.css` + `NotoSansHebrew`.
   - מייצר PDF עם Puppeteer (ללא שמירה ב־Storage).
   - שולח מייל עם PDF מצורף ל־**forms.inbox** (ברירת מחדל: `ronen@chamama.org`).  
   - (אופציונלי) עדכון מונה `submissionCount` — ניתן להפעיל/לנטרל.
   - מחזיר `{ ok: true }`.

## 5) SMTP — הגדרות מקומיות (אמולטור)
יש שתי אפשרויות להזין קונפיגורציה לפונקציות באמולטור:

### א. `.runtimeconfig.json` בתוך `/functions`
קובץ JSON **תקין** (שמור־UTF8, בלי פסיקים עודפים, בלי שורות בודדות):
```json
{
  "smtp": {
    "host": "smtp.gmail.com",
    "port": "465",
    "user": "ronen@chamama.org",
    "pass": "APP_PASSWORD_HERE",
    "from": "Chamama Forms <ronen@chamama.org>"
  },
  "forms": {
    "inbox": "ronen@chamama.org"
  }
}
```
> אם קיים קובץ זה והוא **לא** תקין – האמולטור ידווח: _Found .runtimeconfig.json but the JSON format is invalid_. תקן פורמט ושמור שוב.

### ב. ENV זמני מהרצה (PowerShell)
```powershell
$env:SMTP_HOST="smtp.gmail.com"
$env:SMTP_PORT="465"
$env:SMTP_USER="ronen@chamama.org"
$env:SMTP_PASS="APP_PASSWORD_HERE"
$env:SMTP_FROM="Chamama Forms <ronen@chamama.org>"
$env:FORMS_INBOX="ronen@chamama.org"
```
> אפשר לעטוף בתוך `firebaserun.ps1` (כבר קיים אצלך) לפני `firebase emulators:start`.

### בפרודקשן (אחרי deploy)
```bash
firebase functions:config:set   smtp.host="smtp.gmail.com"   smtp.port="465"   smtp.user="ronen@chamama.org"   smtp.pass="APP_PASSWORD_HERE"   smtp.from="Chamama Forms <ronen@chamama.org>"   forms.inbox="ronen@chamama.org"

firebase deploy --only functions
```
> לאחר שינוי קונפיג: **redeploy** / הפעלה מחדש לאמולטור.

## 6) PDF — תבנית ועיצוב
- **תבנית**: `/functions/assets/templates/submission.html`
  - מצייני מקום: `{{title}}`, `{{description}}`, `{{rows}}`, `{{signature}}`, `{{header_img}}`, `{{printDate}}`.
- **CSS**: `/functions/assets/styles/pdf.css`
  - כולל RTL, שני טורים ל־`rows`, הדר/פוּטר, וכד'.
- **Header image**: `/functions/assets/img/header.png|jpg`
  - נבחר אוטומטית אם קיים. נכלל כ־`<img>` עם `data:` או URL מקומי בהתאם.

## 7) Drag & Drop בעורך
- גרירה מהפלטת־שדות לפאנל שמאלי (builder) — אפשר להוסיף ולמקם.
- קו הדגשת drop מופיע בזמן גרירה.
- הוספה בלחיצה: מוסיפה לסוף (ניתן לשנות — כרגע זה MVP).

## 8) סקריפטי הרצה
- **אמולטור+FRONT יחד (PowerShell)**: `firebaserun.ps1`  
  - מגדיר ENV (אם תרצה), מריץ `npm --prefix functions run build`, מפעיל אמולטורים, פותח `npm run dev` בחלון נפרד.
- אפשרות להריץ כל אחד ידנית:
  ```bash
  cd functions && npm run build && firebase emulators:start
  # חלון נוסף
  npm run dev
  ```

## 9) תקלות נפוצות ופתרונות
- **`No recipients configured`** — חסר forms.inbox או רשימת נמענים; ודא `.runtimeconfig.json` או ENV זמני/קבוע.
- **`wrong version number / ECONNREFUSED / ETIMEDOUT`** — בדוק:
  - host/port תואמים (Gmail: 465 secure, או 587 TLS).
  - `SMTP_SECURE=true` כש־465; כש־587 השתמש ב־`SMTP_SECURE=false`.
  - סיסמת אפליקציה נכונה (Gmail App Password).
- **`Cannot read properties of undefined (reading 'serverTimestamp')`** — ודא ייבוא `admin.firestore.FieldValue` ורפרנס ל־`db` (כיום יש פיצול ברור בקוד, ראה סעיף 10).
- **Turbopack panic / CSS** — Next 15 + Tailwind v4: ודא שימוש `@tailwindcss/postcss` ו־`@import "tailwindcss";` בלבד ב־globals.css; כשצריך—בטל Turbopack עם `NEXT_DISABLE_TURBOPACK=1` ונסה Webpack.

## 10) פונקציות — מבנה נקי (נוכחי)
- `renderPdfHtml(form, submission)` — מחזיר `{ html, title, fileName }` תוך שילוב header, description, rows, signature, footer עם תאריך.
- `makePdfBuffer(html)` — מריץ Puppeteer ומחזיר `Buffer` של ה־PDF.
- `sendMailWithPdf(recipients, from, subject, bodyHtml, fileName, pdfBuffer)` — שולח מייל עם PDF מצורף (Nodemailer).
- `submitFormToDrive` (callable) — _entry point_ שמחבר הכול: טוען נתונים, מרנדר, מייצר PDF, שולח מייל, (אופציונלי) מעלה מונה הגשות, ומחזיר `{ok:true}`.

## 11) גיבוי והסתעפות (Git)
- לשמור את המצב היציב (main) ולפתח בברנצ' נפרד:
  ```bash
  git checkout -b feature/pdf-styling
  # עבודה...
  git push -u origin feature/pdf-styling
  ```
- אם נתקעים — `git restore -s <commit> -- .` או יצירת ברנצ' מאותו commit.

## 12) Roadmap קצר
- ✅ MVP: יצירת/עריכת טפסים, הגשת טופס, PDF במייל.
- ☐ UI/UX: שיפור Layout העורך, אינדיקציית drop, RTL מלא בכל הרכיבים.
- ☐ אוטומציית Drive (צד שני): Script/Apps Script שיקרא מיילים וימיין לקבצים/תיקיות.
- ☐ אבטחה/הרשאות: חיזוק Firestore rules, אימות קליינט/פונקציות.
- ☐ Deploy לפרודקשן (Firebase Hosting + Functions).

---

### הערות אחרונות
- קובץ זה הוא “עוגן” — מעדכנים אותו כשמתבצעים שינויים מהותיים (SMTP, PDF assets, פונקציות, מבנה DB/קבצים).  
- אם יש הבדלים קטנים בין הסנאפשוט לקוד — תמיד נאמן לקוד ב־repo; אעדכן את המסמך לפי הצורך.
