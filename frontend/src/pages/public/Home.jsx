import { ArrowRight, Layers, MessageSquare, Phone, Sparkles, Star } from "lucide-react";

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

/* --- Héros ------------------------------------------------------------------ */

/** Collage d'images inclinées : image de bannière + couvertures des services mis en avant. */
function HeroCollage({ heroImage, covers }) {
  const [main, ...others] = [heroImage, ...covers].filter(Boolean);

  if (!main) {
    return (
      <div className="relative hidden aspect-[4/3.4] lg:block" aria-hidden="true">
        <div className="glass absolute inset-8 rounded-[28px]" />
        <div className="glass absolute top-0 right-6 grid size-28 rotate-[6deg] place-items-center rounded-2xl">
          <Layers className="size-10 text-primary-soft" />
        </div>
        <div className="glass absolute bottom-2 left-0 grid size-24 -rotate-[5deg] place-items-center rounded-2xl">
          <Sparkles className="size-9 text-primary-soft" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto w-full max-w-[540px] lg:mr-0" aria-hidden="true">
      <div className="absolute -inset-6 rounded-[40px] bg-primary/20 blur-3xl" />
      <div className="relative aspect-[4/3] overflow-hidden rounded-[28px] border border-white/10 shadow-2xl">
        <img src={main} alt="" className="size-full object-cover" />
        <div className="absolute inset-0 bg-linear-to-t from-night/40 to-transparent" />
      </div>
      {others[0] && (
        <div className="absolute -bottom-8 -left-6 hidden h-[130px] w-[150px] -rotate-[4deg] overflow-hidden rounded-2xl border-4 border-night shadow-lg sm:block">
          <img src={others[0]} alt="" className="size-full object-cover" />
        </div>
      )}
      {others[1] && (
        <div className="absolute -top-6 -right-4 hidden h-[110px] w-[120px] rotate-[3deg] overflow-hidden rounded-2xl border-4 border-night shadow-lg sm:block">
          <img src={others[1]} alt="" className="size-full object-cover" />
        </div>
      )}
    </div>
  );
}

function Hero({ company, featured, rating, ratingCount }) {
  const covers = (featured ?? []).map((service) => service.cover_image).filter(Boolean);

  return (
    <section className="relative overflow-hidden bg-night text-ink">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="bg-dots absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
        <div className="absolute -top-48 left-1/2 h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-primary/25 blur-[130px]" />
        <div className="absolute right-0 bottom-0 h-[320px] w-[420px] rounded-full bg-primary-light/10 blur-[110px]" />
      </div>

      <Container className="relative grid items-center gap-14 py-20 sm:py-24 lg:grid-cols-[1.05fr_1fr] lg:py-28">
        <div>
          <Eyebrow dark>
            <Sparkles className="size-3.5" aria-hidden="true" /> Bienvenue chez {company.name}
          </Eyebrow>
          <h1 className="mt-6 text-5xl leading-[1.02] font-bold tracking-[-0.035em] text-white sm:text-6xl lg:text-7xl">
            <span className="text-gradient">{company.name}</span>
          </h1>
          {company.slogan && (
            <p className="mt-6 max-w-xl text-xl leading-relaxed font-medium text-ink-secondary sm:text-2xl">
              {company.slogan}
            </p>
          )}

          <div className="mt-10 flex flex-wrap gap-3">
            <Button to="/services" size="lg">
              Découvrir nos services <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
            <Button to="/contact" variant="secondary" size="lg">
              Nous contacter
            </Button>
          </div>

          {rating && (
            <div className="mt-10 flex items-center gap-3 text-sm text-ink-tertiary">
              <Stars rating={Math.round(rating)} />
              <span>
                <strong className="font-semibold text-white">{formatRating(rating)}/5</strong> · {ratingCount} avis
                clients
              </span>
            </div>
          )}
        </div>

        <HeroCollage heroImage={company.hero_image} covers={covers} />
      </Container>
    </section>
  );
}

/* --- Chiffres clés (calculés à partir des données réelles) -------------------- */

function KeyFigures({ serviceCount, categoryCount, rating }) {
  const figures = [
    serviceCount > 0 && { value: serviceCount, label: serviceCount > 1 ? "services proposés" : "service proposé", icon: Layers },
    categoryCount > 0 && {
      value: categoryCount,
      label: categoryCount > 1 ? "domaines d'expertise" : "domaine d'expertise",
      icon: Sparkles,
    },
    rating && { value: `${formatRating(rating)}/5`, label: "note moyenne de nos clients", icon: Star },
  ].filter(Boolean);

  if (!figures.length) return null;
  // Classes écrites en entier : Tailwind ne détecte pas les noms construits dynamiquement.
  const columns = { 1: "sm:grid-cols-1", 2: "sm:grid-cols-2", 3: "sm:grid-cols-3" }[figures.length];
  return (
    <section className="bg-night pb-16 sm:pb-20">
      <Container>
        <div className={`grid gap-4 ${columns}`}>
          {figures.map(({ value, label, icon: Icon }) => (
            <div key={label} className="glass flex items-center gap-4 rounded-2xl p-5 sm:p-6">
              <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/20 text-primary-soft">
                <Icon className="size-6" aria-hidden="true" />
              </span>
              <div>
                <p className="font-display text-3xl font-bold tracking-[-0.02em] text-white">{value}</p>
                <p className="text-sm text-ink-tertiary">{label}</p>
              </div>
            </div>
          ))}
        </div>
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
          title="Des solutions adaptées à vos besoins"
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
          <h2 className="mt-4 text-3xl leading-tight font-bold tracking-[-0.02em] text-gray-900 sm:text-4xl">
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
        <SectionHeader eyebrow="Témoignages" title="Ils nous font confiance" center />
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
        <div className="relative overflow-hidden rounded-[28px] bg-night px-6 py-14 text-center sm:px-12 sm:py-20">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="bg-dots absolute inset-0 opacity-60" />
            <div className="absolute -bottom-32 left-1/2 h-[360px] w-[720px] -translate-x-1/2 rounded-full bg-primary/30 blur-[110px]" />
          </div>
          <div className="relative mx-auto max-w-2xl">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-linear-to-br from-primary to-primary-soft text-white shadow-glow">
              <MessageSquare className="size-6" aria-hidden="true" />
            </span>
            <h2 className="mt-6 text-3xl leading-tight font-bold tracking-[-0.02em] text-white sm:text-5xl">
              Un projet ? <span className="text-gradient">Parlons-en.</span>
            </h2>
            <p className="mt-5 text-[17px] leading-relaxed text-ink-secondary">
              Décrivez-nous votre besoin : l'équipe {company.name} vous répond dans les meilleurs délais.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Button to="/contact" size="lg">
                Nous contacter <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
              {company.phone && (
                <Button href={`tel:${company.phone.replace(/\s/g, "")}`} variant="secondary" size="lg">
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

  return (
    <>
      <title>{company.slogan ? `${company.name} — ${company.slogan}` : company.name}</title>
      {company.description && <meta name="description" content={company.description.slice(0, 160)} />}

      <Hero company={company} featured={featured.data?.results} rating={rating} ratingCount={ratingCount} />
      <KeyFigures
        serviceCount={allServices.data?.count ?? 0}
        categoryCount={(categories.data ?? []).filter((c) => c.service_count > 0).length}
        rating={rating}
      />
      <FeaturedServices state={featured} />
      <About company={company} />
      <Testimonials testimonials={testimonialList} />
      <FinalCta company={company} />
    </>
  );
}
