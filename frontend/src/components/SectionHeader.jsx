/** En-tête de section : sur-titre, titre, description et action optionnelle à droite. */
export default function SectionHeader({ eyebrow, title, description, action, dark = false, center = false }) {
  return (
    <div
      className={`mb-10 flex flex-col gap-6 sm:mb-12 ${
        center ? "items-center text-center" : "md:flex-row md:items-end md:justify-between"
      }`}
    >
      <div className="max-w-2xl">
        {eyebrow && <Eyebrow dark={dark}>{eyebrow}</Eyebrow>}
        <h2
          className={`mt-3 text-3xl leading-tight font-bold tracking-[-0.02em] sm:text-4xl ${
            dark ? "text-white" : "text-gray-900"
          }`}
        >
          {title}
        </h2>
        {description && (
          <p className={`mt-4 text-[17px] leading-relaxed ${dark ? "text-ink-secondary" : "text-gray-600"}`}>
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/** Sur-titre : petit libellé en capitales. */
export function Eyebrow({ dark = false, className = "", children }) {
  return (
    <span
      className={`inline-flex items-center text-[12px] font-semibold tracking-[0.12em] uppercase ${
        dark ? "text-ink-tertiary" : "text-primary"
      } ${className}`}
    >
      {children}
    </span>
  );
}
