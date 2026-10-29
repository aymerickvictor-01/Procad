import { ArrowLeft } from "lucide-react";

import Button from "../../components/Button";
import Container from "../../components/Container";
import { PhotoBackground } from "../../components/PageHero";
import { Eyebrow } from "../../components/SectionHeader";

export default function NotFound({ title = "Page introuvable", message }) {
  return (
    <section className="relative isolate overflow-hidden bg-night text-ink">
      <PhotoBackground image="/images/fonds/erreur.jpg" />
      <Container className="relative flex min-h-[60vh] flex-col justify-center py-24">
        <title>{title}</title>
        <Eyebrow dark>Erreur 404</Eyebrow>
        <h1 className="mt-4 text-4xl font-bold tracking-[-0.02em] text-white sm:text-5xl">{title}</h1>
        <p className="mt-4 max-w-lg text-[17px] text-ink-secondary">
          {message ?? "La page que vous cherchez n'existe pas ou a été déplacée."}
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Button to="/">
            <ArrowLeft className="size-4" aria-hidden="true" /> Retour à l'accueil
          </Button>
          <Button to="/services" variant="secondary">
            Voir nos services
          </Button>
        </div>
      </Container>
    </section>
  );
}
