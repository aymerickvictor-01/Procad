import { Link } from "react-router";

import Container from "../../components/Container";
import PageHero from "../../components/PageHero";
import { useCompany } from "../../context/CompanyContext";

/**
 * Pages légales (contenu statique en v1). Les informations que seule l'entreprise peut fournir
 * sont signalées par <ToFill /> : à remplacer par le texte validé par PROCAD avant la mise en ligne.
 */
function ToFill({ children = "À compléter" }) {
  return (
    <mark className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[0.9em] font-semibold text-amber-800">{children}</mark>
  );
}

function Section({ title, children }) {
  return (
    <section className="border-t border-gray-200 pt-8 first:border-t-0 first:pt-0">
      <h2 className="text-xl font-bold tracking-[-0.01em] text-gray-900">{title}</h2>
      <div className="mt-3 space-y-3 text-[16px] leading-relaxed text-gray-700">{children}</div>
    </section>
  );
}

function LegalPage({ title, children }) {
  const { company } = useCompany();
  return (
    <>
      <title>{`${title} — ${company.name}`}</title>
      <PageHero title={title} breadcrumb={[{ to: "/", label: "Accueil" }, { label: title }]} />
      <Container className="py-12 sm:py-16">
        <div className="max-w-3xl space-y-8">{children}</div>
      </Container>
    </>
  );
}

function companyAddress(company) {
  return [company.address, company.city, company.country].filter(Boolean).join(", ");
}

export function LegalNotice() {
  const { company } = useCompany();
  const address = companyAddress(company);

  return (
    <LegalPage title="Mentions légales">
      <Section title="Éditeur du site">
        <p>
          Le présent site est édité par <strong>{company.name}</strong>.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Adresse : {address || <ToFill />}</li>
          <li>E-mail : {company.email || <ToFill />}</li>
          <li>Téléphone : {company.phone || <ToFill />}</li>
          <li>
            Forme juridique, capital social : <ToFill />
          </li>
          <li>
            Numéro d'immatriculation (RCCM) et identifiant fiscal (NIU) : <ToFill />
          </li>
        </ul>
      </Section>
      <Section title="Directeur de la publication">
        <p>
          <ToFill>Nom et fonction du responsable de la publication</ToFill>
        </p>
      </Section>
      <Section title="Hébergement">
        <p>
          <ToFill>Nom, adresse et contact de l'hébergeur du site</ToFill>
        </p>
      </Section>
      <Section title="Propriété intellectuelle">
        <p>
          L'ensemble des contenus de ce site (textes, images, logo) est la propriété de {company.name}, sauf mention
          contraire. Toute reproduction ou réutilisation sans autorisation écrite préalable est interdite.
        </p>
      </Section>
      <Section title="Contact">
        <p>
          Pour toute question concernant le site, utilisez le{" "}
          <Link to="/contact" className="font-semibold text-primary hover:underline">
            formulaire de contact
          </Link>
          .
        </p>
      </Section>
    </LegalPage>
  );
}

export function PrivacyPolicy() {
  const { company } = useCompany();

  return (
    <LegalPage title="Politique de confidentialité">
      <Section title="Données collectées">
        <p>
          Les seules données personnelles collectées sur ce site sont celles que vous saisissez dans le formulaire de
          contact : nom complet, adresse e-mail, téléphone (facultatif), objet, message et, le cas échéant, le service
          concerné.
        </p>
      </Section>
      <Section title="Utilisation">
        <p>
          Ces données servent uniquement à répondre à votre demande. Elles ne sont ni vendues, ni cédées, ni utilisées
          à des fins publicitaires. Elles ne sont consultées que par les personnes habilitées de {company.name}.
        </p>
        <p>Leur traitement repose sur votre consentement, exprimé en cochant la case prévue avant l'envoi.</p>
      </Section>
      <Section title="Durée de conservation">
        <p>
          <ToFill>Durée de conservation des messages reçus (par exemple : 12 mois après le dernier échange)</ToFill>
        </p>
      </Section>
      <Section title="Cookies">
        <p>
          Ce site n'utilise aucun cookie publicitaire ni outil de mesure d'audience. Seuls des cookies techniques,
          indispensables au fonctionnement, sont déposés : protection des formulaires contre les envois frauduleux et
          session de l'espace administrateur.
        </p>
      </Section>
      <Section title="Sécurité">
        <p>
          Les échanges avec le site sont chiffrés (HTTPS) et l'accès aux messages est réservé aux administrateurs
          authentifiés.
        </p>
      </Section>
      <Section title="Vos droits">
        <p>
          Conformément à la législation applicable, vous pouvez demander l'accès à vos données, leur rectification ou
          leur suppression en écrivant à {company.email ? <strong>{company.email}</strong> : <ToFill>adresse e-mail de contact</ToFill>}.
        </p>
      </Section>
    </LegalPage>
  );
}
