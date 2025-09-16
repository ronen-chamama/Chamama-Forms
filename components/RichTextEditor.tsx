"use client";

import React, { useEffect, useRef } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";

// משרשר קלאסים ומדלג על false/null/undefined
const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

type Props = {
  value: string;                 // HTML
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;            // למשל "min-h-[140px]"
};

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "כתבו כאן טקסט…",
  className,
}: Props) {
  const lastHtmlRef = useRef<string>("");

const editor = useEditor({
  immediatelyRender: false,
  extensions: [
    StarterKit.configure({
      heading: { levels: [2, 3, 4] },
      link: false,       // מונע כפילות של 'link' מה־StarterKit
      underline: false,  // מונע כפילות של 'underline' מה־StarterKit
    }),
    Underline,
    Link.configure({
      openOnClick: false,
      autolink: true,
      protocols: ["http", "https", "mailto"],
      HTMLAttributes: { rel: "noopener noreferrer nofollow" },
    }),
    TextAlign.configure({
      types: ["heading", "paragraph"],
      alignments: ["right", "left", "center", "justify"],
      defaultAlignment: "right",
    }),
    Placeholder.configure({ placeholder }),
  ],
    content: value || "",
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      lastHtmlRef.current = html;
      onChange(html);
    },
    editorProps: {
      attributes: {
        dir: "rtl",
        class: "prosemirror-content p-3 md:p-4 outline-none",
      },
    },
  });

  // סנכרון ערך חיצוני אם השתנה
  useEffect(() => {
    if (!editor) return;
    if (value === lastHtmlRef.current) return;
    editor.commands.setContent(value || "", false);
  }, [value, editor]);

  if (!editor) {
    return <div className={cx("prosemirror-content p-3 md:p-4", className)} />;
  }

  return (
    <div className={cx("w-full", className)}>
      {/* סרגל כלים מינימלי ונקי */}
      <div className="flex flex-wrap items-center gap-1 border-b border-neutral-200 px-2 py-1.5">
        <MenuButton
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          label="מודגש"
        >
          B
        </MenuButton>
        <MenuButton
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          label="נטוי"
        >
          <span className="italic">I</span>
        </MenuButton>
        <MenuButton
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          label="קו תחתי"
        >
          <span className="underline">U</span>
        </MenuButton>

        <div className="mx-2 h-5 w-px bg-neutral-200" />

        <MenuButton
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          label="כותרת H2"
        >
          H2
        </MenuButton>
        <MenuButton
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          label="כותרת H3"
        >
          H3
        </MenuButton>
        <MenuButton
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          label="רשימה נקודתית"
        >
          • • •
        </MenuButton>
        <MenuButton
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          label="רשימה ממוספרת"
        >
          1·2·3
        </MenuButton>

        <div className="mx-2 h-5 w-px bg-neutral-200" />

        <MenuButton
          onClick={() => {
            const url = prompt("קישור (URL):", "https://");
            if (url)
              editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
          }}
          label="הוספת קישור"
        >
          🔗
        </MenuButton>
        <MenuButton
          active={editor.isActive({ textAlign: "right" })}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          label="יישור לימין"
        >
          ↦
        </MenuButton>
        <MenuButton
          active={editor.isActive({ textAlign: "center" })}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          label="מרכז"
        >
          ↔
        </MenuButton>
        <MenuButton
          active={editor.isActive({ textAlign: "left" })}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          label="יישור לשמאל"
        >
          ↤
        </MenuButton>

        <div className="mx-2 h-5 w-px bg-neutral-200" />

        <MenuButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          label="בטל"
        >
          ↺
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          label="חזור"
        >
          ↻
        </MenuButton>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}

/* -------- UI helpers -------- */

function MenuButton({
  children,
  onClick,
  active,
  disabled,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      disabled={disabled}
      className={[
        "h-8 min-w-8 rounded-md px-2 text-sm",
        "border border-neutral-200 bg-white hover:bg-neutral-50",
        active ? "ring-2 ring-sky-400" : "",
        disabled ? "opacity-40 cursor-not-allowed" : "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
