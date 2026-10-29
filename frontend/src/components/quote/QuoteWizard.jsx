import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  CircleHelp,
  Hammer,
  Ruler,
  Send,
  Wrench,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";

import { errorMessage, fieldErrors } from "../../api/client";
import { sendQuoteRequest } from "../../api/public";
import { useCompany } from "../../context/CompanyContext";
import { whatsappUrl } from "../../lib/whatsapp";
import Button from "../Button";
import Field, { CharCounter, inputClass } from "../form/Field";
import WhatsAppIcon from "../WhatsAppIcon";
import FileDrop, { formatSize } from "./FileDrop";

/* --- Données du formulaire ------------------------------------------------------------ */

const STEPS = ["Votre besoin", "Votre projet", "Vos coordonnées", "Récapitulatif"];

const PROJECT_TYPES = [
  ["new", "Nouveau projet", "Construction, installation, création", Building2],
  ["renovation", "Rénovation ou modification", "Transformation d'un existant", Hammer],
  ["maintenance", "Entretien ou dépannage", "Réparation, maintenance", Wrench],
  ["study", "Étude ou conseil", "Plans, calculs, chiffrage", Ruler],
  ["other", "Autre", "Précisez dans la description", CircleHelp],
];

const TIMELINES = [
  ["urgent", "Urgent", "moins d'un mois"],
  ["1-3", "Dans 1 à 3 mois", ""],
  ["3+", "Plus de 3 mois", ""],
  ["undefined", "Pas encore défini", ""],
];

const DESCRIPTION_MIN = 20;
const DESCRIPTION_MAX = 3000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DRAFT_KEY = "procad-devis-brouillon";

// Étape où se trouve chaque champ (pour y revenir si le serveur signale une erreur).
const FIELD_STEP = {
  service: 0, project_type: 0, timeline: 0,
  city: 1, message: 1, budget: 1, attachments: 1,
  full_name: 2, phone: 2, email: 2,
};

const EMPTY = {
  service: "", project_type: "", timeline: "", city: "", message: "", budget: "",
  full_name: "", phone: "", email: "", consent: false, website: "",
};

function validateStep(step, values) {
  const errors = {};
  if (step === 0 && !values.project_type) errors.project_type = "Choisissez le type de projet.";
  if (step === 1) {
    if (!values.city.trim()) errors.city = "Indiquez la ville ou le quartier du projet.";
    if (values.message.trim().length < DESCRIPTION_MIN)
      errors.message = `Décrivez votre projet en quelques phrases (${DESCRIPTION_MIN} caractères minimum).`;
    else if (values.message.length > DESCRIPTION_MAX) errors.message = `${DESCRIPTION_MAX} caractères maximum.`;
  }
  if (step === 2) {
    if (!values.full_name.trim()) errors.full_name = "Indiquez votre nom.";
    if (values.phone.replace(/\D/g, "").length < 8) errors.phone = "Indiquez un numéro de téléphone valide.";
    if (values.email.trim() && !EMAIL_PATTERN.test(values.email.trim()))
      errors.email = "Cette adresse e-mail n'est pas valide.";
    if (!values.consent) errors.consent = "Votre accord est nécessaire pour traiter votre demande.";
  }
  return errors;
}

// Brouillon conservé pendant la visite (sauf les fichiers) : un retour en arrière ne perd rien.
function loadDraft() {
  try {
    return JSON.parse(sessionStorage.getItem(DRAFT_KEY)) ?? {};
  } catch {
    return {};
  }
}
function saveDraft(values) {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ ...values, website: "" }));
  } catch {
    /* stockage indisponible (navigation privée) : sans conséquence */
  }
}
function clearDraft() {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    /* idem */
  }
}

/* --- Éléments d'interface --------------------------------------------------------------- */

function Stepper({ step }) {
  return (
    <div>
      <ol className="flex items-center">
        {STEPS.map((label, index) => {
          const done = index < step;
          const current = index === step;
          return (
            <li key={label} className={`flex items-center ${index < STEPS.length - 1 ? "flex-1" : ""}`}>
              <span className="flex items-center gap-2.5">
                <span
                  aria-current={current ? "step" : undefined}
                  className={`grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold transition-colors duration-300 ${
                    done ? "bg-primary text-white" : current ? "bg-primary text-white ring-4 ring-primary/15" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {done ? <Check className="size-4" aria-hidden="true" /> : index + 1}
                </span>
                <span className={`hidden text-sm font-semibold lg:inline ${current ? "text-gray-900" : "text-gray-500"}`}>
                  {label}
                </span>
              </span>
              {index < STEPS.length - 1 && (
                <span className="mx-3 h-0.5 flex-1 overflow-hidden rounded bg-gray-100">
                  <span
                    className={`block h-full origin-left bg-primary transition-transform duration-500 ${done ? "scale-x-100" : "scale-x-0"}`}
                  />
                </span>
              )}
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-sm text-gray-500 lg:hidden">
        Étape {step + 1} sur {STEPS.length} — <span className="font-semibold text-gray-900">{STEPS[step]}</span>
      </p>
    </div>
  );
}

function ChoiceCard({ name, value, checked, onChange, title, hint, icon: Icon }) {
  return (
    <label
      className={`relative flex cursor-pointer gap-3 rounded-xl border p-4 transition-[border-color,background-color,box-shadow] duration-200 ${
        checked ? "border-primary bg-primary/[0.04] ring-1 ring-primary" : "border-gray-200 bg-white hover:border-primary/40"
      }`}
    >
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="sr-only" />
      {Icon && (
        <span
          className={`grid size-10 shrink-0 place-items-center rounded-lg transition-colors ${
            checked ? "bg-primary text-white" : "bg-gray-100 text-gray-600"
          }`}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>
      )}
      <span className="min-w-0">
        <span className="block text-[15px] font-semibold text-gray-900">{title}</span>
        {hint && <span className="mt-0.5 block text-[13px] text-gray-500">{hint}</span>}
      </span>
      {checked && <CheckCircle2 className="absolute top-3 right-3 size-5 text-primary" aria-hidden="true" />}
    </label>
  );
}

function FieldError({ id, error }) {
  if (!error) return null;
  return (
    <p id={id} className="mt-2 text-[13px] font-medium text-red-600">
      {error}
    </p>
  );
}

function Summary({ values, files, serviceTitle, onEdit }) {
  const projectType = PROJECT_TYPES.find(([value]) => value === values.project_type)?.[1];
  const timeline = TIMELINES.find(([value]) => value === values.timeline)?.[1];
  const groups = [
    [0, "Votre besoin", [["Service", serviceTitle || "Non précisé"], ["Type de projet", projectType], ["Délai", timeline || "Non précisé"]]],
    [1, "Votre projet", [["Lieu", values.city], ["Budget indicatif", values.budget || "Non précisé"], ["Description", values.message]]],
    [2, "Vos coordonnées", [["Nom", values.full_name], ["Téléphone", values.phone], ["E-mail", values.email || "Non renseigné"]]],
  ];
  return (
    <div className="space-y-4">
      {groups.map(([step, title, rows]) => (
        <section key={title} className="rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-bold text-gray-900">{title}</h3>
            <button type="button" onClick={() => onEdit(step)} className="text-sm font-semibold text-primary hover:underline">
              Modifier
            </button>
          </div>
          <dl className="mt-3 space-y-2 text-[14px]">
            {rows.map(([label, value]) => (
              <div key={label} className="grid gap-1 sm:grid-cols-[150px_1fr]">
                <dt className="text-gray-500">{label}</dt>
                <dd className="whitespace-pre-line text-gray-900">{value}</dd>
              </div>
            ))}
            {step === 1 && (
              <div className="grid gap-1 sm:grid-cols-[150px_1fr]">
                <dt className="text-gray-500">Fichiers joints</dt>
                <dd className="text-gray-900">
                  {files.length ? files.map((file) => `${file.name} (${formatSize(file.size)})`).join(", ") : "Aucun"}
                </dd>
              </div>
            )}
          </dl>
        </section>
      ))}
    </div>
  );
}

function Success({ result, phone, onRestart }) {
  const { company } = useCompany();
  const whatsapp = whatsappUrl(
    company.whatsapp,
    `Bonjour ${company.name}, je viens d'envoyer la demande de devis ${result.reference} depuis votre site.`,
  );
  return (
    <div className="animate-fade-up flex flex-col items-center py-8 text-center" role="status">
      <span className="grid size-16 place-items-center rounded-full bg-emerald-50 text-emerald-600">
        <CheckCircle2 className="size-8" aria-hidden="true" />
      </span>
      <h2 className="mt-5 text-2xl font-bold tracking-[-0.02em] text-gray-900">Demande envoyée</h2>
      <p className="mt-2 max-w-md text-gray-600">{result.detail}</p>
      <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 px-8 py-4">
        <p className="text-[12px] font-semibold tracking-[0.1em] text-gray-500 uppercase">Votre référence</p>
        <p className="mt-1 font-display text-3xl font-bold tracking-[0.04em] text-primary">{result.reference}</p>
      </div>
      <p className="mt-4 max-w-md text-sm text-gray-500">
        Notez-la : elle permet de retrouver votre demande. Nous vous rappelons au {phone}.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {whatsapp && (
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-[#25d366] px-5 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-[#1ebe5b]"
          >
            <WhatsAppIcon className="size-5" /> Suivre sur WhatsApp
          </a>
        )}
        <Button variant="outline" onClick={onRestart}>
          Faire une autre demande
        </Button>
      </div>
    </div>
  );
}

/* --- Formulaire -------------------------------------------------------------------------- */

export default function QuoteWizard({ services, initialService = "" }) {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState(() => {
    const draft = { ...EMPTY, ...loadDraft(), consent: false };
    return initialService ? { ...draft, service: initialService } : draft;
  });
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ state: "idle" }); // idle | sending | sent | error
  const [progress, setProgress] = useState(0);
  const heading = useRef(null);
  const firstRender = useRef(true);

  useEffect(() => saveDraft(values), [values]);

  // À chaque étape : titre focalisé (lecteurs d'écran) et haut du formulaire visible (mobile).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    heading.current?.focus({ preventScroll: true });
    heading.current?.closest("section")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  const grouped = useMemo(() => {
    const groups = new Map();
    for (const service of services) {
      const name = service.category?.name ?? "Autres";
      groups.set(name, [...(groups.get(name) ?? []), service]);
    }
    return [...groups];
  }, [services]);
  const serviceTitle = services.find((s) => s.slug === values.service)?.title;

  const set = (name) => (event) => {
    const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setValues((previous) => ({ ...previous, [name]: value }));
    if (errors[name]) setErrors((previous) => ({ ...previous, [name]: undefined }));
  };

  function next() {
    const stepErrors = validateStep(step, values);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length) {
      requestAnimationFrame(() => document.querySelector("[aria-invalid=true]")?.focus());
      return;
    }
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  }

  async function submit() {
    setStatus({ state: "sending" });
    setProgress(0);
    try {
      const { consent, ...payload } = values;
      const result = await sendQuoteRequest(payload, files, setProgress);
      clearDraft();
      setStatus({ state: "sent", result });
    } catch (error) {
      const serverErrors = fieldErrors(error);
      setErrors(serverErrors);
      const steps = Object.keys(serverErrors).map((field) => FIELD_STEP[field]).filter((s) => s !== undefined);
      if (steps.length) setStep(Math.min(...steps));
      setStatus({ state: "error", message: errorMessage(error, "Vérifiez les champs signalés puis réessayez.") });
    }
  }

  function restart() {
    setValues(EMPTY);
    setFiles([]);
    setErrors({});
    setStep(0);
    setStatus({ state: "idle" });
  }

  if (status.state === "sent") return <Success result={status.result} phone={values.phone} onRestart={restart} />;

  const sending = status.state === "sending";
  return (
    <div>
      <Stepper step={step} />

      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (step < STEPS.length - 1) next();
          else submit();
        }}
        className="mt-8"
      >
        <h2 ref={heading} tabIndex={-1} className="text-xl font-bold tracking-[-0.01em] text-gray-900 outline-none">
          {STEPS[step]}
        </h2>

        {status.state === "error" && (
          <div role="alert" className="mt-4 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="size-5 shrink-0" aria-hidden="true" />
            {status.message}
          </div>
        )}

        <div key={step} className="animate-fade-up mt-6 grid gap-6">
          {step === 0 && (
            <>
              <Field label="Service concerné" hint="Facultatif : laissez vide si vous hésitez ou si plusieurs métiers sont concernés.">
                {(props) => (
                  <select {...props} className={inputClass} value={values.service} onChange={set("service")}>
                    <option value="">Je ne sais pas / plusieurs services</option>
                    {grouped.map(([category, items]) => (
                      <optgroup key={category} label={category}>
                        {items.map((service) => (
                          <option key={service.slug} value={service.slug}>
                            {service.title}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                )}
              </Field>

              <fieldset aria-describedby={errors.project_type ? "project-type-error" : undefined}>
                <legend className="mb-3 text-sm font-semibold text-gray-800">
                  Type de projet <span className="text-red-500" aria-hidden="true">*</span>
                </legend>
                <div className="grid gap-3 sm:grid-cols-2" aria-invalid={errors.project_type ? true : undefined} tabIndex={-1}>
                  {PROJECT_TYPES.map(([value, title, hint, icon]) => (
                    <ChoiceCard
                      key={value}
                      name="project_type"
                      value={value}
                      title={title}
                      hint={hint}
                      icon={icon}
                      checked={values.project_type === value}
                      onChange={set("project_type")}
                    />
                  ))}
                </div>
                <FieldError id="project-type-error" error={errors.project_type} />
              </fieldset>

              <fieldset>
                <legend className="mb-3 text-sm font-semibold text-gray-800">Délai souhaité</legend>
                <div className="flex flex-wrap gap-2">
                  {TIMELINES.map(([value, title, hint]) => (
                    <label
                      key={value}
                      className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                        values.timeline === value
                          ? "border-primary bg-primary text-white"
                          : "border-gray-300 bg-white text-gray-700 hover:border-primary/50"
                      }`}
                    >
                      <input type="radio" name="timeline" value={value} checked={values.timeline === value} onChange={set("timeline")} className="sr-only" />
                      {title}
                      {hint && <span className={values.timeline === value ? "text-white/80" : "text-gray-400"}> ({hint})</span>}
                    </label>
                  ))}
                </div>
              </fieldset>
            </>
          )}

          {step === 1 && (
            <>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Ville ou quartier du projet" required error={errors.city}>
                  {(props) => (
                    <input {...props} className={inputClass} maxLength={120} placeholder="Ex. Yaoundé, Bastos" value={values.city} onChange={set("city")} />
                  )}
                </Field>
                <Field label="Budget indicatif" hint="Facultatif" error={errors.budget}>
                  {(props) => (
                    <input {...props} className={inputClass} maxLength={100} placeholder="Ex. 5 000 000 FCFA" value={values.budget} onChange={set("budget")} />
                  )}
                </Field>
              </div>
              <Field
                label="Décrivez votre projet"
                required
                error={errors.message}
                hint="Surface, nombre de pièces, état actuel, contraintes particulières… Plus c'est précis, plus le devis le sera."
                counter={<CharCounter value={values.message} max={DESCRIPTION_MAX} />}
              >
                {(props) => (
                  <textarea {...props} rows={6} className={`${inputClass} resize-y`} value={values.message} onChange={set("message")} />
                )}
              </Field>
              <div>
                <p className="mb-3 text-sm font-semibold text-gray-800">
                  Photos ou plans <span className="font-normal text-gray-500">(facultatif)</span>
                </p>
                <FileDrop files={files} onChange={setFiles} />
                <FieldError id="attachments-error" error={errors.attachments} />
              </div>
            </>
          )}

          {step === 2 && (
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Nom complet" required error={errors.full_name} className="sm:col-span-2">
                {(props) => (
                  <input {...props} className={inputClass} autoComplete="name" maxLength={120} value={values.full_name} onChange={set("full_name")} />
                )}
              </Field>
              <Field label="Téléphone" required error={errors.phone} hint="Nous vous rappelons à ce numéro (WhatsApp de préférence).">
                {(props) => (
                  <input {...props} type="tel" className={inputClass} autoComplete="tel" maxLength={30} placeholder="Ex. 6 95 00 00 00" value={values.phone} onChange={set("phone")} />
                )}
              </Field>
              <Field label="E-mail" hint="Facultatif : pour recevoir l'accusé de réception." error={errors.email}>
                {(props) => (
                  <input {...props} type="email" className={inputClass} autoComplete="email" value={values.email} onChange={set("email")} />
                )}
              </Field>

              {/* Champ piège invisible : seuls les robots le remplissent. */}
              <div aria-hidden="true" className="absolute -left-[9999px] h-0 overflow-hidden">
                <label htmlFor="quote-website">Site web</label>
                <input id="quote-website" tabIndex={-1} autoComplete="off" value={values.website} onChange={set("website")} />
              </div>

              <div className="sm:col-span-2">
                <label className="flex gap-3 text-sm leading-relaxed text-gray-600">
                  <input
                    type="checkbox"
                    checked={values.consent}
                    onChange={set("consent")}
                    aria-invalid={errors.consent ? true : undefined}
                    aria-describedby={errors.consent ? "quote-consent-error" : undefined}
                    className="mt-0.5 size-4 shrink-0 accent-primary"
                  />
                  <span>
                    J'accepte que ces informations soient utilisées pour établir mon devis, conformément à la{" "}
                    <Link to="/confidentialite" className="font-semibold text-primary hover:underline">
                      politique de confidentialité
                    </Link>
                    .
                  </span>
                </label>
                <FieldError id="quote-consent-error" error={errors.consent} />
              </div>
            </div>
          )}

          {step === 3 && <Summary values={values} files={files} serviceTitle={serviceTitle} onEdit={setStep} />}
        </div>

        {sending && files.length > 0 && (
          <div className="mt-6" role="status" aria-live="polite">
            <div className="flex justify-between text-[13px] text-gray-500">
              <span>Envoi des fichiers…</span>
              <span className="tabular-nums">{progress} %</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-100">
              <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
          {step > 0 ? (
            <Button type="button" variant="outline" onClick={() => setStep(step - 1)} disabled={sending}>
              <ArrowLeft className="size-4" aria-hidden="true" /> Retour
            </Button>
          ) : (
            <p className="text-[13px] text-gray-500">
              <span className="text-red-500">*</span> Champs obligatoires
            </p>
          )}
          {step < STEPS.length - 1 ? (
            <Button type="submit" size="lg">
              Continuer <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          ) : (
            <Button type="submit" size="lg" disabled={sending}>
              {sending ? "Envoi en cours…" : "Envoyer ma demande"} <Send className="size-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
