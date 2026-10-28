import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";

import { getCategories, getServices } from "../../api/public";
import Button from "../../components/Button";
import Container from "../../components/Container";
import PageHero from "../../components/PageHero";
import Pagination from "../../components/Pagination";
import ServiceCard, { ServiceCardSkeleton } from "../../components/ServiceCard";
import { EmptyState, ErrorState } from "../../components/States";
import useApi from "../../hooks/useApi";
import useDebounce from "../../hooks/useDebounce";

const PAGE_SIZE = 12;

function Pill({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors ${
        active ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
      }`}
    >
      {children}
    </button>
  );
}

export default function Services() {
  const [params, setParams] = useSearchParams();
  const category = params.get("category") ?? "";
  const search = params.get("search") ?? "";
  const page = Math.max(1, Number(params.get("page")) || 1);

  const [query, setQuery] = useState(search);
  const debouncedQuery = useDebounce(query.trim());
  const resultsRef = useRef(null);

  // Les filtres vivent dans l'URL (?category=...&search=...&page=...) : un lien partagé redonne la même vue.
  function updateParams(changes, { replace = false } = {}) {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, String(value)) : next.delete(key)));
    setParams(next, { replace });
  }

  // Saisie -> URL, après une pause dans la frappe (sans remplir l'historique à chaque lettre).
  useEffect(() => {
    if (debouncedQuery !== search) updateParams({ search: debouncedQuery, page: null }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  // URL -> saisie (bouton Précédent du navigateur, lien partagé).
  useEffect(() => {
    if (search !== query.trim()) setQuery(search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const categories = useApi(getCategories);
  const services = useApi(
    () => getServices({ category: category || undefined, search: search || undefined, page }),
    [category, search, page],
  );

  // Page devenue inexistante (filtres modifiés, lien ancien) : retour à la première page.
  useEffect(() => {
    if (services.error?.response?.status === 404 && page > 1) updateParams({ page: null }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [services.error]);

  function changePage(next) {
    updateParams({ page: next > 1 ? next : null });
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const visibleCategories = (categories.data ?? []).filter((c) => c.service_count > 0);
  const activeCategory = visibleCategories.find((c) => c.slug === category);
  const filtered = Boolean(category || search);

  return (
    <>
      <title>{activeCategory ? `${activeCategory.name} — Nos services` : "Nos services"}</title>
      <meta name="description" content="Découvrez l'ensemble de nos services et prestations." />

      <PageHero
        eyebrow="Catalogue"
        title="Nos services"
        description="Parcourez l'ensemble de nos prestations, filtrez par domaine ou recherchez un service précis."
        breadcrumb={[{ to: "/", label: "Accueil" }, { label: "Services" }]}
      />

      <section className="py-12 sm:py-16">
        <Container>
          <div
            ref={resultsRef}
            className="flex scroll-mt-32 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
          >
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Filtrer par catégorie">
              <Pill active={!category} onClick={() => updateParams({ category: null, page: null })}>
                Toutes
              </Pill>
              {visibleCategories.map((c) => (
                <Pill key={c.slug} active={c.slug === category} onClick={() => updateParams({ category: c.slug, page: null })}>
                  {c.name}
                  <span className="ml-1.5 opacity-60">{c.service_count}</span>
                </Pill>
              ))}
            </div>

            <form role="search" className="relative w-full lg:w-80" onSubmit={(e) => e.preventDefault()}>
              <label htmlFor="recherche" className="sr-only">
                Rechercher un service
              </label>
              <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
              <input
                id="recherche"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un service…"
                className="w-full rounded-full border border-gray-300 bg-white py-2.5 pr-10 pl-11 text-[15px] transition outline-none placeholder:text-gray-400 focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Effacer la recherche"
                  className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                >
                  <X className="size-4" />
                </button>
              )}
            </form>
          </div>

          <div className="mt-6 flex min-h-6 items-center gap-3 text-sm text-gray-500" aria-live="polite">
            {services.data && (
              <span>
                {services.data.count} service{services.data.count > 1 ? "s" : ""}
                {search && <> pour « {search} »</>}
                {activeCategory && <> dans {activeCategory.name}</>}
              </span>
            )}
            {filtered && (
              <button
                type="button"
                className="font-semibold text-primary hover:underline"
                onClick={() => {
                  setQuery("");
                  setParams({});
                }}
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>

          <div className="mt-6">
            {services.loading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <ServiceCardSkeleton key={n} />
                ))}
              </div>
            ) : services.error ? (
              <ErrorState error={services.error} onRetry={services.reload} />
            ) : services.data.results.length === 0 ? (
              <EmptyState
                title={filtered ? "Aucun service ne correspond" : "Aucun service pour le moment"}
                description={
                  filtered
                    ? "Essayez un autre mot-clé ou une autre catégorie."
                    : "Notre catalogue est en cours de préparation. Contactez-nous pour en savoir plus."
                }
                action={
                  filtered ? (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setQuery("");
                        setParams({});
                      }}
                    >
                      Voir tous les services
                    </Button>
                  ) : (
                    <Button to="/contact">Nous contacter</Button>
                  )
                }
              />
            ) : (
              <>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {services.data.results.map((service) => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>
                <Pagination page={page} count={services.data.count} pageSize={PAGE_SIZE} onChange={changePage} />
              </>
            )}
          </div>
        </Container>
      </section>
    </>
  );
}
