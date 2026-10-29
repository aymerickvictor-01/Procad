import { ArrowRight, Layers } from "lucide-react";
import { Link } from "react-router";

import Logo from "./Logo";
import { useInView } from "./Reveal";

/**
 * Schéma de l'organisation : l'entreprise au centre, reliée à chacun de ses domaines,
 * comme sur le document « SERVICES » de PROCAD. Sur petit écran : arborescence verticale.
 */

// Position de chaque domaine sur une ellipse autour du centre (en % du cadre), en partant du haut.
function positions(count) {
  return Array.from({ length: count }, (_, index) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count;
    return { x: 50 + 38 * Math.cos(angle), y: 50 + 40 * Math.sin(angle) };
  });
}

function DomainCard({ category }) {
  return (
    <Link
      to={`/services?category=${category.slug}`}
      className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-2.5 pr-4 shadow-card transition-[border-color,box-shadow,translate] duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-card-hover"
    >
      <span className="size-14 shrink-0 overflow-hidden rounded-lg bg-night">
        {category.image ? (
          <img src={category.image} alt="" loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-110" />
        ) : (
          <Layers className="m-auto mt-4 size-6 text-ink-muted" aria-hidden="true" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] leading-snug font-semibold text-gray-900">{category.name}</span>
        <span className="mt-0.5 flex items-center gap-1 text-[13px] text-gray-500 group-hover:text-primary">
          {category.service_count} {category.service_count > 1 ? "services" : "service"}
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </span>
      </span>
    </Link>
  );
}

function Hub({ serviceCount, className = "" }) {
  return (
    <div className={`flex flex-col items-center justify-center bg-night text-center text-ink ${className}`}>
      <Logo framed to="/a-propos" imageClassName="h-10" />
      <p className="mt-3 text-[12px] font-semibold tracking-[0.12em] text-ink-tertiary uppercase">Pluridisciplinaire</p>
      {serviceCount > 0 && <p className="mt-1 text-sm text-ink-secondary">{serviceCount} services</p>}
    </div>
  );
}

export default function DomainsDiagram({ categories, serviceCount }) {
  const [ref, inView] = useInView();
  const points = positions(categories.length);
  const visible = inView ? "is-visible" : "";

  return (
    <div ref={ref} className={visible}>
      {/* Grand écran : schéma en étoile */}
      <div className="relative mx-auto hidden h-[640px] max-w-6xl lg:block">
        <svg aria-hidden="true" className="absolute inset-0 size-full">
          {points.map((point, index) => (
            <line
              key={categories[index].slug}
              x1="50%"
              y1="50%"
              x2={`${point.x}%`}
              y2={`${point.y}%`}
              pathLength="1"
              strokeWidth="1.5"
              className="draw-line stroke-primary/35"
              style={{ "--delay": `${150 + index * 90}ms` }}
            />
          ))}
        </svg>

        <div className={`reveal absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 ${visible}`}>
          <Hub serviceCount={serviceCount} className="size-60 rounded-full shadow-card-hover ring-[10px] ring-primary/10" />
        </div>

        {categories.map((category, index) => (
          <div
            key={category.slug}
            className={`reveal absolute z-10 w-[232px] -translate-x-1/2 -translate-y-1/2 ${visible}`}
            style={{ left: `${points[index].x}%`, top: `${points[index].y}%`, "--delay": `${500 + index * 90}ms` }}
          >
            <DomainCard category={category} />
          </div>
        ))}
      </div>

      {/* Petit écran : arborescence */}
      <div className="lg:hidden">
        <Hub serviceCount={serviceCount} className={`reveal rounded-xl px-6 py-8 ${visible}`} />
        <ul className="relative mt-4 space-y-3 pl-7 before:absolute before:top-0 before:bottom-9 before:left-3 before:w-px before:bg-primary/30">
          {categories.map((category, index) => (
            <li
              key={category.slug}
              className={`reveal relative before:absolute before:top-1/2 before:-left-4 before:h-px before:w-4 before:bg-primary/30 ${visible}`}
              style={{ "--delay": `${index * 70}ms` }}
            >
              <DomainCard category={category} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
