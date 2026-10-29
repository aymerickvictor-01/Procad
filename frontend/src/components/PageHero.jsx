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

/** Photo de fond voilée de bleu marine : plus sombre à gauche, là où se trouve le texte. */
export function PhotoBackground({ image, className = "" }) {
  return (
    <div aria-hidden="true" className={`absolute inset-0 -z-10 ${className}`}>
      {image && <img src={image} alt="" className="size-full object-cover" />}
      <div className="absolute inset-0 bg-gradient-to-r from-night/95 via-night/75 to-night/30" />
      <div className="absolute inset-0 bg-gradient-to-t from-night/60 to-transparent" />
    </div>
  );
}

/** En-tête des pages intérieures, sur photo. */
export default function PageHero({ eyebrow, title, description, breadcrumb, image = "/images/fonds/pages.jpg", children }) {
  return (
    <section className="relative isolate overflow-hidden border-b-4 border-accent bg-night text-ink">
      <PhotoBackground image={image} />
      <Container className="relative py-14 sm:py-20">
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
