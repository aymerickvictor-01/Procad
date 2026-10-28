import { ArrowRight } from "lucide-react";

import Button from "../../components/Button";
import ContactCard from "../../components/ContactCard";
import Container from "../../components/Container";
import PageHero from "../../components/PageHero";
import { Skeleton } from "../../components/States";
import { useCompany } from "../../context/CompanyContext";

export default function About() {
  const { company, loading } = useCompany();
  const text = company.about_text || company.description;

  return (
    <>
      <title>{`À propos — ${company.name}`}</title>
      {company.description && <meta name="description" content={company.description.slice(0, 160)} />}

      <PageHero
        eyebrow="À propos"
        title={`À propos de ${company.name}`}
        description={company.slogan}
        breadcrumb={[{ to: "/", label: "Accueil" }, { label: "À propos" }]}
      />

      <section className="py-12 sm:py-16">
        <Container className="grid items-start gap-10 lg:grid-cols-[1fr_380px] lg:gap-12">
          <div className="min-w-0">
            {company.hero_image && (
              <div className="mb-10 aspect-[16/8] overflow-hidden rounded-2xl border border-gray-200">
                <img src={company.hero_image} alt={company.name} className="size-full object-cover" />
              </div>
            )}

            {loading ? (
              <div className="space-y-3" aria-hidden="true">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            ) : text ? (
              <div className="text-[17px] leading-[1.8] whitespace-pre-line text-gray-700">{text}</div>
            ) : (
              <p className="text-[17px] text-gray-600">La présentation de {company.name} sera bientôt disponible.</p>
            )}

            <div className="mt-10 flex flex-wrap gap-3">
              <Button to="/services">
                Découvrir nos services <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
              <Button to="/contact" variant="outline">
                Nous contacter
              </Button>
            </div>
          </div>

          <ContactCard company={company} className="lg:sticky lg:top-28" />
        </Container>
      </section>
    </>
  );
}
