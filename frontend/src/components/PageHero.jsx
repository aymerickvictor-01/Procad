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
      <div aria-hidden="true" className="bg-blueprint absolute inset-0 [mask-image:linear-gradient(to_right,black,transparent_85%)]" />
      <Container className="relative py-12 sm:py-16">
        {breadcrumb && <Breadcrumb items={breadcrumb} />}
        {eyebrow && (
          <Eyebrow dark className="mt-8">
            {eyebrow}
          </Eyebrow>
        )}
        <h1 className="mt-4 max-w-3xl text-4xl leading-[1.08] font-bold tracking-[-0.03em] text-white sm:text-[44px]">
          {title}
        </h1>
        {description && (
          <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-ink-secondary sm:text-lg">{description}</p>
        )}
        {children}
      </Container>
    </section>
  );
}
