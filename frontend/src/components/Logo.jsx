import { Link } from "react-router";

import { useCompany } from "../context/CompanyContext";

/** Logo de l'entreprise (téléversé dans l'admin) ou, à défaut, logotype provisoire. */
export default function Logo({ className = "" }) {
  const { company } = useCompany();

  return (
    <Link to="/" className={`flex items-center gap-2.5 transition-opacity hover:opacity-85 ${className}`}>
      {company.logo ? (
        <img src={company.logo} alt={company.name} className="h-9 w-auto" />
      ) : (
        <>
          <span
            aria-hidden="true"
            className="grid size-9 place-items-center rounded-xl bg-linear-to-br from-primary to-primary-soft font-display text-lg font-bold text-white shadow-glow"
          >
            {company.name.charAt(0)}
          </span>
          <span className="font-display text-xl font-bold tracking-[-0.02em] text-white">{company.name}</span>
        </>
      )}
    </Link>
  );
}
