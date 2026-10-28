import { ChevronLeft, ChevronRight } from "lucide-react";

/** Numéros affichés : première, dernière, et deux pages autour de la page courante. */
function pageNumbers(current, total) {
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  return sorted.flatMap((n, i) => (i > 0 && n - sorted[i - 1] > 1 ? ["…", n] : [n]));
}

export default function Pagination({ page, count, pageSize = 12, onChange }) {
  const total = Math.ceil(count / pageSize);
  if (total <= 1) return null;

  const base = "grid h-10 min-w-10 place-items-center rounded-full px-3 text-sm font-semibold transition-colors";
  return (
    <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-1.5">
      <button
        type="button"
        className={`${base} text-gray-700 hover:bg-gray-100 disabled:opacity-40`}
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        aria-label="Page précédente"
      >
        <ChevronLeft className="size-4" />
      </button>
      {pageNumbers(page, total).map((n, i) =>
        n === "…" ? (
          <span key={`gap-${i}`} className="px-1 text-gray-400">
            …
          </span>
        ) : (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-current={n === page ? "page" : undefined}
            className={`${base} ${
              n === page ? "bg-primary text-white shadow-glow" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            {n}
          </button>
        ),
      )}
      <button
        type="button"
        className={`${base} text-gray-700 hover:bg-gray-100 disabled:opacity-40`}
        disabled={page >= total}
        onClick={() => onChange(page + 1)}
        aria-label="Page suivante"
      >
        <ChevronRight className="size-4" />
      </button>
    </nav>
  );
}
