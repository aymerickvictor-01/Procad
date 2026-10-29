import { ChevronRight } from "lucide-react";
import { Link } from "react-router";

import Container from "./Container";
import ResponsiveImage, { staticVariants } from "./ResponsiveImage";
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
export function PhotoBackground({ image, variants, zoom = false, lazy = false, className = "" }) {
  // Photos fournies avec le site : versions WebP générées à côté (public/images/fonds).
  const sources = variants ?? (image?.startsWith("/images/fonds/") ? staticVariants(image) : undefined);
  return (
    <div aria-hidden="true" className={`absolute inset-0 -z-10 overflow-hidden ${className}`}>
      <ResponsiveImage
        src={image}
        variants={sources}
        priority={!lazy}
        className={`size-full object-cover ${zoom ? "animate-hero-zoom" : ""}`}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-night/95 via-night/75 to-night/30" />
      <div className="absolute inset-0 bg-gradient-to-t from-night/60 to-transparent" />
    </div>
  );
}

/** En-tête des pages intérieures, sur photo. */
export default function PageHero({
  eyebrow,
  title,
  description,
  breadcrumb,
  image = "/images/fonds/pages.jpg",
  imageVariants,
  children,
}) {
  return (
    <section className="relative isolate overflow-hidden bg-night text-ink">
      <PhotoBackground image={image} variants={imageVariants} zoom />
      <Container className="relative py-14 sm:py-20">
        {breadcrumb && <Breadcrumb items={breadcrumb} />}
        {eyebrow && (
          <Eyebrow dark className="animate-fade-up mt-8">
            {eyebrow}
          </Eyebrow>
        )}
        <h1
          style={{ "--delay": "100ms" }}
          className="animate-fade-up mt-4 max-w-3xl text-4xl leading-[1.08] font-bold tracking-[-0.03em] text-white sm:text-[44px]"
        >
          {title}
        </h1>
        {description && (
          <p
            style={{ "--delay": "200ms" }}
            className="animate-fade-up mt-5 max-w-2xl text-[17px] leading-relaxed text-ink-secondary sm:text-lg"
          >
            {description}
          </p>
        )}
        {children}
      </Container>
    </section>
  );
}
