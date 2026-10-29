import { ArrowRight, Phone } from "lucide-react";
import { Link } from "react-router";

import { getCategories, getServices, getTestimonials } from "../../api/public";
import Button from "../../components/Button";
import ContactCard, { contactItems } from "../../components/ContactCard";
import Container from "../../components/Container";
import { PhotoBackground } from "../../components/PageHero";
import SectionHeader, { Eyebrow } from "../../components/SectionHeader";
import ServiceCard, { ServiceCardSkeleton } from "../../components/ServiceCard";
import { EmptyState, ErrorState } from "../../components/States";
import TestimonialCard from "../../components/TestimonialCard";
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

const DEFAULT_HERO = "/images/fonds/accueil.jpg";
const DEFAULT_PITCH =
  "Études, construction, finitions, installations techniques, métallerie, sécurité et communication : " +
  "un seul partenaire pour mener vos projets de bout en bout.";

function Hero({ company }) {
  const title = company.slogan || company.name;
  const pitch = company.description
    ? company.description.length > 220
      ? `${company.description.slice(0, 217)}…`
      : company.description
    : DEFAULT_PITCH;

  return (
    <section className="relative isolate overflow-hidden bg-night text-ink">
      <PhotoBackground image={company.hero_image || DEFAULT_HERO} />
      <Container className="relative flex min-h-[560px] flex-col justify-center pt-16 pb-32 sm:min-h-[620px] sm:pt-20 sm:pb-36">
        <div className="max-w-2xl">
          <Eyebrow dark>Entreprise pluridisciplinaire</Eyebrow>
          <h1 className="mt-5 text-4xl leading-[1.05] font-bold tracking-[-0.03em] text-white sm:text-5xl lg:text-[60px]">
            {title}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-secondary">{pitch}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button to="/services" size="lg">
              Découvrir nos services <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
            <Button to="/contact" variant="secondary" size="lg">
              Demander un devis
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* --- Chiffres clés : carte posée à cheval sur le héros ------------------------- */

function KeyFigures({ serviceCount, categoryCount, rating, ratingCount }) {
  const figures = [
    serviceCount > 0 && { value: serviceCount, label: serviceCount > 1 ? "services proposés" : "service proposé" },
    categoryCount > 0 && { value: categoryCount, label: categoryCount > 1 ? "domaines d'expertise" : "domaine d'expertise" },
    rating && { value: `${formatRating(rating)}/5`, label: `note moyenne (${ratingCount} avis)` },
  ].filter(Boolean);

  if (!figures.length) return null;
  return (
    <section className="relative z-10 -mt-20">
      <Container>
        <div className="grid overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card-hover md:grid-cols-[1fr_auto]">
          <dl className="grid grid-cols-2 divide-x divide-gray-200 sm:flex">
            {figures.map(({ value, label }) => (
              <div key={label} className="flex flex-col px-6 py-6 sm:flex-1 sm:px-9 sm:py-7">
                <dt className="order-2 mt-1 text-sm text-gray-500">{label}</dt>
                <dd className="order-1 font-display text-4xl font-bold tracking-[-0.02em] text-primary">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="flex items-center justify-between gap-6 border-t border-gray-200 bg-cream px-6 py-5 md:border-t-0 md:border-l md:px-9">
            <p className="max-w-[16rem] text-[15px] leading-snug text-gray-700">
              Un besoin précis ? Décrivez votre projet, nous vous répondons rapidement.
            </p>
            <Button to="/contact" className="shrink-0">
              Nous écrire <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* --- Domaines d'expertise : tuiles photo ---------------------------------------- */

function DomainTile({ category, large = false }) {
  return (
    <Link
      to={`/services?category=${category.slug}`}
      className={`group relative isolate flex min-h-[190px] flex-col justify-end overflow-hidden rounded-xl bg-night p-4 text-white sm:min-h-[240px] sm:p-6 lg:min-h-[280px] ${
        large ? "col-span-2 sm:p-8" : ""
      }`}
    >
      {category.image && (
        <img
          src={category.image}
          alt=""
          loading="lazy"
          className="absolute inset-0 -z-10 size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      )}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-night via-night/60 to-night/5" />
      <span aria-hidden="true" className="mb-3 h-1 w-8 bg-accent transition-all duration-300 group-hover:w-16 sm:mb-4 sm:w-10" />
      <h3 className={`font-bold tracking-[-0.01em] ${large ? "text-2xl sm:text-[28px]" : "text-[15px] leading-snug sm:text-lg"}`}>{category.name}</h3>
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

function Domains({ categories }) {
  if (!categories.length) return null;
  const [first, ...others] = categories;
  return (
    <section className="py-20 sm:py-24">
      <Container>
        <SectionHeader
          eyebrow="Nos domaines d'expertise"
          title="Du plan à la remise des clés"
          description="Nos équipes couvrent l'ensemble des corps de métier du bâtiment, de l'industrie et de la communication."
        />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <DomainTile category={first} large />
          {others.map((category) => (
            <DomainTile key={category.slug} category={category} />
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
    <section className="bg-cream py-20 sm:py-24">
      <Container>
        <SectionHeader
          eyebrow="Services phares"
          title="Nos prestations les plus demandées"
          description="Une sélection de notre offre. Retrouvez tous nos services, classés par domaine, sur la page Services."
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

/* --- Méthode de travail ----------------------------------------------------------- */

const STEPS = [
  ["Écoute et visite", "Nous analysons votre besoin et, si nécessaire, nous nous déplaçons sur le site."],
  ["Étude et devis", "Vous recevez une proposition technique et un devis détaillé, poste par poste."],
  ["Réalisation", "Nos équipes interviennent, coordonnées par un responsable unique."],
  ["Réception et suivi", "Nous vérifions l'ouvrage avec vous et restons disponibles après la livraison."],
];

function Method() {
  return (
    <section className="py-20 sm:py-24">
      <Container className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="relative">
          <span aria-hidden="true" className="absolute -top-3 -left-3 hidden h-32 w-32 border-t-4 border-l-4 border-accent lg:block" />
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-gray-100">
            <img
              src="/images/fonds/a-propos.jpg"
              alt="Ingénieurs échangeant sur un chantier"
              loading="lazy"
              className="size-full object-cover"
            />
          </div>
        </div>
        <div>
          <Eyebrow>Notre méthode</Eyebrow>
          <h2 className="mt-3 text-3xl leading-tight font-bold tracking-[-0.02em] text-gray-900 sm:text-4xl">
            Un interlocuteur, du premier rendez-vous à la réception
          </h2>
          <ol className="mt-8 space-y-6">
            {STEPS.map(([title, text], index) => (
              <li key={title} className="flex gap-5">
                <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary font-display text-lg font-bold text-white">
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                  <p className="mt-1 text-[15px] leading-relaxed text-gray-600">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
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
    <section className="py-20 sm:py-24">
      <Container>
        <div className="relative isolate overflow-hidden rounded-xl bg-night px-6 py-14 sm:px-12 sm:py-16">
          <PhotoBackground image="/images/fonds/projet.jpg" />
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

  return (
    <>
      <title>{company.slogan ? `${company.name} — ${company.slogan}` : company.name}</title>
      <meta name="description" content={(company.description || DEFAULT_PITCH).slice(0, 160)} />

      <Hero company={company} />
      <KeyFigures
        serviceCount={allServices.data?.count ?? 0}
        categoryCount={activeCategories.length}
        rating={rating}
        ratingCount={ratingCount}
      />
      <Domains categories={activeCategories} />
      <FeaturedServices state={featured} />
      <Method />
      <About company={company} />
      <Testimonials testimonials={testimonialList} />
      <FinalCta company={company} />
    </>
  );
}
