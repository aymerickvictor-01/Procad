import { ChevronRight } from "lucide-react";
import { Link } from "react-router";

import Container from "./Container";
import { Eyebrow } from "./SectionHeader";

/** Fil d'Ariane : [{ to, label }, ..., { label }] — le dernier élément est la page courante. */
export function Breadcrumb({ items }) {
  return (
    <nav aria-label="Fil d'Ariane">
      <ol className="flex flex-wrap items-center gap-1.5 text-[13px] text-ink-tertiary">
        {items.map((item, index) => (
          <li key={item.label} className="flex items-center gap-1.5">
            {index > 0 && <ChevronRight className="size-3.5 text-ink-muted" aria-hidden="true" />}
            {item.to ? (
              <Link to={item.to} className="transition-colors hover:text-white">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-ink-secondary">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** En-tête sombre des pages intérieures. */
export default function PageHero({ eyebrow, title, description, breadcrumb, children }) {
  return (
    <section className="relative overflow-hidden bg-night text-ink">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="bg-dots absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]" />
        <div className="absolute -top-48 left-1/3 h-[420px] w-[760px] rounded-full bg-primary/20 blur-[120px]" />
      </div>
      <Container className="relative py-14 sm:py-20">
        {breadcrumb && <Breadcrumb items={breadcrumb} />}
        {eyebrow && (
          <Eyebrow dark className="mt-8">
            {eyebrow}
          </Eyebrow>
        )}
        <h1 className="mt-5 max-w-3xl text-4xl leading-[1.08] font-bold tracking-[-0.03em] text-white sm:text-5xl">
          {title}
        </h1>
        {description && (
          <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-ink-secondary sm:text-lg">{description}</p>
        )}
        {children}
      </Container>
      <div className="divider-glow" />
    </section>
  );
}
