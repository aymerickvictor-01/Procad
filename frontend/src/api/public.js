import api from "./client";

const data = (request) => request.then((response) => response.data);

export const getCompany = () => data(api.get("/company/"));
export const getCategories = () => data(api.get("/categories/"));
export const getServices = (params = {}) => data(api.get("/services/", { params }));
export const getService = (slug) => data(api.get(`/services/${slug}/`));
export const getTestimonials = (params = {}) => data(api.get("/testimonials/", { params }));
export const sendContactMessage = (payload) => data(api.post("/contact/", payload));

/**
 * Demande de devis, avec pièces jointes éventuelles (multipart). `onProgress` reçoit un
 * pourcentage d'envoi ; délai allongé pour les connexions lentes.
 */
export function sendQuoteRequest(values, files = [], onProgress) {
  const form = new FormData();
  Object.entries({ ...values, kind: "quote" }).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") form.append(key, value);
  });
  files.forEach((file) => form.append("attachments", file));
  return data(
    api.post("/contact/", form, {
      timeout: 120000,
      onUploadProgress: (event) => event.total && onProgress?.(Math.round((event.loaded / event.total) * 100)),
    }),
  );
}
