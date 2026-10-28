import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";

import SocialIcons from "./SocialIcons";

const tel = (phone) => `tel:${phone.replace(/\s/g, "")}`;
const whatsapp = (phone) => `https://wa.me/${phone.replace(/\D/g, "")}`;

/** Liste des coordonnées renseignées dans le profil de l'entreprise. */
export function contactItems(company) {
  const address = [company.address, company.city, company.country].filter(Boolean).join(", ");
  return [
    company.phone && { icon: Phone, label: "Téléphone", value: company.phone, href: tel(company.phone) },
    company.whatsapp && {
      icon: MessageCircle,
      label: "WhatsApp",
      value: company.whatsapp,
      href: whatsapp(company.whatsapp),
      external: true,
    },
    company.email && { icon: Mail, label: "E-mail", value: company.email, href: `mailto:${company.email}` },
    address && {
      icon: MapPin,
      label: "Adresse",
      value: address,
      href: `https://www.openstreetmap.org/search?query=${encodeURIComponent(address)}`,
      external: true,
    },
    company.opening_hours && { icon: Clock, label: "Horaires", value: company.opening_hours },
  ].filter(Boolean);
}

/** Carte sombre « Nous joindre » : coordonnées cliquables (appel, WhatsApp, e-mail, carte) et réseaux. */
export default function ContactCard({ company, title = "Nous joindre", className = "" }) {
  const items = contactItems(company);
  if (!items.length) return null;

  return (
    <div className={`relative overflow-hidden rounded-xl border-t-4 border-accent bg-night p-7 text-ink shadow-card-hover sm:p-8 ${className}`}>
      <p className="font-display text-xl font-semibold text-white">{title}</p>
      <ul className="mt-6 space-y-5">
        {items.map(({ icon: Icon, label, value, href, external }) => (
          <li key={label} className="flex gap-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-white/[0.07] text-white">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-[12px] font-semibold tracking-[0.08em] text-ink-muted uppercase">{label}</p>
              {href ? (
                <a
                  href={href}
                  {...(external && { target: "_blank", rel: "noopener noreferrer" })}
                  className="text-[15px] break-words whitespace-pre-line text-ink-secondary transition-colors hover:text-white"
                >
                  {value}
                </a>
              ) : (
                <p className="text-[15px] whitespace-pre-line text-ink-secondary">{value}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
      <SocialIcons company={company} className="mt-7 border-t border-white/10 pt-6" />
    </div>
  );
}
