import { ArrowRight, Phone } from "lucide-react";

import { getCategories, getServices, getTestimonials } from "../../api/public";
import Button from "../../components/Button";
import ContactCard, { contactItems } from "../../components/ContactCard";
import Container from "../../components/Container";
import DomainsDiagram from "../../components/DomainsDiagram";
import { PhotoBackground } from "../../components/PageHero";
import ResponsiveImage, { staticVariants } from "../../components/ResponsiveImage";
import Reveal, { CountUp, useInView } from "../../components/Reveal";
import SectionHeader, { Eyebrow } from "../../components/SectionHeader";
import ServiceCard, { ServiceCardSkeleton } from "../../components/ServiceCard";
import { EmptyState, ErrorState } from "../../components/States";
import TestimonialCard from "../../components/TestimonialCard";
import WhatsAppIcon from "../../components/WhatsAppIcon";
import { STEPS } from "../../content/method";
import { useCompany } from "../../context/CompanyContext";
import { whatsappMessage, whatsappUrl } from "../../lib/whatsapp";
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
      <PhotoBackground
        image={company.hero_image || DEFAULT_HERO}
        variants={company.hero_image ? company.hero_image_variants : undefined}
        zoom
      />
      <Container className="relative flex min-h-[560px] flex-col justify-center pt-16 pb-32 sm:min-h-[620px] sm:pt-20 sm:pb-36">
        <div className="max-w-2xl">
          <Eyebrow dark className="animate-fade-up">
            Entreprise pluridisciplinaire
          </Eyebrow>
          <h1 style={{ "--delay": "120ms" }} className="animate-fade-up mt-5 text-4xl leading-[1.05] font-bold tracking-[-0.03em] text-white sm:text-5xl lg:text-[60px]">
            {title}
          </h1>
          <p style={{ "--delay": "240ms" }} className="animate-fade-up mt-6 max-w-xl text-lg leading-relaxed text-ink-secondary">
            {pitch}
          </p>
          <div style={{ "--delay": "360ms" }} className="animate-fade-up mt-9 flex flex-wrap gap-3">
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
        <div
          style={{ "--delay": "480ms" }}
          className="animate-fade-up grid overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card-hover md:grid-cols-[1fr_auto]"
        >
          <dl className="grid grid-cols-2 divide-x divide-gray-200 sm:flex">
            {figures.map(({ value, label }) => (
              <div key={label} className="flex flex-col px-6 py-6 sm:flex-1 sm:px-9 sm:py-7">
                <dt className="order-2 mt-1 text-sm text-gray-500">{label}</dt>
                <dd className="order-1 font-display text-4xl font-bold tracking-[-0.02em] text-primary">
                  {typeof value === "number" ? <CountUp value={value} /> : value}
                </dd>
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

/* --- Organisation : schéma de l'entreprise et de ses domaines ----------------------- */

function Organisation({ categories, serviceCount }) {
  if (!categories.length) return null;
  return (
    <section className="overflow-hidden py-20 sm:py-24">
      <Container>
        <SectionHeader
          center
          eyebrow="Notre organisation"
          title={`Une entreprise, ${categories.length} domaines d'expertise`}
          description="Des études à la communication, nos équipes couvrent tous les métiers de vos projets. Choisissez un domaine pour découvrir ses services."
        />
        <DomainsDiagram categories={categories} serviceCount={serviceCount} />
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
            {data.results.map((service, index) => (
              <Reveal key={service.id} delay={(index % 3) * 100} className="flex *:w-full">
                <ServiceCard service={service} />
              </Reveal>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}

/* --- Méthode de travail ----------------------------------------------------------- */


function Method() {
  const [ref, inView] = useInView();
  return (
    <section className="py-20 sm:py-24">
      <Container className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <Reveal className="relative aspect-[4/3] overflow-hidden rounded-xl bg-gray-100">
          <ResponsiveImage
            src="/images/fonds/a-propos.jpg"
            variants={staticVariants("/images/fonds/a-propos.jpg")}
            sizes="(min-width: 1024px) 50vw, 100vw"
            alt="Ingénieurs échangeant sur un chantier"
            className="size-full object-cover"
          />
        </Reveal>
        <div>
          <Eyebrow>Notre méthode</Eyebrow>
          <h2 className="mt-3 text-3xl leading-tight font-bold tracking-[-0.02em] text-gray-900 sm:text-4xl">
            Un interlocuteur, du premier rendez-vous à la réception
          </h2>
          <ol ref={ref} className="relative mt-9 space-y-7">
            {/* Frise : trait gris, rempli de bleu à l'apparition */}
            <span aria-hidden="true" className="absolute top-3 bottom-3 left-[21px] w-0.5 bg-gray-200" />
            <span
              aria-hidden="true"
              className={`absolute top-3 bottom-3 left-[21px] w-0.5 origin-top bg-primary transition-transform duration-[1600ms] ease-out ${
                inView ? "scale-y-100" : "scale-y-0"
              }`}
            />
            {STEPS.map(([title, text], index) => (
              <li
                key={title}
                style={{ "--delay": `${index * 250}ms` }}
                className={`reveal relative flex gap-5 ${inView ? "is-visible" : ""}`}
              >
                <span className="relative grid size-11 shrink-0 place-items-center rounded-full bg-primary font-display text-lg font-bold text-white ring-4 ring-white">
                  {index + 1}
                </span>
                <div className="pt-1.5">
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
          {testimonials.slice(0, 6).map((testimonial, index) => (
            <Reveal key={testimonial.id} delay={(index % 3) * 100}>
              <TestimonialCard testimonial={testimonial} />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* --- Appel à l'action final ---------------------------------------------------------- */

function FinalCta({ company }) {
  const whatsapp = whatsappUrl(company.whatsapp, whatsappMessage(company.name));
  return (
    <section className="py-20 sm:py-24">
      <Container>
        <Reveal className="relative isolate overflow-hidden rounded-xl bg-night px-6 py-14 sm:px-12 sm:py-16">
          <PhotoBackground image="/images/fonds/projet.jpg" lazy />
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
              {whatsapp && (
                <Button href={whatsapp} target="_blank" rel="noopener noreferrer" variant="secondary" size="lg">
                  <WhatsAppIcon className="size-5" /> WhatsApp
                </Button>
              )}
              {company.phone && (
                <Button href={tel(company.phone)} variant="secondary" size="lg">
                  <Phone className="size-4" aria-hidden="true" /> {company.phone}
                </Button>
              )}
            </div>
          </div>
        </Reveal>
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
      <Organisation categories={activeCategories} serviceCount={allServices.data?.count ?? 0} />
      <FeaturedServices state={featured} />
      <Method />
      <About company={company} />
      <Testimonials testimonials={testimonialList} />
      <FinalCta company={company} />
    </>
  );
}
