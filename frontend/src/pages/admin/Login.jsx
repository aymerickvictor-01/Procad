import { AlertCircle, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router";

import { errorMessage } from "../../api/client";
import Button from "../../components/Button";
import Field, { inputClass } from "../../components/form/Field";
import Logo from "../../components/Logo";
import { PhotoBackground } from "../../components/PageHero";
import { Eyebrow } from "../../components/SectionHeader";
import { useAuth } from "../../context/AuthContext";
import { useCompany } from "../../context/CompanyContext";
import { FullPageLoader } from "../../routes/ProtectedRoute";

export default function AdminLogin() {
  const { status, login } = useAuth();
  const { company } = useCompany();
  const navigate = useNavigate();
  const location = useLocation();
  const destination = location.state?.from?.pathname ?? "/admin";

  const [values, setValues] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);

  if (status === "loading") return <FullPageLoader />;
  if (status === "authenticated") return <Navigate to={destination} replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    if (!values.username.trim() || !values.password) {
      setError("Saisissez votre identifiant et votre mot de passe.");
      return;
    }
    setSending(true);
    setError(null);
    try {
      await login(values.username.trim(), values.password);
      navigate(destination, { replace: true });
    } catch (err) {
      setError(
        err.response?.status === 429
          ? "Trop de tentatives de connexion. Patientez une minute avant de réessayer."
          : errorMessage(err, "Identifiants incorrects."),
      );
      setValues((previous) => ({ ...previous, password: "" }));
    } finally {
      setSending(false);
    }
  }

  const set = (name) => (event) => setValues((previous) => ({ ...previous, [name]: event.target.value }));

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <title>{`Connexion — Administration ${company.name}`}</title>
      <meta name="robots" content="noindex" />

      {/* Panneau de marque */}
      <div className="relative isolate hidden overflow-hidden bg-night p-12 text-ink lg:flex lg:flex-col lg:justify-between">
        <PhotoBackground image="/images/fonds/accueil.jpg" />
        <Logo framed className="relative self-start" imageClassName="h-16" />
        <div className="relative">
          <Eyebrow dark>Espace d'administration</Eyebrow>
          <p className="mt-4 font-display text-4xl leading-tight font-bold tracking-[-0.03em] text-white">
            Gérez votre site en toute autonomie.
          </p>
          <p className="mt-4 max-w-md text-ink-secondary">
            Services, catégories, témoignages, messages et informations de l'entreprise : tout se modifie ici, sans
            toucher au code.
          </p>
        </div>
        <p className="relative text-sm text-ink-muted">Espace réservé aux administrateurs.</p>
      </div>

      {/* Formulaire */}
      <div className="flex flex-col justify-center bg-gray-50 px-4 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900">
            <ArrowLeft className="size-4" aria-hidden="true" /> Retour au site
          </Link>
          <Logo className="mt-8 lg:hidden" imageClassName="h-14" />
          <h1 className="mt-8 text-3xl font-bold tracking-[-0.02em] text-gray-900">Connexion</h1>
          <p className="mt-2 text-gray-600">Accédez à l'espace d'administration.</p>

          <form noValidate onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && (
              <div role="alert" className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <AlertCircle className="size-5 shrink-0" aria-hidden="true" />
                {error}
              </div>
            )}
            <Field label="Identifiant">
              {(props) => (
                <input
                  {...props}
                  className={inputClass}
                  autoComplete="username"
                  autoFocus
                  value={values.username}
                  onChange={set("username")}
                />
              )}
            </Field>
            <Field label="Mot de passe">
              {(props) => (
                <div className="relative">
                  <input
                    {...props}
                    type={showPassword ? "text" : "password"}
                    className={`${inputClass} pr-12`}
                    autoComplete="current-password"
                    value={values.password}
                    onChange={set("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    className="absolute top-1/2 right-2 -translate-y-1/2 rounded-lg p-2 text-gray-400 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              )}
            </Field>
            <Button type="submit" size="lg" className="w-full" disabled={sending}>
              {sending ? "Connexion…" : "Se connecter"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
