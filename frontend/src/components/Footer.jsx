import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { Link } from "react-router";

import { useCompany } from "../context/CompanyContext";
import Container from "./Container";
import Logo from "./Logo";
import SocialIcons from "./SocialIcons";

function FooterTitle({ children }) {
  return <h2 className="text-[13px] font-semibold tracking-[0.08em] text-white uppercase">{children}</h2>;
}

export default function Footer() {
  const { company } = useCompany();
  const address = [company.address, company.city, company.country].filter(Boolean).join(", ");

  return (
    <footer className="relative overflow-hidden border-t-4 border-accent bg-night text-ink-tertiary">
      <Container className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1.2fr_1fr]">
        <div>
          <Logo framed imageClassName="h-14" />
          {company.slogan && <p className="mt-5 max-w-xs text-[15px] leading-relaxed">{company.slogan}</p>}
          <SocialIcons company={company} className="mt-6" />
        </div>

        <div>
          <FooterTitle>Navigation</FooterTitle>
          <ul className="mt-4 space-y-2.5 text-[15px]">
            {[
              ["/", "Accueil"],
              ["/services", "Nos services"],
              ["/a-propos", "À propos"],
              ["/contact", "Contact"],
            ].map(([to, label]) => (
              <li key={to}>
                <Link to={to} className="transition-colors hover:text-white">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <FooterTitle>Coordonnées</FooterTitle>
          <ul className="mt-4 space-y-3 text-[15px]">
            {address && (
              <li className="flex gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-ink-tertiary" aria-hidden="true" /> {address}
              </li>
            )}
            {company.phone && (
              <li>
                <a href={`tel:${company.phone.replace(/\s/g, "")}`} className="flex gap-2.5 hover:text-white">
                  <Phone className="mt-0.5 size-4 shrink-0 text-ink-tertiary" aria-hidden="true" /> {company.phone}
                </a>
              </li>
            )}
            {company.email && (
              <li>
                <a href={`mailto:${company.email}`} className="flex gap-2.5 break-all hover:text-white">
                  <Mail className="mt-0.5 size-4 shrink-0 text-ink-tertiary" aria-hidden="true" /> {company.email}
                </a>
              </li>
            )}
            {!address && !company.phone && !company.email && (
              <li>
                <Link to="/contact" className="hover:text-white">
                  Écrivez-nous via le formulaire de contact
                </Link>
              </li>
            )}
          </ul>
        </div>

        {company.opening_hours && (
          <div>
            <FooterTitle>Horaires</FooterTitle>
            <p className="mt-4 flex gap-2.5 text-[15px] leading-relaxed whitespace-pre-line">
              <Clock className="mt-1 size-4 shrink-0 text-ink-tertiary" aria-hidden="true" />
              {company.opening_hours}
            </p>
          </div>
        )}
      </Container>

      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-3 py-6 text-[13px] text-ink-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {company.name}. Tous droits réservés.
          </p>
          <nav aria-label="Liens légaux" className="flex flex-wrap gap-x-5 gap-y-2">
            <Link to="/mentions-legales" className="hover:text-white">
              Mentions légales
            </Link>
            <Link to="/confidentialite" className="hover:text-white">
              Confidentialité
            </Link>
            <Link to="/admin/login" className="hover:text-white">
              Espace administrateur
            </Link>
          </nav>
        </Container>
      </div>
    </footer>
  );
}
