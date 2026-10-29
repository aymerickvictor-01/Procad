import { AlertCircle, CheckCircle2, Send } from "lucide-react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router";

import { errorMessage, fieldErrors } from "../../api/client";
import { getServices, sendContactMessage } from "../../api/public";
import Button from "../../components/Button";
import ContactCard, { contactItems } from "../../components/ContactCard";
import Container from "../../components/Container";
import Field, { CharCounter, inputClass } from "../../components/form/Field";
import PageHero from "../../components/PageHero";
import { useCompany } from "../../context/CompanyContext";
import useApi from "../../hooks/useApi";

const MESSAGE_MAX = 3000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(values) {
  const errors = {};
  if (!values.full_name.trim()) errors.full_name = "Indiquez votre nom.";
  if (!values.email.trim()) errors.email = "Indiquez votre adresse e-mail.";
  else if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = "Cette adresse e-mail n'est pas valide.";
  if (!values.subject.trim()) errors.subject = "Indiquez l'objet de votre message.";
  if (!values.message.trim()) errors.message = "Écrivez votre message.";
  else if (values.message.length > MESSAGE_MAX) errors.message = `${MESSAGE_MAX} caractères maximum.`;
  if (!values.consent) errors.consent = "Votre accord est nécessaire pour traiter votre demande.";
  return errors;
}

function emptyForm(service = "") {
  return { full_name: "", email: "", phone: "", service, subject: "", message: "", consent: false, website: "" };
}

export default function Contact() {
  const { company } = useCompany();
  const [params] = useSearchParams();
  const services = useApi(() => getServices({ page_size: 50 }));

  const [values, setValues] = useState(() => emptyForm(params.get("service") ?? ""));
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ state: "idle" }); // idle | sending | sent | error

  const set = (name) => (event) => {
    const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setValues((previous) => ({ ...previous, [name]: value }));
    if (errors[name]) setErrors((previous) => ({ ...previous, [name]: undefined }));
  };

  async function handleSubmit(event) {
    event.preventDefault();
    const clientErrors = validate(values);
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length) {
      document.querySelector("[aria-invalid=true]")?.focus();
      return;
    }

    setStatus({ state: "sending" });
    try {
      const { consent, ...payload } = values;
      const response = await sendContactMessage({ ...payload, service: values.service || null });
      setStatus({ state: "sent", message: response.detail });
      setValues(emptyForm());
    } catch (error) {
      setErrors(fieldErrors(error));
      setStatus({ state: "error", message: errorMessage(error, "Vérifiez les champs signalés puis réessayez.") });
    }
  }

  const serviceOptions = services.data?.results ?? [];
  // Sans coordonnées renseignées, la carte latérale n'apparaît pas : le formulaire prend toute la largeur.
  const hasContactCard = contactItems(company).length > 0;

  return (
    <>
      <title>{`Contact — ${company.name}`}</title>
      <meta name="description" content={`Contactez ${company.name} : demande d'information, de devis ou de rendez-vous.`} />

      <PageHero
        eyebrow="Contact"
        title="Parlons de votre projet"
        description="Une question, une demande de devis ? Remplissez le formulaire, nous vous répondons dans les meilleurs délais."
        breadcrumb={[{ to: "/", label: "Accueil" }, { label: "Contact" }]}
        image="/images/fonds/contact.jpg"
      />

      <section className="py-12 sm:py-16">
        <Container
          className={`grid items-start gap-10 lg:gap-12 ${hasContactCard ? "lg:grid-cols-[1fr_380px]" : "max-w-3xl"}`}
        >
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-card sm:p-8">
            {status.state === "sent" ? (
              <div className="flex flex-col items-center py-10 text-center" role="status">
                <span className="grid size-16 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="size-8" aria-hidden="true" />
                </span>
                <h2 className="mt-5 text-2xl font-bold tracking-[-0.02em] text-gray-900">Message envoyé</h2>
                <p className="mt-2 max-w-md text-gray-600">{status.message}</p>
                <Button variant="outline" className="mt-8" onClick={() => setStatus({ state: "idle" })}>
                  Envoyer un autre message
                </Button>
              </div>
            ) : (
              <form noValidate onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2">
                <h2 className="text-xl font-bold tracking-[-0.01em] text-gray-900 sm:col-span-2">Votre message</h2>

                {status.state === "error" && (
                  <div role="alert" className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:col-span-2">
                    <AlertCircle className="size-5 shrink-0" aria-hidden="true" />
                    {status.message}
                  </div>
                )}

                <Field label="Nom complet" required error={errors.full_name}>
                  {(props) => (
                    <input {...props} className={inputClass} autoComplete="name" maxLength={120} value={values.full_name} onChange={set("full_name")} />
                  )}
                </Field>
                <Field label="E-mail" required error={errors.email}>
                  {(props) => (
                    <input {...props} type="email" className={inputClass} autoComplete="email" value={values.email} onChange={set("email")} />
                  )}
                </Field>
                <Field label="Téléphone" hint="Facultatif" error={errors.phone}>
                  {(props) => (
                    <input {...props} type="tel" className={inputClass} autoComplete="tel" maxLength={30} value={values.phone} onChange={set("phone")} />
                  )}
                </Field>
                <Field label="Service concerné" error={errors.service}>
                  {(props) => (
                    <select {...props} className={inputClass} value={values.service} onChange={set("service")}>
                      <option value="">Aucun en particulier</option>
                      {serviceOptions.map((service) => (
                        <option key={service.slug} value={service.slug}>
                          {service.title}
                        </option>
                      ))}
                    </select>
                  )}
                </Field>
                <Field label="Objet" required error={errors.subject} className="sm:col-span-2">
                  {(props) => (
                    <input {...props} className={inputClass} maxLength={150} value={values.subject} onChange={set("subject")} />
                  )}
                </Field>
                <Field
                  label="Message"
                  required
                  error={errors.message}
                  className="sm:col-span-2"
                  counter={<CharCounter value={values.message} max={MESSAGE_MAX} />}
                >
                  {(props) => (
                    <textarea {...props} rows={7} className={`${inputClass} resize-y`} value={values.message} onChange={set("message")} />
                  )}
                </Field>

                {/* Champ piège invisible : seuls les robots le remplissent. */}
                <div aria-hidden="true" className="absolute -left-[9999px] h-0 overflow-hidden">
                  <label htmlFor="website">Site web</label>
                  <input id="website" name="website" tabIndex={-1} autoComplete="off" value={values.website} onChange={set("website")} />
                </div>

                <div className="sm:col-span-2">
                  <label className="flex gap-3 text-sm leading-relaxed text-gray-600">
                    <input
                      type="checkbox"
                      checked={values.consent}
                      onChange={set("consent")}
                      aria-invalid={errors.consent ? true : undefined}
                      aria-describedby={errors.consent ? "consent-error" : undefined}
                      className="mt-0.5 size-4 shrink-0 accent-primary"
                    />
                    <span>
                      J'accepte que les informations saisies soient utilisées pour traiter ma demande, conformément à
                      la{" "}
                      <Link to="/confidentialite" className="font-semibold text-primary hover:underline">
                        politique de confidentialité
                      </Link>
                      .
                    </span>
                  </label>
                  {errors.consent && (
                    <p id="consent-error" className="mt-1.5 text-[13px] font-medium text-red-600">
                      {errors.consent}
                    </p>
                  )}
                </div>

                <div className="flex flex-col-reverse gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[13px] text-gray-500">
                    <span className="text-red-500">*</span> Champs obligatoires
                  </p>
                  <Button type="submit" size="lg" disabled={status.state === "sending"}>
                    {status.state === "sending" ? "Envoi en cours…" : "Envoyer le message"}
                    <Send className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              </form>
            )}
          </div>

          <ContactCard company={company} title="Nos coordonnées" className="lg:sticky lg:top-28" />
        </Container>
      </section>
    </>
  );
}
