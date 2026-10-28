import { ArrowLeft, Compass } from "lucide-react";

import Button from "../../components/Button";
import Container from "../../components/Container";

export default function NotFound({ title = "Page introuvable", message }) {
  return (
    <section className="relative overflow-hidden bg-night text-ink">
      <div aria-hidden="true" className="absolute -top-40 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />
      <Container className="relative flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
        <title>{title}</title>
        <span className="glass grid size-16 place-items-center rounded-2xl text-primary-soft">
          <Compass className="size-8" aria-hidden="true" />
        </span>
        <p className="mt-8 font-display text-7xl font-bold tracking-[-0.04em] text-gradient">404</p>
        <h1 className="mt-4 text-3xl font-bold tracking-[-0.02em] text-white">{title}</h1>
        <p className="mt-3 max-w-md text-[17px] text-ink-secondary">
          {message ?? "La page que vous cherchez n'existe pas ou a été déplacée."}
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
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
