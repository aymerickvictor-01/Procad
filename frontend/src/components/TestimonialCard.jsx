import { Star } from "lucide-react";

import ResponsiveImage from "./ResponsiveImage";

export function Stars({ rating, className = "" }) {
  if (!rating) return null;
  return (
    <div className={`flex gap-0.5 ${className}`} role="img" aria-label={`Note : ${rating} sur 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          aria-hidden="true"
          className={`size-4 ${n <= rating ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}`}
        />
      ))}
    </div>
  );
}

function initials(name) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export default function TestimonialCard({ testimonial }) {
  return (
    <figure className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-card sm:p-7">
      <Stars rating={testimonial.rating} />
      <blockquote className="mt-4 flex-1 text-[16px] leading-relaxed text-gray-700">
        « {testimonial.content} »
      </blockquote>
      <figcaption className="mt-6 flex items-center gap-3 border-t border-gray-100 pt-5">
        {testimonial.photo ? (
          <ResponsiveImage
            src={testimonial.photo}
            variants={testimonial.photo_variants}
            sizes="44px"
            className="size-11 rounded-full object-cover"
          />
        ) : (
          <span
            aria-hidden="true"
            className="grid size-11 place-items-center rounded-full bg-primary text-sm font-bold text-white"
          >
            {initials(testimonial.author_name)}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate font-semibold text-gray-900">{testimonial.author_name}</p>
          {testimonial.author_role && <p className="truncate text-sm text-gray-500">{testimonial.author_role}</p>}
        </div>
      </figcaption>
    </figure>
  );
}
