import { ArrowRight, BadgeCheck, ClipboardList, Handshake, Layers, MapPin, Phone, UserCheck } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router";

import { getService, getServices, getTestimonials } from "../../api/public";
import Button from "../../components/Button";
import Container from "../../components/Container";
import PageHero from "../../components/PageHero";
import ResponsiveImage from "../../components/ResponsiveImage";
import Reveal from "../../components/Reveal";
import SectionHeader, { Eyebrow } from "../../components/SectionHeader";
import ServiceCard from "../../components/ServiceCard";
import { ErrorState, Skeleton } from "../../components/States";
import TestimonialCard from "../../components/TestimonialCard";
import WhatsAppIcon from "../../components/WhatsAppIcon";
import { STEPS } from "../../content/method";
import { useCompany } from "../../context/CompanyContext";
import { useWhatsAppTopic } from "../../context/WhatsAppContext";
import useApi from "../../hooks/useApi";
import { whatsappMessage, whatsappUrl } from "../../lib/whatsapp";
import NotFound from "./NotFound";

/* --- Galerie ------------------------------------------------------------------ */

function Gallery({ service }) {
  const images = [
    service.cover_image && {
      id: "cover",
      image: service.cover_image,
      variants: service.cover_image_variants,
      alt_text: service.title,
    },
    ...service.images.map((image) => ({ ...image, variants: image.image_variants })),
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
        <ResponsiveImage
          key={current.id}
          src={current.image}
          variants={current.variants}
          sizes="(min-width: 1024px) 760px, 100vw"
          priority={selected === 0}
          alt={current.alt_text || service.title}
          className="animate-fade-up size-full object-cover"
        />
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
              <ResponsiveImage src={image.image} variants={image.variants} sizes="120px" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* --- Description structurée ------------------------------------------------------ */

// Texte saisi dans l'administration : paragraphes séparés par une ligne vide ; les lignes
// commençant par « - » ou « – » forment la liste des prestations (« titre : détail » possible).
// Mise en page : 1er paragraphe en introduction, prestations en cartes, paragraphes suivants
// en encadré « Notre engagement ».
const BULLET = /^\s*[-–•]\s+/;
const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

function parseDescription(text) {
  return text
    .split(/\n\s*\n/)
    .map((block) => block.split("\n").map((line) => line.trim()).filter(Boolean))
    .filter((lines) => lines.length)
    .map((lines) => {
      const items = lines.filter((line) => BULLET.test(line));
      if (!items.length) return { type: "text", text: lines.join("\n") };
      return {
        type: "list",
        title: lines.filter((line) => !BULLET.test(line)).join(" ").replace(/\s*:\s*$/, ""),
        items: items.map((line) => {
          const clean = line.replace(BULLET, "").replace(/\s*[;.]$/, "");
          const split = clean.indexOf(" : ");
          return split > 0
            ? { label: capitalize(clean.slice(0, split)), detail: capitalize(clean.slice(split + 3)) }
            : { label: capitalize(clean), detail: "" };
        }),
      };
    });
}

function Prestations({ title, items }) {
  return (
    <div className="mt-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-2xl font-bold tracking-[-0.02em] text-gray-900">{title || "Nos prestations"}</h2>
        <span className="text-sm text-gray-500">
          {items.length} prestation{items.length > 1 ? "s" : ""}
        </span>
      </div>
      <ol className="mt-6 grid gap-3 sm:grid-cols-2">
        {items.map((item, index) => (
          <Reveal
            as="li"
            key={item.label}
            delay={(index % 2) * 80}
            className="group flex gap-4 rounded-xl border border-gray-200 bg-white p-4 transition-[border-color,box-shadow] duration-300 hover:border-primary/30 hover:shadow-card-hover sm:p-5"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/8 font-display text-sm font-bold text-primary transition-colors group-hover:bg-primary group-hover:text-white">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="min-w-0 pt-0.5">
              <span className="block text-[15px] leading-snug font-semibold text-gray-900">{item.label}</span>
              {item.detail && <span className="mt-1 block text-[14px] leading-relaxed text-gray-600">{item.detail}</span>}
            </span>
          </Reveal>
        ))}
      </ol>
    </div>
  );
}

function Description({ text }) {
  const blocks = parseDescription(text);
  const firstList = blocks.findIndex((block) => block.type === "list");
  const before = firstList === -1 ? blocks : blocks.slice(0, firstList);
  const after = firstList === -1 ? [] : blocks.slice(firstList).filter((block) => block.type === "text");
  const lists = blocks.filter((block) => block.type === "list");
  const [lead, ...paragraphs] = before;

  return (
    <>
      <Eyebrow>Présentation</Eyebrow>
      {lead && (
        <p className="mt-4 text-xl leading-relaxed whitespace-pre-line text-gray-800 sm:text-[22px] sm:leading-[1.6]">
          {lead.text}
        </p>
      )}
      {paragraphs.map((block) => (
        <p key={block.text} className="mt-5 text-[17px] leading-relaxed whitespace-pre-line text-gray-700">
          {block.text}
        </p>
      ))}

      {lists.map((list) => (
        <Prestations key={list.title + list.items.length} title={list.title} items={list.items} />
      ))}

      {after.length > 0 && (
        <Reveal className="mt-10 flex gap-5 rounded-xl border border-primary/15 bg-primary/5 p-6 sm:p-7">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary text-white">
            <Handshake className="size-6" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Notre engagement</h3>
            {after.map((block) => (
              <p key={block.text} className="mt-1.5 text-[16px] leading-relaxed whitespace-pre-line text-gray-700">
                {block.text}
              </p>
            ))}
          </div>
        </Reveal>
      )}
    </>
  );
}

/* --- Points forts ------------------------------------------------------------------ */

function Features({ features }) {
  if (!features.length) return null;
  return (
    <Reveal className="mt-12 rounded-xl bg-night p-6 text-ink sm:p-8">
      <h2 className="text-2xl font-bold tracking-[-0.02em] text-white">Points forts</h2>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {features.map((feature) => (
          <li key={feature} className="flex items-center gap-4 rounded-lg bg-white/5 p-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary text-white">
              <BadgeCheck className="size-5" aria-hidden="true" />
            </span>
            <span className="text-[15px] leading-snug font-medium text-white">{feature}</span>
          </li>
        ))}
      </ul>
    </Reveal>
  );
}

/* --- Colonne latérale ---------------------------------------------------------------- */

const ASSURANCES = [
  [ClipboardList, "Devis détaillé avant travaux"],
  [UserCheck, "Un interlocuteur unique"],
  [MapPin, "Visite sur site si nécessaire"],
];

function Sidebar({ service, company, categoryCount }) {
  const whatsapp = whatsappUrl(company.whatsapp, whatsappMessage(company.name, service.title));
  return (
    <aside className="space-y-4 lg:sticky lg:top-28">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-card">
        {service.price_label && (
          <>
            <p className="text-[12px] font-semibold tracking-[0.08em] text-gray-500 uppercase">Prix indicatif</p>
            <p className="mt-1 font-display text-2xl font-bold tracking-[-0.02em] text-gray-900">{service.price_label}</p>
          </>
        )}
        <p className={`text-[15px] leading-relaxed text-gray-600 ${service.price_label ? "mt-3" : ""}`}>
          Une question ou un devis ? Décrivez votre besoin, nous revenons vers vous.
        </p>
        <Button to={`/contact?service=${service.slug}`} className="mt-5 w-full">
          Demander un devis <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
        {whatsapp && (
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-[#25d366]/50 bg-[#25d366]/10 px-5 py-3 text-[15px] font-semibold text-[#0b7a3b] transition-colors hover:bg-[#25d366]/20"
          >
            <WhatsAppIcon className="size-5" /> Discuter sur WhatsApp
          </a>
        )}
        {company.phone && (
          <Button href={`tel:${company.phone.replace(/\s/g, "")}`} variant="outline" className="mt-3 w-full">
            <Phone className="size-4" aria-hidden="true" /> {company.phone}
          </Button>
        )}
        <ul className="mt-6 space-y-3 border-t border-gray-100 pt-5">
          {ASSURANCES.map(([Icon, label]) => (
            <li key={label} className="flex items-center gap-3 text-[14px] text-gray-700">
              <Icon className="size-[18px] shrink-0 text-primary" aria-hidden="true" />
              {label}
            </li>
          ))}
        </ul>
      </div>

      <Link
        to={`/services?category=${service.category.slug}`}
        className="group flex items-center gap-4 rounded-xl bg-night p-5 text-ink transition-colors hover:bg-night-elevated"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-[12px] font-semibold tracking-[0.08em] text-ink-tertiary uppercase">Domaine</span>
          <span className="mt-1 block font-semibold text-white">{service.category.name}</span>
          {categoryCount > 1 && (
            <span className="mt-0.5 block text-sm text-ink-secondary">{categoryCount} services dans ce domaine</span>
          )}
        </span>
        <ArrowRight className="size-5 shrink-0 text-ink-tertiary transition-transform group-hover:translate-x-1 group-hover:text-white" aria-hidden="true" />
      </Link>
    </aside>
  );
}

/* --- Étapes du projet ---------------------------------------------------------------- */

function ProjectSteps() {
  return (
    <section className="bg-cream py-16 sm:py-20">
      <Container>
        <SectionHeader center eyebrow="Notre méthode" title="Votre projet en 4 étapes" />
        <ol className="relative grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          <span aria-hidden="true" className="absolute top-6 right-[12.5%] left-[12.5%] hidden h-0.5 bg-primary/20 lg:block" />
          {STEPS.map(([title, text], index) => (
            <Reveal as="li" key={title} delay={index * 120} className="relative text-center">
              <span className="relative mx-auto grid size-12 place-items-center rounded-full bg-primary font-display text-lg font-bold text-white ring-8 ring-cream">
                {index + 1}
              </span>
              <h3 className="mt-5 text-lg font-bold text-gray-900">{title}</h3>
              <p className="mx-auto mt-2 max-w-xs text-[15px] leading-relaxed text-gray-600">{text}</p>
            </Reveal>
          ))}
        </ol>
      </Container>
    </section>
  );
}

/* --- Page ------------------------------------------------------------------------ */

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
  useWhatsAppTopic(service?.title);

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
        image={service?.cover_image || "/images/fonds/services.jpg"}
        imageVariants={service?.cover_image ? service.cover_image_variants : undefined}
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
                <div className="mt-12">
                  <Description text={service.description} />
                </div>
                <Features features={service.features} />
              </div>

              <Sidebar service={service} company={company} categoryCount={similar.data?.count ?? 0} />
            </Container>
          </section>

          <ProjectSteps />

          {testimonials.data?.results.length > 0 && (
            <section className="py-16 sm:py-20">
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
                  title="Dans le même domaine"
                  action={
                    <Button to={`/services?category=${service.category.slug}`} variant="outline">
                      Tout le domaine <ArrowRight className="size-4" aria-hidden="true" />
                    </Button>
                  }
                />
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {others.map((other, index) => (
                    <Reveal key={other.id} delay={index * 100} className="flex *:w-full">
                      <ServiceCard service={other} />
                    </Reveal>
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
