import { ArrowRight, CheckCircle2, Layers, Phone } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router";

import { getService, getServices, getTestimonials } from "../../api/public";
import Button from "../../components/Button";
import Container from "../../components/Container";
import PageHero from "../../components/PageHero";
import SectionHeader from "../../components/SectionHeader";
import ServiceCard from "../../components/ServiceCard";
import { ErrorState, Skeleton } from "../../components/States";
import TestimonialCard from "../../components/TestimonialCard";
import { useCompany } from "../../context/CompanyContext";
import useApi from "../../hooks/useApi";
import NotFound from "./NotFound";

function Gallery({ service }) {
  const images = [
    service.cover_image && { id: "cover", image: service.cover_image, alt_text: service.title },
    ...service.images,
  ].filter(Boolean);
  const [selected, setSelected] = useState(0);
  const current = images[Math.min(selected, images.length - 1)];

  if (!current) {
    return (
      <div className="grid aspect-[16/10] place-items-center rounded-xl bg-night">
        <Layers className="size-14 text-ink-muted" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div>
      <div className="aspect-[16/10] overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
        <img src={current.image} alt={current.alt_text || service.title} className="size-full object-cover" />
      </div>
      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-5">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setSelected(index)}
              aria-label={`Afficher l'image ${index + 1}${image.alt_text ? ` : ${image.alt_text}` : ""}`}
              aria-current={index === selected ? "true" : undefined}
              className={`aspect-square overflow-hidden rounded-xl border-2 transition ${
                index === selected ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <img src={image.image} alt="" loading="lazy" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Texte saisi dans l'administration : paragraphes séparés par une ligne vide,
// lignes commençant par « - » ou « – » affichées en liste à puces.
const BULLET = /^\s*[-–•]\s+/;

function Description({ text }) {
  return text.split(/\n\s*\n/).map((block, index) => {
    const lines = block.split("\n").filter((line) => line.trim());
    const bullets = lines.filter((line) => BULLET.test(line));
    if (!bullets.length) {
      return (
        <p key={index} className="mt-4 whitespace-pre-line">
          {block.trim()}
        </p>
      );
    }
    const intro = lines.filter((line) => !BULLET.test(line)).join("\n");
    return (
      <div key={index} className="mt-4">
        {intro && <p className="font-semibold text-gray-900">{intro}</p>}
        <ul className="mt-3 space-y-2">
          {bullets.map((line) => (
            <li key={line} className="flex gap-3">
              <span className="mt-[0.7em] size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
              <span>{line.replace(BULLET, "").replace(/\s*[;.]$/, "")}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  });
}

function ContactPanel({ service, company }) {
  return (
    <aside className="rounded-xl border border-gray-200 bg-white p-6 shadow-card lg:sticky lg:top-28">
      {service.price_label && (
        <>
          <p className="text-[12px] font-semibold tracking-[0.08em] text-gray-500 uppercase">Prix indicatif</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-[-0.02em] text-gray-900">{service.price_label}</p>
        </>
      )}
      <p className={`text-[15px] leading-relaxed text-gray-600 ${service.price_label ? "mt-4" : ""}`}>
        Une question ou un devis ? Décrivez votre besoin, nous revenons vers vous.
      </p>
      <Button to={`/contact?service=${service.slug}`} className="mt-5 w-full">
        Demander des informations <ArrowRight className="size-4" aria-hidden="true" />
      </Button>
      {company.phone && (
        <Button href={`tel:${company.phone.replace(/\s/g, "")}`} variant="outline" className="mt-3 w-full">
          <Phone className="size-4" aria-hidden="true" /> {company.phone}
        </Button>
      )}
    </aside>
  );
}

function DetailSkeleton() {
  return (
    <Container className="grid gap-10 py-14 lg:grid-cols-[1fr_340px]" aria-hidden="true">
      <div className="space-y-4">
        <Skeleton className="aspect-[16/10] w-full rounded-xl" />
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </Container>
  );
}

export default function ServiceDetail() {
  const { slug } = useParams();
  const { company } = useCompany();
  const detail = useApi(() => getService(slug), [slug]);
  const testimonials = useApi(() => getTestimonials({ service: slug, page_size: 6 }), [slug]);
  const categorySlug = detail.data?.category?.slug;
  const similar = useApi(
    () => (categorySlug ? getServices({ category: categorySlug, page_size: 4 }) : Promise.resolve(null)),
    [categorySlug],
  );

  if (detail.error?.response?.status === 404) {
    return <NotFound title="Service introuvable" message="Ce service n'existe pas ou n'est plus proposé." />;
  }

  const service = detail.data;
  const breadcrumb = [
    { to: "/", label: "Accueil" },
    { to: "/services", label: "Services" },
    { label: service?.title ?? "…" },
  ];
  const others = (similar.data?.results ?? []).filter((s) => s.slug !== slug).slice(0, 3);

  return (
    <>
      {service && (
        <>
          <title>{`${service.title} — ${company.name}`}</title>
          <meta name="description" content={service.short_description} />
        </>
      )}

      <PageHero
        eyebrow={service?.category?.name}
        title={service?.title ?? "Chargement…"}
        description={service?.short_description}
        breadcrumb={breadcrumb}
      />

      {detail.loading ? (
        <DetailSkeleton />
      ) : detail.error ? (
        <Container className="py-14">
          <ErrorState error={detail.error} onRetry={detail.reload} />
        </Container>
      ) : (
        <>
          <section className="py-12 sm:py-16">
            <Container className="grid items-start gap-10 lg:grid-cols-[1fr_340px] lg:gap-12">
              <div className="min-w-0">
                <Gallery key={service.slug} service={service} />

                <div className="mt-10">
                  <h2 className="text-2xl font-bold tracking-[-0.02em] text-gray-900">Présentation</h2>
                  <div className="text-[17px] leading-relaxed text-gray-700">
                    <Description text={service.description} />
                  </div>
                </div>

                {service.features.length > 0 && (
                  <div className="mt-10 rounded-xl border border-gray-200 bg-gray-50 p-6 sm:p-8">
                    <h2 className="text-xl font-bold tracking-[-0.01em] text-gray-900">Points forts</h2>
                    <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                      {service.features.map((feature) => (
                        <li key={feature} className="flex gap-3 text-[15px] text-gray-700">
                          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <ContactPanel service={service} company={company} />
            </Container>
          </section>

          {testimonials.data?.results.length > 0 && (
            <section className="bg-cream py-16 sm:py-20">
              <Container>
                <SectionHeader eyebrow="Témoignages" title="Ce qu'en disent nos clients" />
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {testimonials.data.results.map((testimonial) => (
                    <TestimonialCard key={testimonial.id} testimonial={testimonial} />
                  ))}
                </div>
              </Container>
            </section>
          )}

          {others.length > 0 && (
            <section className="py-16 sm:py-20">
              <Container>
                <SectionHeader
                  eyebrow={service.category.name}
                  title="Services similaires"
                  action={
                    <Button to={`/services?category=${service.category.slug}`} variant="outline">
                      Toute la catégorie <ArrowRight className="size-4" aria-hidden="true" />
                    </Button>
                  }
                />
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {others.map((other) => (
                    <ServiceCard key={other.id} service={other} />
                  ))}
                </div>
              </Container>
            </section>
          )}
        </>
      )}
    </>
  );
}
