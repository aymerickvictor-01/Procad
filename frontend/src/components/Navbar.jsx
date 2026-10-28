import { Clock, Mail, Menu, Phone, X } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router";

import { useCompany } from "../context/CompanyContext";
import Button from "./Button";
import Container from "./Container";
import Logo from "./Logo";

const LINKS = [
  { to: "/", label: "Accueil", end: true },
  { to: "/services", label: "Services" },
  { to: "/a-propos", label: "À propos" },
  { to: "/contact", label: "Contact" },
];

// Lien actif : texte bleu et filet rouge sous le libellé.
function desktopLinkClass({ isActive }) {
  return `relative px-1 py-2 text-[15px] font-semibold transition-colors after:absolute after:inset-x-1 after:-bottom-[20px] after:h-0.5 ${
    isActive ? "text-primary after:bg-accent" : "text-gray-700 after:bg-transparent hover:text-primary"
  }`;
}

function mobileLinkClass({ isActive }) {
  return `rounded-lg px-3 py-3 text-[15px] font-semibold ${
    isActive ? "bg-primary/5 text-primary" : "text-gray-800 hover:bg-gray-50"
  }`;
}

/** Bandeau supérieur : coordonnées rapides, affiché seulement si elles sont renseignées. */
function TopBar({ company }) {
  const firstHours = company.opening_hours?.split("\n")[0];
  if (!company.phone && !company.email) return null;
  return (
    <div className="bg-night text-[13px] text-ink-secondary">
      <Container className="flex h-9 items-center justify-between gap-6">
        <span className="hidden items-center gap-1.5 md:flex">
          {firstHours && (
            <>
              <Clock className="size-3.5 text-ink-tertiary" aria-hidden="true" /> {firstHours}
            </>
          )}
        </span>
        <div className="flex items-center gap-6">
          {company.phone && (
            <a href={`tel:${company.phone.replace(/\s/g, "")}`} className="flex items-center gap-1.5 hover:text-white">
              <Phone className="size-3.5 text-ink-tertiary" aria-hidden="true" /> {company.phone}
            </a>
          )}
          {company.email && (
            <a href={`mailto:${company.email}`} className="hidden items-center gap-1.5 hover:text-white sm:flex">
              <Mail className="size-3.5 text-ink-tertiary" aria-hidden="true" /> {company.email}
            </a>
          )}
        </div>
      </Container>
    </div>
  );
}

export default function Navbar() {
  const { company } = useCompany();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Referme le menu mobile à chaque changement de page.
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-50 shadow-[0_1px_0_rgb(10_18_64/0.08)]">
      <TopBar company={company} />
      <div className="bg-white">
        <Container className="flex h-20 items-center justify-between gap-6">
          <Logo imageClassName="h-12 sm:h-14" />

          <nav aria-label="Navigation principale" className="hidden items-center gap-8 lg:flex">
            {LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end} className={desktopLinkClass}>
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <Button to="/contact" size="sm">
                Nous contacter
              </Button>
            </div>
            <button
              type="button"
              className="rounded-lg p-2 text-gray-800 transition-colors hover:bg-gray-100 lg:hidden"
              aria-expanded={open}
              aria-controls="menu-mobile"
              aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? <X className="size-6" /> : <Menu className="size-6" />}
            </button>
          </div>
        </Container>

        {open && (
          <nav id="menu-mobile" aria-label="Navigation mobile" className="border-t border-gray-100 lg:hidden">
            <Container className="flex flex-col gap-1 py-3">
              {LINKS.map((link) => (
                <NavLink key={link.to} to={link.to} end={link.end} className={mobileLinkClass}>
                  {link.label}
                </NavLink>
              ))}
              <Button to="/contact" className="mt-2 mb-1 sm:hidden">
                Nous contacter
              </Button>
            </Container>
          </nav>
        )}
      </div>
    </header>
  );
}
