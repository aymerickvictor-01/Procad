import { ArrowRight } from "lucide-react";
import { Link } from "react-router";

import Reveal from "./Reveal";

/** Tuile photo d'un domaine, menant à la liste de ses services. */
function DomainTile({ category, large = false }) {
  return (
    <Link
      to={`/services?category=${category.slug}`}
      className={`group relative isolate flex h-full min-h-[190px] flex-col justify-end overflow-hidden rounded-xl bg-night p-4 text-white sm:min-h-[240px] sm:p-6 lg:min-h-[280px] ${
        large ? "sm:p-8" : ""
      }`}
    >
      {category.image && (
        <img
          src={category.image}
          alt=""
          loading="lazy"
          className="absolute inset-0 -z-10 size-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      )}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-night via-night/60 to-night/5" />
      <h3 className={`font-bold tracking-[-0.01em] ${large ? "text-2xl sm:text-[28px]" : "text-[15px] leading-snug sm:text-lg"}`}>
        {category.name}
      </h3>
      {large && category.description && (
        <p className="mt-2 max-w-md text-[15px] leading-relaxed text-ink-secondary">{category.description}</p>
      )}
      <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-tertiary group-hover:text-white">
        {category.service_count} {category.service_count > 1 ? "services" : "service"}
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
      </p>
    </Link>
  );
}

/** Domaines en tuiles photo : une grande tuile puis les autres (2 rangées pleines pour 7 domaines). */
export default function DomainGrid({ categories }) {
  if (!categories.length) return null;
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {categories.map((category, index) => (
        <Reveal key={category.slug} delay={(index % 4) * 80} className={index === 0 ? "col-span-2" : ""}>
          <DomainTile category={category} large={index === 0} />
        </Reveal>
      ))}
    </div>
  );
}
