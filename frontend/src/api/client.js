import axios from "axios";

/**
 * Client HTTP unique de l'application.
 * - même domaine que le site : les cookies de session sont envoyés automatiquement ;
 * - axios recopie le cookie « csrftoken » dans l'en-tête « X-CSRFToken » à chaque requête,
 *   ce qui suit aussi le changement de jeton après la connexion.
 */
const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  xsrfCookieName: "csrftoken",
  xsrfHeaderName: "X-CSRFToken",
  timeout: 15000,
});

export default api;

/** Message lisible pour une erreur d'API (réseau, 429, 500, ou `detail` renvoyé par Django). */
export function errorMessage(error, fallback = "Une erreur est survenue. Veuillez réessayer.") {
  if (!error?.response) return "Impossible de joindre le serveur. Vérifiez votre connexion.";
  const { status, data } = error.response;
  if (status === 429) return "Trop de tentatives. Merci de patienter avant de réessayer.";
  if (typeof data?.detail === "string") return data.detail;
  return fallback;
}

// Les erreurs DRF peuvent être imbriquées (ex. liste : { "features": { "0": ["..."] } }).
const flatten = (value) =>
  Array.isArray(value)
    ? value.map(flatten).join(" ")
    : value && typeof value === "object"
      ? Object.values(value).map(flatten).join(" ")
      : String(value);

/** Erreurs de validation par champ renvoyées par DRF : { champ: "message" }. */
export function fieldErrors(error) {
  const data = error?.response?.status === 400 ? error.response.data : null;
  if (!data || typeof data !== "object") return {};
  return Object.fromEntries(
    Object.entries(data)
      .filter(([key]) => key !== "detail")
      .map(([key, value]) => [key, flatten(value)]),
  );
}
