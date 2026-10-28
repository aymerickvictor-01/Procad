import { useEffect, useMemo, useState } from "react";

import { getCompanyAdmin, updateCompany, uploadCompanyImage } from "../../api/admin";
import { errorMessage, fieldErrors } from "../../api/client";
import AdminPage from "../../components/admin/AdminPage";
import ImagePicker from "../../components/admin/ImagePicker";
import { useToast } from "../../components/admin/Toast";
import Button from "../../components/Button";
import Field, { inputClass } from "../../components/form/Field";
import { ErrorState, Skeleton } from "../../components/States";
import { useCompany } from "../../context/CompanyContext";
import useApi from "../../hooks/useApi";

const TEXT_FIELDS = [
  "name", "slogan", "description", "about_text", "email", "phone", "whatsapp",
  "address", "city", "country", "opening_hours", "facebook_url", "linkedin_url", "instagram_url",
];

const pick = (profile) => Object.fromEntries(TEXT_FIELDS.map((key) => [key, profile[key] ?? ""]));

function Section({ title, description, children }) {
  return (
    <section className="grid gap-6 border-b border-gray-100 py-8 first:pt-0 last:border-b-0 lg:grid-cols-[240px_1fr]">
      <div>
        <h2 className="font-display text-lg font-semibold text-gray-900">{title}</h2>
        {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      </div>
      <div className="grid gap-5 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export default function AdminCompany() {
  const notify = useToast();
  const { reload: reloadCompany } = useCompany(); // en-tête, pied de page et pages publiques
  const profile = useApi(getCompanyAdmin);
  const [values, setValues] = useState(null);
  const [initial, setInitial] = useState(null);
  const [images, setImages] = useState({ logo: null, hero_image: null });
  const [busy, setBusy] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile.data) return;
    setValues(pick(profile.data));
    setInitial(pick(profile.data));
    setImages({ logo: profile.data.logo, hero_image: profile.data.hero_image });
  }, [profile.data]);

  const dirty = useMemo(() => JSON.stringify(values) !== JSON.stringify(initial), [values, initial]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const set = (name) => (event) => {
    setValues((previous) => ({ ...previous, [name]: event.target.value }));
    if (errors[name]) setErrors((previous) => ({ ...previous, [name]: undefined }));
  };

  async function submit(event) {
    event.preventDefault();
    if (!values.name.trim()) return setErrors({ name: "Le nom de l'entreprise est obligatoire." });
    setSaving(true);
    try {
      const saved = await updateCompany(values);
      setValues(pick(saved));
      setInitial(pick(saved));
      setErrors({});
      reloadCompany();
      notify("Profil de l'entreprise enregistré.");
    } catch (error) {
      setErrors(fieldErrors(error));
      notify(errorMessage(error, "Certains champs sont à corriger."), "error");
    } finally {
      setSaving(false);
    }
  }

  async function changeImage(field, file) {
    setBusy((previous) => ({ ...previous, [field]: true }));
    try {
      const saved = file ? await uploadCompanyImage(field, file) : await updateCompany({ [field]: null });
      setImages((previous) => ({ ...previous, [field]: saved[field] }));
      reloadCompany();
      notify(file ? "Image enregistrée." : "Image retirée.");
    } catch (error) {
      notify(fieldErrors(error)[field] ?? errorMessage(error), "error");
    } finally {
      setBusy((previous) => ({ ...previous, [field]: false }));
    }
  }

  if (profile.error) {
    return (
      <AdminPage title="Entreprise">
        <ErrorState error={profile.error} onRetry={profile.reload} />
      </AdminPage>
    );
  }
  if (!values) {
    return (
      <AdminPage title="Entreprise">
        <Skeleton className="h-[480px] w-full rounded-2xl" />
      </AdminPage>
    );
  }

  const text = (name, label, props = {}) => (
    <Field label={label} error={errors[name]} required={name === "name"} hint={props.hint} className={props.wide ? "sm:col-span-2" : ""}>
      {(fieldProps) =>
        props.rows ? (
          <textarea {...fieldProps} rows={props.rows} className={`${inputClass} resize-y`} value={values[name]} onChange={set(name)} placeholder={props.placeholder} />
        ) : (
          <input {...fieldProps} type={props.type ?? "text"} className={inputClass} value={values[name]} onChange={set(name)} placeholder={props.placeholder} />
        )
      }
    </Field>
  );

  return (
    <AdminPage title="Entreprise" description="Informations affichées sur l'ensemble du site : en-tête, pied de page, accueil, À propos, Contact.">
      <form noValidate onSubmit={submit} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-card sm:p-8">
        <Section title="Identité" description="Le logo remplace le logotype provisoire dans l'en-tête.">
          {text("name", "Nom de l'entreprise")}
          {text("slogan", "Slogan", { hint: "Affiché sous le nom, sur la page d'accueil." })}
          <ImagePicker label="Logo" aspect="aspect-[3/1]" value={images.logo} busy={busy.logo} onSelect={(file) => changeImage("logo", file)} onRemove={() => changeImage("logo", null)} hint="Fond transparent (PNG ou WebP) conseillé. Enregistré immédiatement." />
          <ImagePicker label="Image de bannière" value={images.hero_image} busy={busy.hero_image} onSelect={(file) => changeImage("hero_image", file)} onRemove={() => changeImage("hero_image", null)} hint="Grande image de la page d'accueil. Enregistrée immédiatement." />
        </Section>

        <Section title="Présentation">
          {text("description", "Présentation courte", { rows: 3, wide: true, hint: "Affichée sur la page d'accueil." })}
          {text("about_text", "Texte « À propos »", { rows: 8, wide: true, hint: "Texte complet de la page À propos (histoire, mission, valeurs…)." })}
        </Section>

        <Section title="Coordonnées">
          {text("email", "E-mail", { type: "email" })}
          {text("phone", "Téléphone", { type: "tel", placeholder: "+237 6 00 00 00 00" })}
          {text("whatsapp", "WhatsApp", { type: "tel", hint: "Numéro au format international, ex. +237 6…" })}
          {text("address", "Adresse")}
          {text("city", "Ville")}
          {text("country", "Pays")}
          {text("opening_hours", "Horaires d'ouverture", { rows: 3, wide: true, placeholder: "Lundi – Vendredi : 8 h – 17 h\nSamedi : 9 h – 12 h" })}
        </Section>

        <Section title="Réseaux sociaux" description="Adresses complètes, commençant par https://">
          {text("facebook_url", "Facebook", { type: "url" })}
          {text("linkedin_url", "LinkedIn", { type: "url" })}
          {text("instagram_url", "Instagram", { type: "url" })}
        </Section>

        <div className="flex items-center justify-end gap-4 border-t border-gray-100 pt-6">
          {dirty && <span className="text-[13px] text-amber-700">Modifications non enregistrées</span>}
          <Button type="submit" disabled={saving || !dirty}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </form>
    </AdminPage>
  );
}
