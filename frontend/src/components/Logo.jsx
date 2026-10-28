import { Link } from "react-router";

import { useCompany } from "../context/CompanyContext";

export const DEFAULT_LOGO = "/logo-procad.png";

/**
 * Logo de l'entreprise : celui téléversé dans l'admin, sinon le logo PROCAD fourni.
 * `framed` : posé sur une plaque blanche, pour les fonds sombres.
 */
export default function Logo({ framed = false, to = "/", className = "", imageClassName = "h-12" }) {
  const { company } = useCompany();
  const image = <img src={company.logo || DEFAULT_LOGO} alt={company.name} className={`${imageClassName} w-auto`} />;

  return (
    <Link
      to={to}
      className={`inline-flex shrink-0 items-center transition-opacity hover:opacity-85 ${
        framed ? "rounded-lg bg-white px-3 py-2" : ""
      } ${className}`}
    >
      {image}
    </Link>
  );
}
