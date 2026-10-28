import { createContext, useContext } from "react";

import { getCompany } from "../api/public";
import useApi from "../hooks/useApi";

// Valeurs affichées tant que le profil n'est pas chargé (ou si l'API est injoignable).
const FALLBACK = { name: "PROCAD" };

const CompanyContext = createContext({ company: FALLBACK, loading: true });

export function CompanyProvider({ children }) {
  const { data, loading } = useApi(getCompany);
  return <CompanyContext value={{ company: data ?? FALLBACK, loading }}>{children}</CompanyContext>;
}

export function useCompany() {
  return useContext(CompanyContext);
}
