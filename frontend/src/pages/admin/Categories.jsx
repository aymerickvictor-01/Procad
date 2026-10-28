import { FolderTree, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

import { createCategory, deleteCategory, getAdminCategories, updateCategory } from "../../api/admin";
import { errorMessage, fieldErrors } from "../../api/client";
import AdminPage from "../../components/admin/AdminPage";
import Modal, { ConfirmDialog } from "../../components/admin/Modal";
import { useToast } from "../../components/admin/Toast";
import Button from "../../components/Button";
import Field, { inputClass } from "../../components/form/Field";
import { EmptyState, ErrorState, Skeleton } from "../../components/States";
import useApi from "../../hooks/useApi";

const EMPTY = { name: "", description: "", display_order: 0 };

function CategoryModal({ category, onClose, onSaved }) {
  const [values, setValues] = useState(() =>
    category?.id ? { name: category.name, description: category.description, display_order: category.display_order } : EMPTY,
  );
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (!values.name.trim()) return setErrors({ name: "Le nom est obligatoire." });
    setSaving(true);
    try {
      const payload = { ...values, display_order: Number(values.display_order) || 0 };
      const saved = category.id ? await updateCategory(category.id, payload) : await createCategory(payload);
      onSaved(saved, Boolean(category.id));
    } catch (error) {
      const fields = fieldErrors(error);
      setErrors(Object.keys(fields).length ? fields : { name: errorMessage(error) });
      setSaving(false);
    }
  }

  const set = (name) => (event) => setValues((previous) => ({ ...previous, [name]: event.target.value }));

  return (
    <Modal
      open
      onClose={onClose}
      title={category.id ? "Modifier la catégorie" : "Nouvelle catégorie"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Annuler
          </Button>
          <Button type="submit" form="category-form" disabled={saving}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </>
      }
    >
      <form id="category-form" noValidate onSubmit={submit} className="space-y-5">
        <Field label="Nom" required error={errors.name}>
          {(props) => <input {...props} autoFocus className={inputClass} maxLength={100} value={values.name} onChange={set("name")} />}
        </Field>
        <Field label="Description" hint="Facultatif." error={errors.description}>
          {(props) => <textarea {...props} rows={3} className={`${inputClass} resize-none`} value={values.description} onChange={set("description")} />}
        </Field>
        <Field label="Ordre d'affichage" hint="Les plus petits nombres apparaissent en premier." error={errors.display_order}>
          {(props) => <input {...props} type="number" min={0} className={inputClass} value={values.display_order} onChange={set("display_order")} />}
        </Field>
      </form>
    </Modal>
  );
}

export default function AdminCategories() {
  const notify = useToast();
  const categories = useApi(getAdminCategories);
  const [editing, setEditing] = useState(null); // {} = création, objet = modification
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState({ busy: false, error: null });

  function handleSaved(category, updated) {
    setEditing(null);
    notify(updated ? "Catégorie modifiée." : "Catégorie créée.");
    categories.reload();
  }

  async function confirmDelete() {
    setDeleting({ busy: true, error: null });
    try {
      await deleteCategory(toDelete.id);
      setToDelete(null);
      setDeleting({ busy: false, error: null });
      notify("Catégorie supprimée.");
      categories.reload();
    } catch (error) {
      setDeleting({ busy: false, error: errorMessage(error) });
    }
  }

  return (
    <AdminPage
      title="Catégories"
      description="Regroupez vos services par domaine. Elles servent de filtres sur la page Services."
      actions={
        <Button onClick={() => setEditing({})}>
          <Plus className="size-4" aria-hidden="true" /> Nouvelle catégorie
        </Button>
      }
    >
      {categories.loading && !categories.data ? (
        <Skeleton className="h-48 w-full rounded-xl" />
      ) : categories.error ? (
        <ErrorState error={categories.error} onRetry={categories.reload} />
      ) : categories.data.length === 0 ? (
        <EmptyState
          title="Aucune catégorie"
          description="Créez au moins une catégorie avant d'ajouter des services."
          action={<Button onClick={() => setEditing({})}>Créer une catégorie</Button>}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card">
          <table className="w-full text-left text-[14px]">
            <thead className="border-b border-gray-200 bg-gray-50 text-[12px] font-semibold tracking-wide text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3 text-center">Services</th>
                <th className="hidden px-4 py-3 text-center sm:table-cell">Ordre</th>
                <th className="px-4 py-3 text-right">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.data.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50/70">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                        <FolderTree className="size-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-gray-900">{category.name}</p>
                        {category.description && <p className="truncate text-[13px] text-gray-500">{category.description}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Link to={`/admin/services?category=${category.id}`} className="font-semibold text-primary tabular-nums hover:underline">
                      {category.service_count}
                    </Link>
                  </td>
                  <td className="hidden px-4 py-3 text-center text-gray-600 tabular-nums sm:table-cell">{category.display_order}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button type="button" onClick={() => setEditing(category)} aria-label={`Modifier « ${category.name} »`} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-primary">
                        <Pencil className="size-4" />
                      </button>
                      <button type="button" onClick={() => setToDelete(category)} aria-label={`Supprimer « ${category.name} »`} className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && <CategoryModal category={editing} onClose={() => setEditing(null)} onSaved={handleSaved} />}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Supprimer cette catégorie ?"
        message={
          toDelete &&
          (toDelete.service_count > 0
            ? `« ${toDelete.name} » contient ${toDelete.service_count} service(s) : déplacez-les d'abord vers une autre catégorie.`
            : `« ${toDelete.name} » sera définitivement supprimée.`)
        }
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
