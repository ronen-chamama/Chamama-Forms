// lib/copy.ts
export const COPY = {
  appName: "Chamama Forms",
  common: {
    untitled: "ללא כותרת",
  },
  formsPage: {
    title: "הטפסים שלי",
    newFormBtn: "טופס חדש",
    newFormHelp: "צרו טופס חדש והתחילו להוסיף שדות. ניתן לשתף להורים בקישור.",
    emptyState: "עדיין אין טפסים. לחצו “טופס חדש”.",
    filledCount: (n: number) => `מולאו ${n} טפסים`,
    menu: {
      copyLink: "העתקת קישור למילוי",
      edit: "עריכה",
      delete: "מחיקה",
      confirmDeleteTitle: (t: string) => `למחוק את “${t || COPY.common.untitled}”?`,
      cancel: "ביטול",
      deleteAction: "מחיקה",
    },
  },
  editPage: {
    titleLabel: "כותרת הטופס",
    titlePlaceholder: "איך נקרא לטופס הזה?",
    descLabel: "תיאור הטופס",
    descPlaceholder: "הוראות/מידע להורים… ניתן להדביק טקסט עשיר.",
    autosaveSaved: "נשמר אוטומטית",
    autosaveSaving: "שומר…",
    viewBtn: "תצוגה",
    saveBtn: "שמירה",
    paletteTitle: "רכיבי טופס",
    emptyDropHintIdle: "גררו רכיבים מהצד הימני לתוך האזור הזה",
    emptyDropHintActive: "שחררו כאן כדי להוסיף שדה",
  },
  parentForm: {
    submitBtn: "שליחה",
  },
  consent: {
    defaultLabel: "אני מאשר/ת",
    defaultText:
      "אני מאשר/ת כי קראתי והבנתי את האמור לעיל, ומסכים/ה לתנאי ההשתתפות כמפורט.",
  },
  fieldLabels: {
    text: "טקסט",
    textarea: "תיאור ארוך",
    number: "מספר",
    phone: "טלפון",
    email: "דוא״ל",
    select: "בחירה מרשימה",
    radio: "בחירה אחת",
    checkbox: "תיבה",
    checkboxes: "בחירה מרובה",
    consent: "הסכמה",
    signature: "חתימה",
    richtext: "תוכן עשיר",
  },
};
