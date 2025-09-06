// components/AppFooter.tsx
export default function AppFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-11 flex items-center justify-between text-xs text-neutral-600">
        <span>תיכון החממה עמל הוד השרון</span>
        <span className="flex items-center gap-2">
          <a
            href="https://chamama.org"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            chamama.org
          </a>
          <span>· {year}</span>
        </span>
      </div>
    </footer>
  );
}
