(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/lib/firebaseClient.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "app",
    ()=>app,
    "auth",
    ()=>auth,
    "db",
    ()=>db,
    "functions",
    ()=>functions,
    "storage",
    ()=>storage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$firebase$2f$app$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/firebase/app/dist/esm/index.esm.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$app$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@firebase/app/dist/esm/index.esm.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$firebase$2f$auth$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/firebase/auth/dist/esm/index.esm.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@firebase/auth/dist/esm/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$firebase$2f$firestore$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/firebase/firestore/dist/esm/index.esm.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@firebase/firestore/dist/index.esm.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$firebase$2f$storage$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/firebase/storage/dist/esm/index.esm.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$storage$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@firebase/storage/dist/index.esm.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$firebase$2f$functions$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/firebase/functions/dist/esm/index.esm.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$functions$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@firebase/functions/dist/esm/index.esm.js [app-client] (ecmascript)");
;
;
;
;
;
const firebaseConfig = {
    apiKey: ("TURBOPACK compile-time value", "AIzaSyDYQfltkDCGJvCgtgCNzVfyA5nUJy5KNNc"),
    authDomain: ("TURBOPACK compile-time value", "chamama-addfd.firebaseapp.com"),
    projectId: ("TURBOPACK compile-time value", "chamama-addfd"),
    storageBucket: ("TURBOPACK compile-time value", "chamama-addfd.firebasestorage.app"),
    appId: ("TURBOPACK compile-time value", "1:542858138442:web:abe34a5d9cccf70af5e7b3")
};
const app = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$app$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getApps"])().length ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$app$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getApp"])() : (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$app$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["initializeApp"])(firebaseConfig);
const auth = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAuth"])(app);
const db = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getFirestore"])(app);
const storage = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$storage$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getStorage"])(app);
const functions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$functions$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getFunctions"])(app, "us-central1");
// חיבור אמולטורים לוקאלית
if ("object" !== "undefined" && location.hostname === "localhost") {
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["connectAuthEmulator"])(auth, "http://127.0.0.1:9099");
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["connectFirestoreEmulator"])(db, "127.0.0.1", 8080);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$storage$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["connectStorageEmulator"])(storage, "127.0.0.1", 9199);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$functions$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["connectFunctionsEmulator"])(functions, "127.0.0.1", 5001);
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/RichTextEditor.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>RichTextEditor
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$jsx$2f$style$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/styled-jsx/style.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
function RichTextEditor(param) {
    let { value, onChange, placeholder } = param;
    _s();
    const hostRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const quillRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    // אתחול Quill חד-פעמי (רק בצד לקוח)
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "RichTextEditor.useEffect": ()=>{
            let mounted = true;
            ({
                "RichTextEditor.useEffect": async ()=>{
                    // תמיכה גם אם המודול מחזיר default וגם אם לא
                    const mod = await __turbopack_context__.A("[project]/node_modules/quill/dist/quill.js [app-client] (ecmascript, async loader)");
                    var _mod_default;
                    const Quill = (_mod_default = mod === null || mod === void 0 ? void 0 : mod.default) !== null && _mod_default !== void 0 ? _mod_default : mod;
                    if (!mounted || !hostRef.current || quillRef.current) return;
                    const modules = {
                        toolbar: [
                            [
                                {
                                    header: [
                                        1,
                                        2,
                                        3,
                                        false
                                    ]
                                }
                            ],
                            [
                                "bold",
                                "italic",
                                "underline",
                                "strike"
                            ],
                            [
                                {
                                    list: "ordered"
                                },
                                {
                                    list: "bullet"
                                }
                            ],
                            [
                                {
                                    align: []
                                },
                                {
                                    direction: "rtl"
                                }
                            ],
                            [
                                "link"
                            ],
                            [
                                "clean"
                            ]
                        ],
                        clipboard: {
                            matchVisual: false
                        }
                    };
                    const formats = [
                        "header",
                        "bold",
                        "italic",
                        "underline",
                        "strike",
                        "list",
                        "bullet",
                        "align",
                        "direction",
                        "link"
                    ];
                    const q = new Quill(hostRef.current, {
                        theme: "snow",
                        modules,
                        formats,
                        placeholder
                    });
                    quillRef.current = q;
                    // RTL + עברית
                    q.root.setAttribute("dir", "rtl");
                    q.root.setAttribute("lang", "he");
                    // ערך התחלתי
                    if (value) {
                        q.clipboard.dangerouslyPasteHTML(value);
                    }
                    // שינויי טקסט → onChange
                    const handler = {
                        "RichTextEditor.useEffect.handler": ()=>onChange(q.root.innerHTML)
                    }["RichTextEditor.useEffect.handler"];
                    q.on("text-change", handler);
                    // ניקוי מאזינים ביציאה
                    return ({
                        "RichTextEditor.useEffect": ()=>{
                            try {
                                q.off("text-change", handler);
                            } catch (e) {}
                        }
                    })["RichTextEditor.useEffect"];
                }
            })["RichTextEditor.useEffect"]();
            return ({
                "RichTextEditor.useEffect": ()=>{
                    mounted = false;
                    quillRef.current = null;
                }
            })["RichTextEditor.useEffect"];
        }
    }["RichTextEditor.useEffect"], []); // לאתחל פעם אחת
    // סינכרון ערך חיצוני → עורך, בלי למחוק בחירה
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "RichTextEditor.useEffect": ()=>{
            const q = quillRef.current;
            if (!q || typeof value !== "string") return;
            const current = q.root.innerHTML;
            if (current === value) return;
            const sel = q.getSelection();
            q.clipboard.dangerouslyPasteHTML(value || "");
            if (sel) q.setSelection(sel);
        }
    }["RichTextEditor.useEffect"], [
        value
    ]);
    // עטיפה כדי לבודד את ה-CSS של Quill
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "jsx-cc2ee0510a50c3b6" + " " + "quill-wrap border rounded bg-white",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                ref: hostRef,
                className: "jsx-cc2ee0510a50c3b6"
            }, void 0, false, {
                fileName: "[project]/components/RichTextEditor.tsx",
                lineNumber: 102,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$jsx$2f$style$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                id: "cc2ee0510a50c3b6",
                children: ".quill-wrap.jsx-cc2ee0510a50c3b6 .ql-container{border-top:0;min-height:160px}.quill-wrap.jsx-cc2ee0510a50c3b6 .ql-toolbar{border-bottom:1px solid #e5e7eb}"
            }, void 0, false, void 0, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/RichTextEditor.tsx",
        lineNumber: 101,
        columnNumber: 5
    }, this);
}
_s(RichTextEditor, "iAz2iA5Uj0ZCPKK8QMk8oopHUJA=");
_c = RichTextEditor;
var _c;
__turbopack_context__.k.register(_c, "RichTextEditor");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/app/forms/[id]/edit/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>EditFormPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$firebase$2f$auth$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/firebase/auth/dist/esm/index.esm.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@firebase/auth/dist/esm/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebaseClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/firebaseClient.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$firebase$2f$firestore$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/firebase/firestore/dist/esm/index.esm.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@firebase/firestore/dist/index.esm.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$RichTextEditor$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/RichTextEditor.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$dnd$2d$kit$2f$core$2f$dist$2f$core$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@dnd-kit/core/dist/core.esm.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$dnd$2d$kit$2f$sortable$2f$dist$2f$sortable$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@dnd-kit/sortable/dist/sortable.esm.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$dnd$2d$kit$2f$utilities$2f$dist$2f$utilities$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@dnd-kit/utilities/dist/utilities.esm.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature(), _s2 = __turbopack_context__.k.signature(), _s3 = __turbopack_context__.k.signature(), _s4 = __turbopack_context__.k.signature(), _s5 = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
;
;
;
/* ---------------------- עזרים ---------------------- */ function uid() {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
    return "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}
function createBaseField(type) {
    const base = {
        id: uid(),
        type,
        label: "",
        required: false
    };
    switch(type){
        case "text":
            base.label = "שדה טקסט";
            break;
        case "textarea":
            base.label = "איזור טקסט";
            break;
        case "parentName":
            base.label = "שם ההורה";
            break;
        case "number":
            base.label = "מספר";
            break;
        case "phone":
            base.label = "טלפון";
            break;
        case "email":
            base.label = 'דוא"ל';
            break;
        case "consent":
            base.label = "הסכמה";
            base.description = "אני מאשר/ת ...";
            break;
        case "select":
            base.label = "בחירה מרשימה";
            base.options = [];
            break;
        case "radio":
            base.label = "בחירה";
            base.options = [];
            break;
        case "checkbox":
            base.label = "בחירה מרובה";
            base.options = [];
            break;
        case "signature":
            base.label = "חתימה";
            break;
        case "richtext":
            base.label = "טקסט עשיר";
            break;
        default:
            base.label = "שדה";
    }
    return base;
}
/* ---------------------- קומפוננטות עזר ---------------------- */ function SortableFieldRow(param) {
    let { field, onUpdate, onDelete } = param;
    _s();
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$dnd$2d$kit$2f$sortable$2f$dist$2f$sortable$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSortable"])({
        id: field.id
    });
    const style = {
        transform: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$dnd$2d$kit$2f$utilities$2f$dist$2f$utilities$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CSS"].Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        background: "white"
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
        ref: setNodeRef,
        style: style,
        className: "border p-2 rounded bg-white",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex gap-2 items-center",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        className: "px-2 py-1 border rounded cursor-grab select-none",
                        ...attributes,
                        ...listeners,
                        title: "גרור לשינוי סדר",
                        children: "⠿"
                    }, void 0, false, {
                        fileName: "[project]/app/forms/[id]/edit/page.tsx",
                        lineNumber: 102,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-xs px-2 py-1 border rounded",
                        children: field.type
                    }, void 0, false, {
                        fileName: "[project]/app/forms/[id]/edit/page.tsx",
                        lineNumber: 112,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        className: "border p-1 flex-1",
                        value: field.label,
                        onChange: (e)=>onUpdate({
                                label: e.target.value
                            })
                    }, void 0, false, {
                        fileName: "[project]/app/forms/[id]/edit/page.tsx",
                        lineNumber: 114,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        className: "flex items-center gap-1 text-sm",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "checkbox",
                                checked: !!field.required,
                                onChange: (e)=>onUpdate({
                                        required: e.target.checked
                                    })
                            }, void 0, false, {
                                fileName: "[project]/app/forms/[id]/edit/page.tsx",
                                lineNumber: 121,
                                columnNumber: 11
                            }, this),
                            "נדרש"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/forms/[id]/edit/page.tsx",
                        lineNumber: 120,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        className: "text-red-600",
                        onClick: onDelete,
                        children: "מחק"
                    }, void 0, false, {
                        fileName: "[project]/app/forms/[id]/edit/page.tsx",
                        lineNumber: 129,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/forms/[id]/edit/page.tsx",
                lineNumber: 101,
                columnNumber: 7
            }, this),
            (field.type === "select" || field.type === "radio" || field.type === "checkbox") && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-2",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(OptionsEditor, {
                    value: field.options || [],
                    onChange: (opts)=>onUpdate({
                            options: opts
                        })
                }, void 0, false, {
                    fileName: "[project]/app/forms/[id]/edit/page.tsx",
                    lineNumber: 136,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/forms/[id]/edit/page.tsx",
                lineNumber: 135,
                columnNumber: 9
            }, this),
            field.type === "consent" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                className: "border p-2 w-full rounded mt-2",
                rows: 3,
                placeholder: "פירוט ההסכמה שיוצג להורים…",
                value: field.description || "",
                onChange: (e)=>onUpdate({
                        description: e.target.value
                    })
            }, void 0, false, {
                fileName: "[project]/app/forms/[id]/edit/page.tsx",
                lineNumber: 144,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/forms/[id]/edit/page.tsx",
        lineNumber: 100,
        columnNumber: 5
    }, this);
}
_s(SortableFieldRow, "wZ9LrlAdu45h+k5IBlwhyTPFbVs=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$dnd$2d$kit$2f$sortable$2f$dist$2f$sortable$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSortable"]
    ];
});
_c = SortableFieldRow;
function OptionsEditor(param) {
    let { value, onChange } = param;
    _s1();
    const [input, setInput] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    function addOpt() {
        const v = input.trim();
        if (!v || value.includes(v)) return;
        onChange([
            ...value,
            v
        ]);
        setInput("");
    }
    function removeOpt(opt) {
        onChange(value.filter((x)=>x !== opt));
    }
    function renameOpt(i, txt) {
        const next = value.slice();
        next[i] = txt;
        onChange(next.filter(Boolean));
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-2",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex gap-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        className: "border p-2 rounded flex-1",
                        placeholder: "הוספת אפשרות…",
                        value: input,
                        onChange: (e)=>setInput(e.target.value),
                        onKeyDown: (e)=>e.key === "Enter" && addOpt()
                    }, void 0, false, {
                        fileName: "[project]/app/forms/[id]/edit/page.tsx",
                        lineNumber: 171,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        className: "border px-3 rounded",
                        onClick: addOpt,
                        children: "הוסף"
                    }, void 0, false, {
                        fileName: "[project]/app/forms/[id]/edit/page.tsx",
                        lineNumber: 178,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/forms/[id]/edit/page.tsx",
                lineNumber: 170,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                className: "space-y-1",
                children: value.map((opt, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                        className: "flex items-center gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-gray-500 text-xs",
                                children: [
                                    i + 1,
                                    "."
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/forms/[id]/edit/page.tsx",
                                lineNumber: 183,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                className: "border p-1 rounded flex-1",
                                value: opt,
                                onChange: (e)=>renameOpt(i, e.target.value)
                            }, void 0, false, {
                                fileName: "[project]/app/forms/[id]/edit/page.tsx",
                                lineNumber: 184,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                className: "text-red-600",
                                onClick: ()=>removeOpt(opt),
                                children: "מחק"
                            }, void 0, false, {
                                fileName: "[project]/app/forms/[id]/edit/page.tsx",
                                lineNumber: 185,
                                columnNumber: 13
                            }, this)
                        ]
                    }, opt + i, true, {
                        fileName: "[project]/app/forms/[id]/edit/page.tsx",
                        lineNumber: 182,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/app/forms/[id]/edit/page.tsx",
                lineNumber: 180,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/forms/[id]/edit/page.tsx",
        lineNumber: 169,
        columnNumber: 5
    }, this);
}
_s1(OptionsEditor, "RL+Zbs2TIka0YpcBOJptmHqCgYA=");
_c1 = OptionsEditor;
/** droppable כשאין בכלל פריטים */ function EmptyCanvasDroppable(param) {
    let { children } = param;
    _s2();
    const { isOver, setNodeRef } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$dnd$2d$kit$2f$core$2f$dist$2f$core$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDroppable"])({
        id: "canvas"
    });
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: setNodeRef,
        className: "rounded border-2 p-1 ".concat(isOver ? "border-blue-400" : "border-dashed border-gray-300"),
        children: children
    }, void 0, false, {
        fileName: "[project]/app/forms/[id]/edit/page.tsx",
        lineNumber: 197,
        columnNumber: 5
    }, this);
}
_s2(EmptyCanvasDroppable, "fT702R7NW3L8KUJObOwGrnMsXMQ=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$dnd$2d$kit$2f$core$2f$dist$2f$core$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDroppable"]
    ];
});
_c2 = EmptyCanvasDroppable;
/** דרופ־זון בקצה התחתון כדי שדרופ על הריק יוסיף בסוף */ function EndDropZone(param) {
    let { show } = param;
    _s3();
    const { setNodeRef, isOver } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$dnd$2d$kit$2f$core$2f$dist$2f$core$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDroppable"])({
        id: "end"
    });
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
        ref: setNodeRef,
        className: "px-2 h-6 ".concat(isOver ? "bg-blue-50" : ""),
        children: show && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "h-0.5 bg-blue-500 rounded-full my-1"
        }, void 0, false, {
            fileName: "[project]/app/forms/[id]/edit/page.tsx",
            lineNumber: 208,
            columnNumber: 16
        }, this)
    }, void 0, false, {
        fileName: "[project]/app/forms/[id]/edit/page.tsx",
        lineNumber: 207,
        columnNumber: 5
    }, this);
}
_s3(EndDropZone, "DmJTTt6A5xWIX/faBiFge3FOLrw=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$dnd$2d$kit$2f$core$2f$dist$2f$core$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDroppable"]
    ];
});
_c3 = EndDropZone;
/** פריט פאלאט: גם גריר, גם לחיץ */ function DraggablePaletteItem(param) {
    let { type, label, onAdd } = param;
    _s4();
    const id = "palette:".concat(type);
    const { attributes, listeners, setNodeRef, transform, isDragging } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$dnd$2d$kit$2f$core$2f$dist$2f$core$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDraggable"])({
        id,
        data: {
            from: "palette",
            type
        }
    });
    const style = {
        transform: transform ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$dnd$2d$kit$2f$utilities$2f$dist$2f$utilities$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CSS"].Translate.toString(transform) : undefined,
        opacity: isDragging ? 0.6 : 1
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        ref: setNodeRef,
        type: "button",
        ...attributes,
        ...listeners,
        onClick: ()=>onAdd(type),
        style: style,
        className: "border p-2 rounded bg-white",
        title: "לחץ להוספה או גרור אל אזור הטופס",
        children: label
    }, void 0, false, {
        fileName: "[project]/app/forms/[id]/edit/page.tsx",
        lineNumber: 222,
        columnNumber: 5
    }, this);
}
_s4(DraggablePaletteItem, "uZNJ3/8UzXAvFYh/tqZxqBQOH0I=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$dnd$2d$kit$2f$core$2f$dist$2f$core$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDraggable"]
    ];
});
_c4 = DraggablePaletteItem;
function EditFormPage() {
    _s5();
    const { id } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useParams"])();
    const [title, setTitle] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [descriptionHtml, setDescriptionHtml] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [schema, setSchema] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [saving, setSaving] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    // אינדקס ההכנסה (לפני מי מכניסים)
    const [dropIndex, setDropIndex] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "EditFormPage.useEffect": ()=>{
            const unsub = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["onAuthStateChanged"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebaseClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["auth"], {
                "EditFormPage.useEffect.unsub": (u)=>{
                    if (!u) location.href = "/login";
                }
            }["EditFormPage.useEffect.unsub"]);
            return ({
                "EditFormPage.useEffect": ()=>unsub()
            })["EditFormPage.useEffect"];
        }
    }["EditFormPage.useEffect"], []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "EditFormPage.useEffect": ()=>{
            let cancelled = false;
            ({
                "EditFormPage.useEffect": async ()=>{
                    setLoading(true);
                    try {
                        const snap = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getDoc"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebaseClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["db"], "forms", id));
                        const data = snap.data();
                        if (!cancelled) {
                            setTitle((data === null || data === void 0 ? void 0 : data.title) || "");
                            setDescriptionHtml((data === null || data === void 0 ? void 0 : data.descriptionHtml) || "");
                            setSchema((data === null || data === void 0 ? void 0 : data.schema) || []);
                        }
                    } finally{
                        if (!cancelled) setLoading(false);
                    }
                }
            })["EditFormPage.useEffect"]();
            return ({
                "EditFormPage.useEffect": ()=>{
                    cancelled = true;
                }
            })["EditFormPage.useEffect"];
        }
    }["EditFormPage.useEffect"], [
        id
    ]);
    function addField(type) {
        setSchema((prev)=>[
                ...prev,
                createBaseField(type)
            ]);
    }
    function insertFieldAt(type, index) {
        const field = createBaseField(type);
        setSchema((prev)=>{
            const i = Math.max(0, Math.min(index, prev.length));
            return [
                ...prev.slice(0, i),
                field,
                ...prev.slice(i)
            ];
        });
    }
    function updateField(index, patch) {
        setSchema((prev)=>prev.map((f, i)=>i === index ? {
                    ...f,
                    ...patch
                } : f));
    }
    function removeField(index) {
        setSchema((prev)=>prev.filter((_, i)=>i !== index));
    }
    async function save() {
        try {
            setSaving(true);
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["updateDoc"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebaseClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["db"], "forms", id), {
                title,
                descriptionHtml,
                schema,
                updatedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["serverTimestamp"])()
            });
        } finally{
            setSaving(false);
        }
    }
    function openPreview() {
        window.open("/f/".concat(id), "_blank", "noopener,noreferrer");
    }
    const sensors = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$dnd$2d$kit$2f$core$2f$dist$2f$core$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSensors"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$dnd$2d$kit$2f$core$2f$dist$2f$core$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSensor"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$dnd$2d$kit$2f$core$2f$dist$2f$core$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PointerSensor"], {
        activationConstraint: {
            distance: 5
        }
    }));
    function handleDragStart(_) {
        setDropIndex(null);
    }
    function handleDragOver(e) {
        const { over } = e;
        if (!over) {
            setDropIndex(null);
            return;
        }
        if (over.id === "canvas") {
            setDropIndex(0);
            return;
        } // רשימה ריקה
        if (over.id === "end") {
            setDropIndex(schema.length);
            return;
        } // דרופ בסוף
        // כשעובדים מול פריט — נכניס לפניו
        const overIdx = schema.findIndex((f)=>f.id === String(over.id));
        setDropIndex(overIdx === -1 ? null : overIdx);
    }
    function handleDragEnd(e) {
        var _active_data_current, _active_data, _active_data_current1, _active_data1;
        const { active } = e;
        const targetIndex = dropIndex;
        setDropIndex(null);
        if (targetIndex == null) return;
        const fromPalette = ((_active_data = active.data) === null || _active_data === void 0 ? void 0 : (_active_data_current = _active_data.current) === null || _active_data_current === void 0 ? void 0 : _active_data_current.from) === "palette";
        const paletteType = (_active_data1 = active.data) === null || _active_data1 === void 0 ? void 0 : (_active_data_current1 = _active_data1.current) === null || _active_data_current1 === void 0 ? void 0 : _active_data_current1.type;
        if (fromPalette && paletteType) {
            insertFieldAt(paletteType, targetIndex);
            return;
        }
        const oldIndex = schema.findIndex((f)=>f.id === String(active.id));
        if (oldIndex === -1) return;
        setSchema((items)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$dnd$2d$kit$2f$sortable$2f$dist$2f$sortable$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["arrayMove"])(items, oldIndex, targetIndex));
    }
    if (loading) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
        dir: "rtl",
        className: "p-6 max-w-6xl mx-auto",
        children: "טוען…"
    }, void 0, false, {
        fileName: "[project]/app/forms/[id]/edit/page.tsx",
        lineNumber: 330,
        columnNumber: 23
    }, this);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
        dir: "rtl",
        className: "p-6 max-w-6xl mx-auto",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-wrap items-center gap-3 mb-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        className: "border p-2 rounded flex-1 text-xl",
                        placeholder: "כותרת הטופס (נשמר גם כשם הטופס)",
                        value: title,
                        onChange: (e)=>setTitle(e.target.value)
                    }, void 0, false, {
                        fileName: "[project]/app/forms/[id]/edit/page.tsx",
                        lineNumber: 335,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: save,
                        className: "border p-2 rounded",
                        disabled: saving,
                        children: saving ? "שומר…" : "שמור"
                    }, void 0, false, {
                        fileName: "[project]/app/forms/[id]/edit/page.tsx",
                        lineNumber: 341,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: openPreview,
                        className: "border p-2 rounded",
                        children: "תצוגה להורה"
                    }, void 0, false, {
                        fileName: "[project]/app/forms/[id]/edit/page.tsx",
                        lineNumber: 344,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/forms/[id]/edit/page.tsx",
                lineNumber: 334,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-6",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$RichTextEditor$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                    value: descriptionHtml,
                    onChange: setDescriptionHtml
                }, void 0, false, {
                    fileName: "[project]/app/forms/[id]/edit/page.tsx",
                    lineNumber: 348,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/forms/[id]/edit/page.tsx",
                lineNumber: 347,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$dnd$2d$kit$2f$core$2f$dist$2f$core$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DndContext"], {
                sensors: sensors,
                onDragStart: handleDragStart,
                onDragOver: handleDragOver,
                onDragEnd: handleDragEnd,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "grid grid-cols-1 sm:grid-cols-3 gap-4",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                            className: "sm:col-span-2 space-y-3",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                    className: "text-lg font-semibold mb-2",
                                    children: "שדות הטופס"
                                }, void 0, false, {
                                    fileName: "[project]/app/forms/[id]/edit/page.tsx",
                                    lineNumber: 356,
                                    columnNumber: 13
                                }, this),
                                schema.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(EmptyCanvasDroppable, {
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                        className: "space-y-2 min-h-[120px] p-4 rounded bg-gray-50",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                            className: "text-gray-500 text-sm border rounded bg-white p-4",
                                            children: "גרור/י רכיב מהצד הימני כדי להתחיל לבנות טופס."
                                        }, void 0, false, {
                                            fileName: "[project]/app/forms/[id]/edit/page.tsx",
                                            lineNumber: 361,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/app/forms/[id]/edit/page.tsx",
                                        lineNumber: 360,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/app/forms/[id]/edit/page.tsx",
                                    lineNumber: 359,
                                    columnNumber: 15
                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$dnd$2d$kit$2f$sortable$2f$dist$2f$sortable$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SortableContext"], {
                                    items: schema.map((f)=>f.id),
                                    strategy: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$dnd$2d$kit$2f$sortable$2f$dist$2f$sortable$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["verticalListSortingStrategy"],
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                        className: "space-y-2 min-h-[120px] p-1 rounded bg-gray-50",
                                        children: [
                                            dropIndex === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                "aria-hidden": true,
                                                className: "px-2",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "h-0.5 bg-blue-500 rounded-full my-1"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/forms/[id]/edit/page.tsx",
                                                    lineNumber: 372,
                                                    columnNumber: 23
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/app/forms/[id]/edit/page.tsx",
                                                lineNumber: 371,
                                                columnNumber: 21
                                            }, this),
                                            schema.map((f, idx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                                    children: [
                                                        dropIndex === idx && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                            "aria-hidden": true,
                                                            className: "px-2",
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "h-0.5 bg-blue-500 rounded-full my-1"
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/forms/[id]/edit/page.tsx",
                                                                lineNumber: 381,
                                                                columnNumber: 27
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/forms/[id]/edit/page.tsx",
                                                            lineNumber: 380,
                                                            columnNumber: 25
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SortableFieldRow, {
                                                            field: f,
                                                            onUpdate: (patch)=>updateField(idx, patch),
                                                            onDelete: ()=>removeField(idx)
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/forms/[id]/edit/page.tsx",
                                                            lineNumber: 384,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, f.id, true, {
                                                    fileName: "[project]/app/forms/[id]/edit/page.tsx",
                                                    lineNumber: 377,
                                                    columnNumber: 21
                                                }, this)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(EndDropZone, {
                                                show: dropIndex === schema.length
                                            }, void 0, false, {
                                                fileName: "[project]/app/forms/[id]/edit/page.tsx",
                                                lineNumber: 393,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/forms/[id]/edit/page.tsx",
                                        lineNumber: 368,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/app/forms/[id]/edit/page.tsx",
                                    lineNumber: 367,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/forms/[id]/edit/page.tsx",
                            lineNumber: 355,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
                            className: "sm:col-span-1 space-y-2 sm:sticky sm:top-4 self-start",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                    className: "text-lg font-semibold mb-2",
                                    children: "רכיבי טופס"
                                }, void 0, false, {
                                    fileName: "[project]/app/forms/[id]/edit/page.tsx",
                                    lineNumber: 401,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "grid grid-cols-2 gap-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(DraggablePaletteItem, {
                                            type: "text",
                                            label: "שדה טקסט",
                                            onAdd: addField
                                        }, void 0, false, {
                                            fileName: "[project]/app/forms/[id]/edit/page.tsx",
                                            lineNumber: 403,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(DraggablePaletteItem, {
                                            type: "textarea",
                                            label: "איזור טקסט",
                                            onAdd: addField
                                        }, void 0, false, {
                                            fileName: "[project]/app/forms/[id]/edit/page.tsx",
                                            lineNumber: 404,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(DraggablePaletteItem, {
                                            type: "parentName",
                                            label: "שם ההורה",
                                            onAdd: addField
                                        }, void 0, false, {
                                            fileName: "[project]/app/forms/[id]/edit/page.tsx",
                                            lineNumber: 405,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(DraggablePaletteItem, {
                                            type: "number",
                                            label: "שדה מספר",
                                            onAdd: addField
                                        }, void 0, false, {
                                            fileName: "[project]/app/forms/[id]/edit/page.tsx",
                                            lineNumber: 406,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(DraggablePaletteItem, {
                                            type: "phone",
                                            label: "טלפון",
                                            onAdd: addField
                                        }, void 0, false, {
                                            fileName: "[project]/app/forms/[id]/edit/page.tsx",
                                            lineNumber: 407,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(DraggablePaletteItem, {
                                            type: "email",
                                            label: 'דוא"ל',
                                            onAdd: addField
                                        }, void 0, false, {
                                            fileName: "[project]/app/forms/[id]/edit/page.tsx",
                                            lineNumber: 408,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(DraggablePaletteItem, {
                                            type: "consent",
                                            label: "הסכמה",
                                            onAdd: addField
                                        }, void 0, false, {
                                            fileName: "[project]/app/forms/[id]/edit/page.tsx",
                                            lineNumber: 409,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(DraggablePaletteItem, {
                                            type: "select",
                                            label: "בחירה מרשימה",
                                            onAdd: addField
                                        }, void 0, false, {
                                            fileName: "[project]/app/forms/[id]/edit/page.tsx",
                                            lineNumber: 410,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(DraggablePaletteItem, {
                                            type: "radio",
                                            label: "בחירה (radio)",
                                            onAdd: addField
                                        }, void 0, false, {
                                            fileName: "[project]/app/forms/[id]/edit/page.tsx",
                                            lineNumber: 411,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(DraggablePaletteItem, {
                                            type: "checkbox",
                                            label: "בחירה מרובה",
                                            onAdd: addField
                                        }, void 0, false, {
                                            fileName: "[project]/app/forms/[id]/edit/page.tsx",
                                            lineNumber: 412,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(DraggablePaletteItem, {
                                            type: "signature",
                                            label: "חתימה",
                                            onAdd: addField
                                        }, void 0, false, {
                                            fileName: "[project]/app/forms/[id]/edit/page.tsx",
                                            lineNumber: 413,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/forms/[id]/edit/page.tsx",
                                    lineNumber: 402,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/forms/[id]/edit/page.tsx",
                            lineNumber: 400,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/forms/[id]/edit/page.tsx",
                    lineNumber: 353,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/forms/[id]/edit/page.tsx",
                lineNumber: 351,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/forms/[id]/edit/page.tsx",
        lineNumber: 333,
        columnNumber: 5
    }, this);
}
_s5(EditFormPage, "XqbIeB9eVutyCgG4jZOnmLccW1g=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useParams"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$dnd$2d$kit$2f$core$2f$dist$2f$core$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSensors"]
    ];
});
_c5 = EditFormPage;
var _c, _c1, _c2, _c3, _c4, _c5;
__turbopack_context__.k.register(_c, "SortableFieldRow");
__turbopack_context__.k.register(_c1, "OptionsEditor");
__turbopack_context__.k.register(_c2, "EmptyCanvasDroppable");
__turbopack_context__.k.register(_c3, "EndDropZone");
__turbopack_context__.k.register(_c4, "DraggablePaletteItem");
__turbopack_context__.k.register(_c5, "EditFormPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=_7ff156ab._.js.map