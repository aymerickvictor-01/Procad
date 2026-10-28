import { Pencil, Plus, Star, Trash2 } from "lucide-react";
import { useState } from "react";

import {
  createTestimonial,
  deleteTestimonial,
  getAdminServices,
  getAdminTestimonials,
  updateTestimonial,
  uploadTestimonialPhoto,
} from "../../api/admin";
import { errorMessage, fieldErrors } from "../../api/client";
import AdminPage from "../../components/admin/AdminPage";
import ImagePicker from "../../components/admin/ImagePicker";
import Modal, { ConfirmDialog } from "../../components/admin/Modal";
import Switch from "../../components/admin/Switch";
import { useToast } from "../../components/admin/Toast";
import Button from "../../components/Button";
import Field, { inputClass } from "../../components/form/Field";
import Pagination from "../../components/Pagination";
import { EmptyState, ErrorState, Skeleton } from "../../components/States";
import { Stars } from "../../components/TestimonialCard";
import useApi from "../../hooks/useApi";
import useUrlFilters from "../../hooks/useUrlFilters";

const EMPTY = { author_name: "", author_role: "", content: "", rating: "", service: "", is_published: false };

function RatingInput({ value, onChange }) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Note">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={Number(value) === n}
          aria-label={`${n} sur 5`}
          onClick={() => onChange(Number(value) === n ? "" : n)}
          className="rounded p-0.5"
        >
          <Star className={`size-7 transition-colors ${n <= Number(value) ? "fill-amber-400 text-amber-400" : "text-gray-300 hover:text-amber-300"}`} />
        </button>
      ))}
      <span className="ml-2 text-sm text-gray-500">{value ? `${value}/5` : "Sans note"}</span>
    </div>
  );
}

function TestimonialModal({ testimonial, services, onClose, onSaved }) {
  const editing = Boolean(testimonial.id);
  const [values, setValues] = useState(() =>
    editing
      ? {
          author_name: testimonial.author_name,
          author_role: testimonial.author_role,
          content: testimonial.content,
          rating: testimonial.rating ?? "",
          service: testimonial.service ?? "",
          is_published: testimonial.is_published,
        }
      : EMPTY,
  );
  const [photo, setPhoto] = useState(testimonial.photo ?? null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (name) => (event) => setValues((previous) => ({ ...previous, [name]: event?.target ? event.target.value : event }));

  async function submit(event) {
    event.preventDefault();
    const clientErrors = {};
    if (!values.author_name.trim()) clientErrors.author_name = "Le nom du client est obligatoire.";
    if (!values.content.trim()) clientErrors.content = "Le texte du témoignage est obligatoire.";
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length) return;

    setSaving(true);
    try {
      const payload = { ...values, rating: values.rating || null, service: values.service || null };
      if (editing && photo === null && testimonial.photo) payload.photo = null; // photo retirée
      let saved = editing ? await updateTestimonial(testimonial.id, payload) : await createTestimonial(payload);
      if (photo instanceof File) saved = await uploadTestimonialPhoto(saved.id, photo);
      onSaved(editing);
    } catch (error) {
      setErrors(fieldErrors(error));
      if (!Object.keys(fieldErrors(error)).length) setErrors({ content: errorMessage(error) });
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      size="max-w-2xl"
      onClose={onClose}
      title={editing ? "Modifier le témoignage" : "Nouveau témoignage"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Annuler
          </Button>
          <Button type="submit" form="testimonial-form" disabled={saving}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </>
      }
    >
      <form id="testimonial-form" noValidate onSubmit={submit} className="grid gap-5 sm:grid-cols-[1fr_160px]">
        <div className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Nom du client" required error={errors.author_name}>
              {(props) => <input {...props} autoFocus className={inputClass} maxLength={120} value={values.author_name} onChange={set("author_name")} />}
            </Field>
            <Field label="Fonction ou entreprise" error={errors.author_role}>
              {(props) => <input {...props} className={inputClass} maxLength={120} value={values.author_role} onChange={set("author_role")} />}
            </Field>
          </div>
          <Field label="Témoignage" required error={errors.content}>
            {(props) => <textarea {...props} rows={5} className={`${inputClass} resize-y`} value={values.content} onChange={set("content")} />}
          </Field>
          <div>
            <p className="mb-1.5 text-sm font-semibold text-gray-800">Note</p>
            <RatingInput value={values.rating} onChange={set("rating")} />
            {errors.rating && <p className="mt-1.5 text-[13px] font-medium text-red-600">{errors.rating}</p>}
          </div>
          <Field label="Service concerné" hint="Le témoignage s'affichera aussi sur la page de ce service." error={errors.service}>
            {(props) => (
              <select {...props} className={inputClass} value={values.service} onChange={set("service")}>
                <option value="">Aucun</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.title}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Switch label="Publié" description="Visible sur le site public." checked={values.is_published} onChange={set("is_published")} />
        </div>
        <ImagePicker label="Photo" aspect="aspect-square" value={photo} onSelect={setPhoto} onRemove={() => setPhoto(null)} error={errors.photo} hint="Facultative." />
      </form>
    </Modal>
  );
}

export default function AdminTestimonials() {
  const notify = useToast();
  const [params, update] = useUrlFilters();
  const published = params.get("is_published") ?? "";
  const page = Math.max(1, Number(params.get("page")) || 1);

  const testimonials = useApi(() => getAdminTestimonials({ is_published: published || undefined, page }), [published, page]);
  const services = useApi(() => getAdminServices({ page_size: 50 }));
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function togglePublished(testimonial) {
    try {
      const updated = await updateTestimonial(testimonial.id, { is_published: !testimonial.is_published });
      testimonials.setData((data) => ({ ...data, results: data.results.map((t) => (t.id === updated.id ? updated : t)) }));
      notify(updated.is_published ? "Témoignage publié." : "Témoignage masqué.");
    } catch (error) {
      notify(errorMessage(error), "error");
    }
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      await deleteTestimonial(toDelete.id);
      setToDelete(null);
      notify("Témoignage supprimé.");
      testimonials.reload();
    } catch (error) {
      notify(errorMessage(error), "error");
    } finally {
      setDeleting(false);
    }
  }

  const tabs = [
    ["", "Tous"],
    ["true", "Publiés"],
    ["false", "Masqués"],
  ];

  return (
    <AdminPage
      title="Témoignages"
      description="Avis de clients affichés sur l'accueil et sur les pages de service."
      actions={
        <Button onClick={() => setEditing({})}>
          <Plus className="size-4" aria-hidden="true" /> Nouveau témoignage
        </Button>
      }
    >
      <div className="mb-5 flex gap-2" role="group" aria-label="Filtrer par statut">
        {tabs.map(([value, label]) => (
          <button
            key={label}
            type="button"
            aria-pressed={published === value}
            onClick={() => update({ is_published: value, page: null })}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              published === value ? "bg-gray-900 text-white" : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-100"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {testimonials.loading && !testimonials.data ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((n) => (
            <Skeleton key={n} className="h-44 rounded-2xl" />
          ))}
        </div>
      ) : testimonials.error ? (
        <ErrorState error={testimonials.error} onRetry={testimonials.reload} />
      ) : testimonials.data.results.length === 0 ? (
        <EmptyState
          title="Aucun témoignage"
          description="Ajoutez les avis de vos clients pour rassurer les visiteurs."
          action={<Button onClick={() => setEditing({})}>Ajouter un témoignage</Button>}
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {testimonials.data.results.map((testimonial) => (
              <article key={testimonial.id} className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-card">
                <div className="flex items-start gap-3">
                  {testimonial.photo ? (
                    <img src={testimonial.photo} alt="" className="size-11 rounded-full object-cover" />
                  ) : (
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary/10 font-bold text-primary">
                      {testimonial.author_name.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-gray-900">{testimonial.author_name}</p>
                    <p className="truncate text-[13px] text-gray-500">{testimonial.author_role || "—"}</p>
                  </div>
                  <Switch label={testimonial.is_published ? "Publié" : "Masqué"} checked={testimonial.is_published} onChange={() => togglePublished(testimonial)} />
                </div>
                <Stars rating={testimonial.rating} className="mt-4" />
                <p className="mt-2 line-clamp-3 flex-1 text-[15px] text-gray-700">« {testimonial.content} »</p>
                <div className="mt-4 flex items-center justify-between gap-3 border-t border-gray-100 pt-3">
                  <span className="truncate text-[13px] text-gray-500">{testimonial.service_title ? `Service : ${testimonial.service_title}` : "Aucun service lié"}</span>
                  <div className="flex shrink-0 gap-1">
                    <button type="button" onClick={() => setEditing(testimonial)} aria-label={`Modifier le témoignage de ${testimonial.author_name}`} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-primary">
                      <Pencil className="size-4" />
                    </button>
                    <button type="button" onClick={() => setToDelete(testimonial)} aria-label={`Supprimer le témoignage de ${testimonial.author_name}`} className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <Pagination page={page} count={testimonials.data.count} onChange={(next) => update({ page: next > 1 ? next : null })} />
        </>
      )}

      {editing && (
        <TestimonialModal
          testimonial={editing}
          services={services.data?.results ?? []}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            setEditing(null);
            notify(updated ? "Témoignage modifié." : "Témoignage créé.");
            testimonials.reload();
          }}
        />
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Supprimer ce témoignage ?"
        message={toDelete && `Le témoignage de ${toDelete.author_name} sera définitivement supprimé.`}
        busy={deleting}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </AdminPage>
  );
}
