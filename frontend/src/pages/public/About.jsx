import { ArrowRight } from "lucide-react";

import { getCategories } from "../../api/public";
import Button from "../../components/Button";
import ContactCard, { contactItems } from "../../components/ContactCard";
import Container from "../../components/Container";
import DomainGrid from "../../components/DomainGrid";
import PageHero from "../../components/PageHero";
import ResponsiveImage, { staticVariants } from "../../components/ResponsiveImage";
import Reveal from "../../components/Reveal";
import SectionHeader, { Eyebrow } from "../../components/SectionHeader";
import { Skeleton } from "../../components/States";
import { useCompany } from "../../context/CompanyContext";
import useApi from "../../hooks/useApi";

// Présentation affichée tant que l'administrateur n'a pas rédigé la sienne (profil de l'entreprise).
const defaultText = (name) =>
  `${name} est une entreprise pluridisciplinaire. Elle réunit dans une même structure les études ` +
  "et la conception, la construction, le second œuvre, les installations techniques, la métallerie, " +
  "la sécurité, l'informatique et la communication.\n\n" +
  "Cette organisation permet à nos clients de confier un projet complet à un seul interlocuteur, " +
  "de l'étude jusqu'à la réception, tout en bénéficiant de spécialistes pour chaque corps de métier.";

export default function About() {
  const { company, loading } = useCompany();
  const categories = useApi(getCategories);
  const domains = (categories.data ?? []).filter((c) => c.service_count > 0);
  const text = company.about_text || company.description || defaultText(company.name);
  const hasContact = contactItems(company).length > 0;

  return (
    <>
      <title>{`À propos — ${company.name}`}</title>
      <meta name="description" content={text.slice(0, 160)} />

      <PageHero
        eyebrow="À propos"
        title={`À propos de ${company.name}`}
        description={company.slogan || "Une entreprise pluridisciplinaire au service de vos projets."}
        breadcrumb={[{ to: "/", label: "Accueil" }, { label: "À propos" }]}
        image="/images/fonds/a-propos.jpg"
      />

      <section className="py-16 sm:py-20">
        <Container className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="min-w-0">
            <Eyebrow>Qui sommes-nous</Eyebrow>
            <h2 className="mt-3 text-3xl leading-tight font-bold tracking-[-0.02em] text-gray-900 sm:text-4xl">
              Un seul partenaire, tous les corps de métier
            </h2>
            {loading ? (
              <div className="mt-6 space-y-3" aria-hidden="true">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            ) : (
              <div className="mt-6 text-[17px] leading-[1.8] whitespace-pre-line text-gray-700">{text}</div>
            )}
            <div className="mt-9 flex flex-wrap gap-3">
              <Button to="/services">
                Découvrir nos services <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
              <Button to="/contact" variant="outline">
                Nous contacter
              </Button>
            </div>
          </div>

          <Reveal className="aspect-[4/3] overflow-hidden rounded-xl bg-gray-100">
            <ResponsiveImage
              src={company.hero_image || "/images/fonds/services.jpg"}
              variants={company.hero_image ? company.hero_image_variants : staticVariants("/images/fonds/services.jpg")}
              sizes="(min-width: 1024px) 50vw, 100vw"
              alt={`Chantier ${company.name}`}
              className="size-full object-cover"
            />
          </Reveal>
        </Container>
      </section>

      {domains.length > 0 && (
        <section className="bg-cream py-16 sm:py-20">
          <Container>
            <SectionHeader
              eyebrow="Nos domaines d'expertise"
              title="Du plan à la remise des clés"
              description="Chaque domaine regroupe des équipes spécialisées. Choisissez-en un pour découvrir ses services."
            />
            <DomainGrid categories={domains} />
          </Container>
        </section>
      )}

      {hasContact && (
        <section className="py-16 sm:py-20">
          <Container className="max-w-3xl">
            <Reveal>
              <ContactCard company={company} />
            </Reveal>
          </Container>
        </section>
      )}
    </>
  );
}
