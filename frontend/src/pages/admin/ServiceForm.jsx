import { ArrowDown, ArrowLeft, ArrowUp, ImagePlus, LoaderCircle, Plus, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import {
  addServiceImage,
  createService,
  deleteServiceImage,
  getAdminCategories,
  getAdminService,
  removeServiceCover,
  updateService,
  updateServiceImage,
  uploadServiceCover,
} from "../../api/admin";
import { errorMessage, fieldErrors } from "../../api/client";
import AdminPage from "../../components/admin/AdminPage";
import ImagePicker, { checkImageFile } from "../../components/admin/ImagePicker";
import { ConfirmDialog } from "../../components/admin/Modal";
import Switch from "../../components/admin/Switch";
import { useToast } from "../../components/admin/Toast";
import Button from "../../components/Button";
import Field, { CharCounter, inputClass } from "../../components/form/Field";
import { ErrorState, Skeleton } from "../../components/States";
import useApi from "../../hooks/useApi";
import { StatusBadge } from "./Services";

const SHORT_MAX = 200;
const EMPTY = {
  title: "",
  slug: "",
  category: "",
  short_description: "",
  description: "",
  price_label: "",
  is_published: false,
  is_featured: false,
  display_order: 0,
  features: [],
};

function fromService(service) {
  return Object.fromEntries(Object.keys(EMPTY).map((key) => [key, service[key] ?? EMPTY[key]]));
}

function validate(values) {
  const errors = {};
  if (!values.title.trim()) errors.title = "Le titre est obligatoire.";
  if (!values.category) errors.category = "Choisissez une catégorie.";
  if (!values.short_description.trim()) errors.short_description = "Le résumé est obligatoire.";
  else if (values.short_description.length > SHORT_MAX) errors.short_description = `${SHORT_MAX} caractères maximum.`;
  if (!values.description.trim()) errors.description = "La description est obligatoire.";
  return errors;
}

function Card({ title, description, children }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-card sm:p-6">
      {title && <h2 className="font-display text-lg font-semibold text-gray-900">{title}</h2>}
      {description && <p className="mt-0.5 text-sm text-gray-500">{description}</p>}
      <div className={title ? "mt-5" : ""}>{children}</div>
    </section>
  );
}

/* --- Points forts : liste dynamique ------------------------------------------- */

function FeaturesEditor({ features, onChange, error }) {
  const move = (index, delta) => {
    const next = [...features];
    [next[index], next[index + delta]] = [next[index + delta], next[index]];
    onChange(next);
  };
  return (
    <div>
      {features.length === 0 && <p className="text-sm text-gray-500">Aucun point fort pour le moment.</p>}
      <ul className="space-y-2">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-2">
            <input
              aria-label={`Point fort ${index + 1}`}
              className={`${inputClass} py-2.5`}
              maxLength={200}
              value={feature}
              placeholder="Ex. Intervention sous 24 h"
              onChange={(e) => onChange(features.map((f, i) => (i === index ? e.target.value : f)))}
            />
            <div className="flex shrink-0">
              <button type="button" disabled={index === 0} onClick={() => move(index, -1)} aria-label="Monter" className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 disabled:opacity-30">
                <ArrowUp className="size-4" />
              </button>
              <button type="button" disabled={index === features.length - 1} onClick={() => move(index, 1)} aria-label="Descendre" className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 disabled:opacity-30">
                <ArrowDown className="size-4" />
              </button>
              <button type="button" onClick={() => onChange(features.filter((_, i) => i !== index))} aria-label="Supprimer ce point fort" className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600">
                <X className="size-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>
      {error && <p className="mt-2 text-[13px] font-medium text-red-600">{error}</p>}
      <Button variant="outline" size="sm" className="mt-3" onClick={() => onChange([...features, ""])}>
        <Plus className="size-4" aria-hidden="true" /> Ajouter un point fort
      </Button>
    </div>
  );
}

/* --- Galerie (après la création du service) ------------------------------------ */

function Gallery({ serviceId, images, onChange }) {
  const notify = useToast();
  const [uploading, setUploading] = useState(0);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function upload(event) {
    const files = [...(event.target.files ?? [])];
    event.target.value = "";
    let current = images;
    for (const file of files) {
      const problem = checkImageFile(file);
      if (problem) {
        notify(`${file.name} : ${problem}`, "error");
        continue;
      }
      setUploading((n) => n + 1);
      try {
        const image = await addServiceImage(serviceId, file);
        current = [...current, image];
        onChange(current);
      } catch (error) {
        notify(`${file.name} : ${fieldErrors(error).image ?? errorMessage(error)}`, "error");
      } finally {
        setUploading((n) => n - 1);
      }
    }
  }

  async function saveAlt(image, altText) {
    if (altText === image.alt_text) return;
    try {
      const updated = await updateServiceImage(serviceId, image.id, { alt_text: altText });
      onChange(images.map((i) => (i.id === updated.id ? updated : i)));
      notify("Texte alternatif enregistré.");
    } catch (error) {
      notify(errorMessage(error), "error");
    }
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      await deleteServiceImage(serviceId, toDelete.id);
      onChange(images.filter((i) => i.id !== toDelete.id));
      setToDelete(null);
      notify("Image supprimée.");
    } catch (error) {
      notify(errorMessage(error), "error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {images.map((image) => (
          <div key={image.id} className="overflow-hidden rounded-xl border border-gray-200">
            <div className="relative aspect-[4/3] bg-gray-100">
              <img src={image.image} alt={image.alt_text} className="size-full object-cover" />
              <button
                type="button"
                onClick={() => setToDelete(image)}
                aria-label="Supprimer cette image"
                className="absolute top-2 right-2 rounded-lg bg-white/90 p-1.5 text-gray-600 shadow hover:text-red-600"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
            <input
              aria-label="Texte alternatif"
              placeholder="Texte alternatif…"
              defaultValue={image.alt_text}
              maxLength={200}
              onBlur={(e) => saveAlt(image, e.target.value.trim())}
              className="w-full border-t border-gray-200 px-3 py-2 text-[13px] outline-none focus:bg-primary/5"
            />
          </div>
        ))}
        <label className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 text-gray-400 transition-colors hover:border-primary hover:text-primary">
          {uploading > 0 ? <LoaderCircle className="size-7 animate-spin" aria-hidden="true" /> : <ImagePlus className="size-7" aria-hidden="true" />}
          <span className="text-sm font-medium">{uploading > 0 ? "Envoi…" : "Ajouter des images"}</span>
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={upload} />
        </label>
      </div>
      <p className="mt-3 text-[13px] text-gray-500">
        JPEG, PNG ou WebP, 5 Mo maximum. Le texte alternatif décrit l'image (accessibilité, référencement).
      </p>
      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Supprimer cette image ?"
        message="L'image sera retirée de la galerie et supprimée du serveur."
        busy={deleting}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}

/* --- Formulaire ----------------------------------------------------------------- */

export default function ServiceForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const notify = useToast();

  const categories = useApi(getAdminCategories);
  const loaded = useApi(() => (editing ? getAdminService(id) : Promise.resolve(null)), [id]);

  const [values, setValues] = useState(EMPTY);
  const [initial, setInitial] = useState(EMPTY);
  const [cover, setCover] = useState(null); // URL (serveur) ou File (création, en attente)
  const [coverBusy, setCoverBusy] = useState(false);
  const [images, setImages] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loaded.data) return;
    const formValues = fromService(loaded.data);
    setValues(formValues);
    setInitial(formValues);
    setCover(loaded.data.cover_image);
    setImages(loaded.data.images);
  }, [loaded.data]);

  const dirty = useMemo(() => JSON.stringify(values) !== JSON.stringify(initial), [values, initial]);

  // Avertit avant de fermer l'onglet avec des modifications non enregistrées.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const set = (name) => (event) => {
    const value = event?.target ? event.target.value : event;
    setValues((previous) => ({ ...previous, [name]: value }));
    if (errors[name]) setErrors((previous) => ({ ...previous, [name]: undefined }));
  };

  async function save(publish = false) {
    const clientErrors = validate(values);
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length) {
      notify("Certains champs sont à corriger.", "error");
      return;
    }
    const payload = {
      ...values,
      features: values.features.map((f) => f.trim()).filter(Boolean),
      display_order: Number(values.display_order) || 0,
      is_published: publish || values.is_published,
    };
    if (!editing) delete payload.slug;

    setSaving(true);
    try {
      if (editing) {
        const service = await updateService(id, payload);
        const formValues = fromService(service);
        setValues(formValues);
        setInitial(formValues);
        notify(publish ? "Service enregistré et publié." : "Modifications enregistrées.");
      } else {
        const service = await createService(payload);
        if (cover instanceof File) {
          try {
            await uploadServiceCover(service.id, cover);
          } catch (error) {
            notify(`Service créé, mais l'image n'a pas pu être envoyée : ${fieldErrors(error).cover_image ?? errorMessage(error)}`, "error");
          }
        }
        setInitial(values); // évite l'avertissement de modifications non enregistrées
        notify("Service créé. Vous pouvez maintenant ajouter des images à la galerie.");
        navigate(`/admin/services/${service.id}/modifier`, { replace: true });
      }
    } catch (error) {
      setErrors(fieldErrors(error));
      notify(errorMessage(error, "Certains champs sont à corriger."), "error");
    } finally {
      setSaving(false);
    }
  }

  async function changeCover(file) {
    if (!editing) return setCover(file);
    setCoverBusy(true);
    try {
      const service = await uploadServiceCover(id, file);
      setCover(service.cover_image);
      notify("Image de couverture enregistrée.");
    } catch (error) {
      notify(fieldErrors(error).cover_image ?? errorMessage(error), "error");
    } finally {
      setCoverBusy(false);
    }
  }

  async function clearCover() {
    if (!editing) return setCover(null);
    setCoverBusy(true);
    try {
      await removeServiceCover(id);
      setCover(null);
      notify("Image de couverture retirée.");
    } catch (error) {
      notify(errorMessage(error), "error");
    } finally {
      setCoverBusy(false);
    }
  }

  function cancel() {
    if (dirty && !window.confirm("Des modifications ne sont pas enregistrées. Quitter quand même ?")) return;
    navigate("/admin/services");
  }

  if (editing && loaded.error) {
    return (
      <AdminPage title="Modifier le service">
        <ErrorState error={loaded.error} onRetry={loaded.reload} title={loaded.error.response?.status === 404 ? "Service introuvable" : undefined} />
      </AdminPage>
    );
  }
  if (editing && loaded.loading) {
    return (
      <AdminPage title="Modifier le service">
        <Skeleton className="h-96 w-full rounded-xl" />
      </AdminPage>
    );
  }

  const categoryList = categories.data ?? [];

  return (
    <AdminPage
      title={editing ? "Modifier le service" : "Nouveau service"}
      description={editing ? values.title : "Le service est enregistré en brouillon tant qu'il n'est pas publié."}
      actions={
        <Link to="/admin/services" onClick={(e) => (e.preventDefault(), cancel())} className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900">
          <ArrowLeft className="size-4" aria-hidden="true" /> Retour à la liste
        </Link>
      }
    >
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          save(false);
        }}
        className="grid items-start gap-6 lg:grid-cols-[1fr_320px]"
      >
        <div className="space-y-6">
          <Card title="Informations">
            <div className="grid gap-5">
              <Field label="Titre" required error={errors.title}>
                {(props) => <input {...props} className={inputClass} maxLength={150} value={values.title} onChange={set("title")} />}
              </Field>
              {editing && (
                <Field label="Adresse de la page (slug)" error={errors.slug} hint="Modifier le slug change l'URL publique : les anciens liens ne fonctionneront plus.">
                  {(props) => <input {...props} className={inputClass} value={values.slug} onChange={set("slug")} />}
                </Field>
              )}
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Catégorie" required error={errors.category}>
                  {(props) => (
                    <select {...props} className={inputClass} value={values.category} onChange={set("category")}>
                      <option value="">Choisir…</option>
                      {categoryList.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  )}
                </Field>
                <Field label="Prix indicatif" error={errors.price_label} hint="Ex. « À partir de 50 000 FCFA », « Sur devis »">
                  {(props) => <input {...props} className={inputClass} maxLength={100} value={values.price_label} onChange={set("price_label")} />}
                </Field>
              </div>
              {categories.data && categoryList.length === 0 && (
                <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                  Aucune catégorie n'existe encore.{" "}
                  <Link to="/admin/categories" className="font-semibold underline">
                    Créez d'abord une catégorie
                  </Link>
                  .
                </p>
              )}
              <Field
                label="Résumé"
                required
                error={errors.short_description}
                hint="Affiché sur les cartes de la liste des services."
                counter={<CharCounter value={values.short_description} max={SHORT_MAX} />}
              >
                {(props) => <textarea {...props} rows={2} className={`${inputClass} resize-none`} value={values.short_description} onChange={set("short_description")} />}
              </Field>
              <Field
                label="Description complète"
                required
                error={errors.description}
                hint="Laisser une ligne vide entre deux paragraphes. Une ligne commençant par « - » s'affiche en liste à puces."
              >
                {(props) => <textarea {...props} rows={9} className={`${inputClass} resize-y`} value={values.description} onChange={set("description")} />}
              </Field>
            </div>
          </Card>

          <Card title="Points forts" description="Éléments mis en valeur sur la page du service, dans cet ordre.">
            <FeaturesEditor features={values.features} onChange={set("features")} error={errors.features} />
          </Card>

          <Card title="Galerie d'images">
            {editing ? (
              <Gallery serviceId={id} images={images} onChange={setImages} />
            ) : (
              <p className="text-sm text-gray-500">Enregistrez d'abord le service pour pouvoir ajouter des images à sa galerie.</p>
            )}
          </Card>
        </div>

        <div className="space-y-6 lg:sticky lg:top-24">
          <Card>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-800">Statut</p>
              <StatusBadge published={values.is_published} />
            </div>
            <div className="mt-5 space-y-4">
              <Switch label="Publié" description="Visible sur le site public." checked={values.is_published} onChange={set("is_published")} />
              <Switch label="Mis en avant" description="Affiché sur la page d'accueil." checked={values.is_featured} onChange={set("is_featured")} />
              <Field label="Ordre d'affichage" hint="Les plus petits nombres apparaissent en premier." error={errors.display_order}>
                {(props) => <input {...props} type="number" min={0} className={inputClass} value={values.display_order} onChange={set("display_order")} />}
              </Field>
            </div>
            <div className="mt-6 grid gap-2 border-t border-gray-100 pt-5">
              <Button type="submit" disabled={saving}>
                {saving ? "Enregistrement…" : "Enregistrer"}
              </Button>
              {!values.is_published && (
                <Button variant="outline" disabled={saving} onClick={() => save(true)}>
                  Enregistrer et publier
                </Button>
              )}
              <Button variant="ghost" disabled={saving} onClick={cancel}>
                Annuler
              </Button>
              {dirty && <p className="text-center text-[13px] text-amber-700">Modifications non enregistrées</p>}
            </div>
          </Card>

          <Card>
            <ImagePicker
              label="Image de couverture"
              value={cover}
              busy={coverBusy}
              onSelect={changeCover}
              onRemove={clearCover}
              hint={editing ? undefined : "Envoyée à l'enregistrement du service. JPEG, PNG ou WebP, 5 Mo max."}
            />
          </Card>
        </div>
      </form>
    </AdminPage>
  );
}
