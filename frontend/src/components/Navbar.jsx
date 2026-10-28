import { Mail, Menu, Phone, X } from "lucide-react";
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

function linkClass({ isActive }) {
  return `rounded-xl px-3.5 py-2 text-[15px] font-semibold transition-colors ${
    isActive ? "bg-white/10 text-white" : "text-ink-secondary hover:bg-white/5 hover:text-white"
  }`;
}

/** Bandeau supérieur en dégradé : coordonnées rapides, affiché seulement si elles sont renseignées. */
function TopBar({ company }) {
  if (!company.phone && !company.email) return null;
  return (
    <div className="bg-linear-to-r from-primary-deep via-primary to-primary-deep text-white">
      <Container className="flex h-10 items-center justify-center gap-6 text-[13px] font-medium sm:justify-end">
        {company.phone && (
          <a href={`tel:${company.phone.replace(/\s/g, "")}`} className="flex items-center gap-1.5 hover:underline">
            <Phone className="size-3.5" aria-hidden="true" /> {company.phone}
          </a>
        )}
        {company.email && (
          <a href={`mailto:${company.email}`} className="hidden items-center gap-1.5 hover:underline sm:flex">
            <Mail className="size-3.5" aria-hidden="true" /> {company.email}
          </a>
        )}
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
    <header className="sticky top-0 z-50">
      <TopBar company={company} />
      <div className="border-b border-white/10 bg-night">
        <Container className="flex h-16 items-center justify-between gap-4 sm:h-[72px]">
          <Logo />

          <nav aria-label="Navigation principale" className="hidden items-center gap-1 lg:flex">
            {LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end} className={linkClass}>
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {/* Masqué par un conteneur : Button impose déjà « inline-flex », qui l'emporterait sur « hidden ». */}
            <div className="hidden sm:block">
              <Button to="/contact" size="sm">
                Nous contacter
              </Button>
            </div>
            <button
              type="button"
              className="rounded-lg p-2 text-white transition-colors hover:bg-white/10 lg:hidden"
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
          <nav id="menu-mobile" aria-label="Navigation mobile" className="border-t border-white/10 lg:hidden">
            <Container className="flex flex-col gap-1 py-4">
              {LINKS.map((link) => (
                <NavLink key={link.to} to={link.to} end={link.end} className={linkClass}>
                  {link.label}
                </NavLink>
              ))}
              <Button to="/contact" className="mt-3 sm:hidden">
                Nous contacter
              </Button>
            </Container>
          </nav>
        )}
      </div>
    </header>
  );
}
