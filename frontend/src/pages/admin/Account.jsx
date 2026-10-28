import { CheckCircle2, Circle, ExternalLink } from "lucide-react";
import { useState } from "react";

import { changePassword } from "../../api/auth";
import { errorMessage, fieldErrors } from "../../api/client";
import AdminPage from "../../components/admin/AdminPage";
import { useToast } from "../../components/admin/Toast";
import Button from "../../components/Button";
import Field, { inputClass } from "../../components/form/Field";
import { useAuth } from "../../context/AuthContext";

const EMPTY = { old_password: "", new_password: "", confirm: "" };

// Règles indicatives ; le serveur applique les validateurs Django (y compris « mot de passe trop courant »).
const RULES = [
  { label: "Au moins 8 caractères", test: (value) => value.length >= 8 },
  { label: "Pas uniquement des chiffres", test: (value) => value.length > 0 && !/^\d+$/.test(value) },
  { label: "Différent de l'actuel", test: (value, values) => value.length > 0 && value !== values.old_password },
];

export default function AdminAccount() {
  const { user } = useAuth();
  const notify = useToast();
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (name) => (event) => {
    setValues((previous) => ({ ...previous, [name]: event.target.value }));
    if (errors[name]) setErrors((previous) => ({ ...previous, [name]: undefined }));
  };

  async function submit(event) {
    event.preventDefault();
    const clientErrors = {};
    if (!values.old_password) clientErrors.old_password = "Saisissez votre mot de passe actuel.";
    if (!values.new_password) clientErrors.new_password = "Saisissez un nouveau mot de passe.";
    if (values.confirm !== values.new_password) clientErrors.confirm = "Les deux mots de passe ne correspondent pas.";
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length) return;

    setSaving(true);
    try {
      await changePassword({ old_password: values.old_password, new_password: values.new_password });
      setValues(EMPTY);
      notify("Mot de passe modifié.");
    } catch (error) {
      const fields = fieldErrors(error);
      setErrors(fields);
      if (!Object.keys(fields).length) notify(errorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  }

  const password = (name, label, autoComplete) => (
    <Field label={label} required error={errors[name]}>
      {(props) => <input {...props} type="password" autoComplete={autoComplete} className={inputClass} value={values[name]} onChange={set(name)} />}
    </Field>
  );

  return (
    <AdminPage title="Mon compte" description={`Connecté en tant que ${user?.username}.`}>
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
        <form noValidate onSubmit={submit} className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-card sm:p-8">
          <h2 className="font-display text-lg font-semibold text-gray-900">Changer le mot de passe</h2>
          {password("old_password", "Mot de passe actuel", "current-password")}
          {password("new_password", "Nouveau mot de passe", "new-password")}
          <ul className="space-y-1.5 text-[13px]" aria-label="Règles du mot de passe">
            {RULES.map((rule) => {
              const ok = rule.test(values.new_password, values);
              return (
                <li key={rule.label} className={`flex items-center gap-2 ${ok ? "text-emerald-700" : "text-gray-500"}`}>
                  {ok ? <CheckCircle2 className="size-4" aria-hidden="true" /> : <Circle className="size-4" aria-hidden="true" />}
                  {rule.label}
                </li>
              );
            })}
            <li className="flex items-center gap-2 text-gray-500">
              <Circle className="size-4" aria-hidden="true" /> Pas trop proche de votre identifiant, ni trop courant
            </li>
          </ul>
          {password("confirm", "Confirmer le nouveau mot de passe", "new-password")}
          <div className="flex justify-end border-t border-gray-100 pt-5">
            <Button type="submit" disabled={saving}>
              {saving ? "Enregistrement…" : "Modifier le mot de passe"}
            </Button>
          </div>
        </form>

        <aside className="rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-600 shadow-card sm:p-6">
          <h2 className="font-display text-base font-semibold text-gray-900">Autres administrateurs</h2>
          <p className="mt-2 leading-relaxed">
            La création de comptes administrateurs se fait depuis l'interface d'administration de Django (comptes
            « membre du personnel »).
          </p>
          <Button href="/django-admin/auth/user/" target="_blank" rel="noopener noreferrer" variant="outline" size="sm" className="mt-4">
            Gérer les comptes <ExternalLink className="size-4" aria-hidden="true" />
          </Button>
        </aside>
      </div>
    </AdminPage>
  );
}
