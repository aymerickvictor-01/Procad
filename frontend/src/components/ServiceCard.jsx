import { ArrowRight, Layers } from "lucide-react";
import { Link } from "react-router";

import { Skeleton } from "./States";

export default function ServiceCard({ service }) {
  return (
    <Link
      to={`/services/${service.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-card transition-all duration-500 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-card-hover"
    >
      <div className="aspect-[16/10] overflow-hidden bg-gray-100">
        {service.cover_image ? (
          <img
            src={service.cover_image}
            alt=""
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="grid size-full place-items-center bg-linear-to-br from-night to-night-subtle">
            <Layers className="size-10 text-primary-soft/60" aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        {service.category && (
          <span className="text-[12px] font-semibold tracking-[0.08em] text-primary uppercase">
            {service.category.name}
          </span>
        )}
        <h3 className="mt-2 text-[19px] leading-snug font-semibold tracking-[-0.01em] text-gray-900">
          {service.title}
        </h3>
        <p className="mt-2 line-clamp-3 text-[15px] leading-relaxed text-gray-600">{service.short_description}</p>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
          <span className="text-sm font-semibold text-gray-900">{service.price_label}</span>
          <span className="flex items-center gap-1 text-sm font-semibold text-primary transition-all group-hover:gap-2">
            Découvrir <ArrowRight className="size-4" aria-hidden="true" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export function ServiceCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white" aria-hidden="true">
      <Skeleton className="aspect-[16/10] rounded-none" />
      <div className="space-y-3 p-6">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  );
}
