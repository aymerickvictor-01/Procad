import { ExternalLink, Layers, Pencil, Plus, Search, Star, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";

import { deleteService, getAdminCategories, getAdminServices, updateService } from "../../api/admin";
import { errorMessage } from "../../api/client";
import AdminPage from "../../components/admin/AdminPage";
import { ConfirmDialog } from "../../components/admin/Modal";
import { useToast } from "../../components/admin/Toast";
import Button from "../../components/Button";
import { inputClass } from "../../components/form/Field";
import Pagination from "../../components/Pagination";
import { EmptyState, ErrorState, Skeleton } from "../../components/States";
import useApi from "../../hooks/useApi";
import useDebounce from "../../hooks/useDebounce";
import useUrlFilters from "../../hooks/useUrlFilters";

const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });
const selectClass = `${inputClass} py-2.5 sm:w-48`;

export function StatusBadge({ published }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold ${
        published ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"
      }`}
    >
      <span className={`size-1.5 rounded-full ${published ? "bg-emerald-500" : "bg-gray-400"}`} aria-hidden="true" />
      {published ? "Publié" : "Brouillon"}
    </span>
  );
}

export default function AdminServices() {
  const notify = useToast();
  const [params, update] = useUrlFilters();
  const search = params.get("search") ?? "";
  const category = params.get("category") ?? "";
  const published = params.get("is_published") ?? "";
  const page = Math.max(1, Number(params.get("page")) || 1);

  const [query, setQuery] = useState(search);
  const debounced = useDebounce(query.trim());
  useEffect(() => {
    if (debounced !== search) update({ search: debounced, page: null }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const categories = useApi(getAdminCategories);
  const services = useApi(
    () => getAdminServices({ search: search || undefined, category: category || undefined, is_published: published || undefined, page }),
    [search, category, published, page],
  );

  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState({ busy: false, error: null });

  async function toggle(service, field) {
    try {
      const updated = await updateService(service.id, { [field]: !service[field] });
      services.setData((data) => ({ ...data, results: data.results.map((s) => (s.id === updated.id ? updated : s)) }));
      if (field === "is_published") notify(updated.is_published ? "Service publié." : "Service repassé en brouillon.");
    } catch (error) {
      notify(errorMessage(error), "error");
    }
  }

  async function confirmDelete() {
    setDeleting({ busy: true, error: null });
    try {
      await deleteService(toDelete.id);
      setToDelete(null);
      notify("Service supprimé.");
      services.reload();
    } catch (error) {
      setDeleting({ busy: false, error: errorMessage(error) });
      return;
    }
    setDeleting({ busy: false, error: null });
  }

  const filtered = Boolean(search || category || published);

  return (
    <AdminPage
      title="Services"
      description="Créez, modifiez et publiez les services affichés sur le site."
      actions={
        <Button to="/admin/services/nouveau">
          <Plus className="size-4" aria-hidden="true" /> Nouveau service
        </Button>
      }
    >
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <label htmlFor="admin-search" className="sr-only">
            Rechercher
          </label>
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
          <input
            id="admin-search"
            type="search"
            placeholder="Rechercher un service…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`${inputClass} py-2.5 pl-11`}
          />
        </div>
        <select aria-label="Catégorie" className={selectClass} value={category} onChange={(e) => update({ category: e.target.value, page: null })}>
          <option value="">Toutes les catégories</option>
          {(categories.data ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select aria-label="Statut" className={selectClass} value={published} onChange={(e) => update({ is_published: e.target.value, page: null })}>
          <option value="">Tous les statuts</option>
          <option value="true">Publiés</option>
          <option value="false">Brouillons</option>
        </select>
      </div>

      {services.loading && !services.data ? (
        <div className="space-y-2 rounded-xl border border-gray-200 bg-white p-4">
          {[1, 2, 3, 4].map((n) => (
            <Skeleton key={n} className="h-14 w-full" />
          ))}
        </div>
      ) : services.error ? (
        <ErrorState error={services.error} onRetry={services.reload} />
      ) : services.data.results.length === 0 ? (
        <EmptyState
          title={filtered ? "Aucun service ne correspond aux filtres" : "Aucun service pour le moment"}
          description={filtered ? undefined : "Créez votre premier service : il sera enregistré en brouillon."}
          action={!filtered && <Button to="/admin/services/nouveau">Créer un service</Button>}
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[14px]">
                <thead className="border-b border-gray-200 bg-gray-50 text-[12px] font-semibold tracking-wide text-gray-500 uppercase">
                  <tr>
                    <th className="px-4 py-3">Service</th>
                    <th className="hidden px-4 py-3 md:table-cell">Catégorie</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="hidden px-4 py-3 text-center sm:table-cell">Mis en avant</th>
                    <th className="hidden px-4 py-3 text-center lg:table-cell">Ordre</th>
                    <th className="hidden px-4 py-3 lg:table-cell">Modifié le</th>
                    <th className="px-4 py-3 text-right">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {services.data.results.map((service) => (
                    <tr key={service.id} className="transition-colors hover:bg-gray-50/70">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                            {service.cover_image ? (
                              <img src={service.cover_image} alt="" className="size-full object-cover" />
                            ) : (
                              <Layers className="m-3 size-6 text-gray-300" aria-hidden="true" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <Link to={`/admin/services/${service.id}/modifier`} className="block truncate font-semibold text-gray-900 hover:text-primary">
                              {service.title}
                            </Link>
                            <p className="truncate text-[13px] text-gray-500">/{service.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden px-4 py-3 text-gray-600 md:table-cell">{service.category_name}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => toggle(service, "is_published")}
                          title={service.is_published ? "Repasser en brouillon" : "Publier"}
                          className="rounded-full transition hover:ring-4 hover:ring-gray-100"
                        >
                          <StatusBadge published={service.is_published} />
                        </button>
                      </td>
                      <td className="hidden px-4 py-3 text-center sm:table-cell">
                        <button
                          type="button"
                          onClick={() => toggle(service, "is_featured")}
                          aria-pressed={service.is_featured}
                          aria-label={service.is_featured ? "Retirer de la mise en avant" : "Mettre en avant"}
                          className="rounded-lg p-1.5 hover:bg-gray-100"
                        >
                          <Star className={`size-5 ${service.is_featured ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
                        </button>
                      </td>
                      <td className="hidden px-4 py-3 text-center text-gray-600 tabular-nums lg:table-cell">{service.display_order}</td>
                      <td className="hidden px-4 py-3 text-gray-500 lg:table-cell">{dateFormat.format(new Date(service.updated_at))}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          {service.is_published && (
                            <a
                              href={`/services/${service.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Voir « ${service.title} » sur le site`}
                              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                            >
                              <ExternalLink className="size-4" />
                            </a>
                          )}
                          <Link
                            to={`/admin/services/${service.id}/modifier`}
                            aria-label={`Modifier « ${service.title} »`}
                            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-primary"
                          >
                            <Pencil className="size-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => setToDelete(service)}
                            aria-label={`Supprimer « ${service.title} »`}
                            className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination page={page} count={services.data.count} onChange={(next) => update({ page: next > 1 ? next : null })} />
        </>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Supprimer ce service ?"
        message={toDelete && `« ${toDelete.title} » sera définitivement supprimé, avec ses images et ses points forts.`}
        busy={deleting.busy}
        error={deleting.error}
        onConfirm={confirmDelete}
        onClose={() => {
          setToDelete(null);
          setDeleting({ busy: false, error: null });
        }}
      />
    </AdminPage>
  );
}
