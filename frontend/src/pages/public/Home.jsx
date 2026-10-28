import { ArrowRight, Phone } from "lucide-react";

import { getCategories, getServices, getTestimonials } from "../../api/public";
import Button from "../../components/Button";
import ContactCard, { contactItems } from "../../components/ContactCard";
import Container from "../../components/Container";
import SectionHeader, { Eyebrow } from "../../components/SectionHeader";
import ServiceCard, { ServiceCardSkeleton } from "../../components/ServiceCard";
import { EmptyState, ErrorState } from "../../components/States";
import TestimonialCard, { Stars } from "../../components/TestimonialCard";
import { useCompany } from "../../context/CompanyContext";
import useApi from "../../hooks/useApi";

function averageRating(testimonials) {
  const rated = testimonials.filter((t) => t.rating);
  if (!rated.length) return null;
  return rated.reduce((sum, t) => sum + t.rating, 0) / rated.length;
}

const formatRating = (value) => value.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
const tel = (phone) => `tel:${phone.replace(/\s/g, "")}`;

/* --- Héros ------------------------------------------------------------------ */

/** Image principale droite + jusqu'à deux vignettes, avec un filet rouge PROCAD. */
function HeroVisual({ images }) {
  const [main, ...others] = images;
  return (
    <div className="relative" aria-hidden="true">
      <span className="absolute top-10 -left-3 hidden h-28 w-1.5 bg-accent lg:block" />
      <div className="aspect-[4/3] overflow-hidden rounded-xl border border-white/10 bg-night-elevated">
        <img src={main} alt="" className="size-full object-cover" />
      </div>
      {others.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-3">
          {others.slice(0, 2).map((image) => (
            <div key={image} className="aspect-[16/9] overflow-hidden rounded-lg border border-white/10 bg-night-elevated">
              <img src={image} alt="" className="size-full object-cover" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Hero({ company, domains, images, rating, ratingCount }) {
  const title = company.slogan || company.name;
  return (
    <section className="relative overflow-hidden bg-night text-ink">
      <div aria-hidden="true" className="bg-blueprint absolute inset-0 [mask-image:linear-gradient(to_bottom,black_40%,transparent)]" />

      <Container
        className={`relative grid items-center gap-12 py-16 sm:py-20 lg:py-24 ${images.length ? "lg:grid-cols-[1.1fr_1fr]" : ""}`}
      >
        <div className={images.length ? "" : "max-w-3xl"}>
          {domains.length > 0 && <Eyebrow dark>{domains.join(" · ")}</Eyebrow>}
          <h1 className="mt-5 text-4xl leading-[1.08] font-bold tracking-[-0.03em] text-white sm:text-5xl lg:text-[56px]">
            {title}
          </h1>
          {company.description && (
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-secondary">
              {company.description.length > 240 ? `${company.description.slice(0, 237)}…` : company.description}
            </p>
          )}

          <div className="mt-9 flex flex-wrap gap-3">
            <Button to="/services" size="lg">
              Découvrir nos services <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
            <Button to="/contact" variant="secondary" size="lg">
              Nous contacter
            </Button>
          </div>

          {rating && (
            <div className="mt-9 flex items-center gap-3 border-t border-white/10 pt-6 text-sm text-ink-tertiary">
              <Stars rating={Math.round(rating)} />
              <span>
                <strong className="font-semibold text-white">{formatRating(rating)}/5</strong> — {ratingCount} avis
                clients
              </span>
            </div>
          )}
        </div>

        {images.length > 0 && <HeroVisual images={images} />}
      </Container>
    </section>
  );
}

/* --- Chiffres clés (calculés à partir des données réelles) -------------------- */

function KeyFigures({ serviceCount, categoryCount, rating }) {
  const figures = [
    serviceCount > 0 && { value: serviceCount, label: serviceCount > 1 ? "services proposés" : "service proposé" },
    categoryCount > 0 && { value: categoryCount, label: categoryCount > 1 ? "domaines d'expertise" : "domaine d'expertise" },
    rating && { value: `${formatRating(rating)}/5`, label: "note moyenne de nos clients" },
  ].filter(Boolean);

  if (!figures.length) return null;
  // Classes écrites en entier : Tailwind ne détecte pas les noms construits dynamiquement.
  const columns = { 1: "sm:grid-cols-1", 2: "sm:grid-cols-2", 3: "sm:grid-cols-3" }[figures.length];
  return (
    <section className="border-t border-white/10 bg-night-elevated">
      <Container>
        <dl className={`grid divide-y divide-white/10 sm:divide-x sm:divide-y-0 ${columns}`}>
          {figures.map(({ value, label }) => (
            <div key={label} className="flex flex-col py-7 sm:px-8 sm:first:pl-0">
              <dt className="order-2 mt-1 text-sm text-ink-tertiary">{label}</dt>
              <dd className="order-1 font-display text-4xl font-bold tracking-[-0.02em] text-white">{value}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}

/* --- Services mis en avant ----------------------------------------------------- */

function FeaturedServices({ state }) {
  const { data, error, loading, reload } = state;

  return (
    <section className="py-20 sm:py-24">
      <Container>
        <SectionHeader
          eyebrow="Nos services"
          title="Nos domaines d'intervention"
          description="Une sélection de nos prestations. Retrouvez l'ensemble de notre offre sur la page Services."
          action={
            <Button to="/services" variant="outline">
              Voir tous les services <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          }
        />
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <ServiceCardSkeleton key={n} />
            ))}
          </div>
        ) : error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : data.results.length === 0 ? (
          <EmptyState
            title="Nos services arrivent bientôt"
            description="Notre catalogue est en cours de préparation."
            action={<Button to="/contact">Nous contacter</Button>}
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.results.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}

/* --- Présentation courte + coordonnées ------------------------------------------- */

function About({ company }) {
  if (!company.description && !contactItems(company).length) return null;
  return (
    <section className="bg-cream py-20 sm:py-24">
      <Container className="grid items-start gap-12 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <Eyebrow>À propos</Eyebrow>
          <h2 className="mt-3 text-3xl leading-tight font-bold tracking-[-0.02em] text-gray-900 sm:text-4xl">
            Qui sommes-nous ?
          </h2>
          {company.description && (
            <p className="mt-5 text-[17px] leading-relaxed whitespace-pre-line text-gray-700">{company.description}</p>
          )}
          <Button to="/a-propos" variant="outline" className="mt-8">
            En savoir plus sur {company.name} <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
        <ContactCard company={company} />
      </Container>
    </section>
  );
}

/* --- Témoignages ---------------------------------------------------------------- */

function Testimonials({ testimonials }) {
  if (!testimonials.length) return null;
  return (
    <section className="py-20 sm:py-24">
      <Container>
        <SectionHeader eyebrow="Témoignages" title="Ils nous font confiance" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.slice(0, 6).map((testimonial) => (
            <TestimonialCard key={testimonial.id} testimonial={testimonial} />
          ))}
        </div>
      </Container>
    </section>
  );
}

/* --- Appel à l'action final ---------------------------------------------------------- */

function FinalCta({ company }) {
  return (
    <section className="pb-20 sm:pb-24">
      <Container>
        <div className="relative overflow-hidden rounded-xl bg-night px-6 py-12 sm:px-12 sm:py-14">
          <div aria-hidden="true" className="bg-blueprint absolute inset-0" />
          <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1.5 bg-accent" />
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <Eyebrow dark>Contact</Eyebrow>
              <h2 className="mt-3 text-3xl leading-tight font-bold tracking-[-0.02em] text-white sm:text-4xl">
                Un projet ? Parlons-en.
              </h2>
              <p className="mt-4 text-[17px] leading-relaxed text-ink-secondary">
                Décrivez-nous votre besoin : l'équipe {company.name} vous répond dans les meilleurs délais.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <Button to="/contact" size="lg">
                Nous contacter <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
              {company.phone && (
                <Button href={tel(company.phone)} variant="secondary" size="lg">
                  <Phone className="size-4" aria-hidden="true" /> {company.phone}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* --- Page ---------------------------------------------------------------------------- */

export default function Home() {
  const { company } = useCompany();
  // Services mis en avant ; à défaut, les derniers services publiés.
  const featured = useApi(async () => {
    const highlighted = await getServices({ featured: true, page_size: 6 });
    return highlighted.results.length ? highlighted : getServices({ page_size: 6 });
  });
  const allServices = useApi(() => getServices({ page_size: 1 }));
  const categories = useApi(getCategories);
  const testimonials = useApi(() => getTestimonials({ page_size: 50 }));

  const testimonialList = testimonials.data?.results ?? [];
  const rating = averageRating(testimonialList);
  const ratingCount = testimonialList.filter((t) => t.rating).length;
  const activeCategories = (categories.data ?? []).filter((c) => c.service_count > 0);
  const heroImages = [company.hero_image, ...(featured.data?.results ?? []).map((s) => s.cover_image)].filter(Boolean);

  return (
    <>
      <title>{company.slogan ? `${company.name} — ${company.slogan}` : company.name}</title>
      {company.description && <meta name="description" content={company.description.slice(0, 160)} />}

      <Hero
        company={company}
        domains={activeCategories.slice(0, 4).map((c) => c.name)}
        images={heroImages.slice(0, 3)}
        rating={rating}
        ratingCount={ratingCount}
      />
      <KeyFigures serviceCount={allServices.data?.count ?? 0} categoryCount={activeCategories.length} rating={rating} />
      <FeaturedServices state={featured} />
      <About company={company} />
      <Testimonials testimonials={testimonialList} />
      <FinalCta company={company} />
    </>
  );
}
