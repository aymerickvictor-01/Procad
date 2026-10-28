import api from "./client";

const data = (request) => request.then((response) => response.data);

/** Convertit un objet en FormData (envoi de fichiers). `null` = retirer l'image. */
function toFormData(values) {
  const form = new FormData();
  Object.entries(values).forEach(([key, value]) => {
    if (value === undefined) return;
    form.append(key, value === null ? "" : value);
  });
  return form;
}

export const getStats = () => data(api.get("/admin/stats/"));

// Profil de l'entreprise
export const getCompanyAdmin = () => data(api.get("/admin/company/"));
export const updateCompany = (values) => data(api.patch("/admin/company/", values));
export const uploadCompanyImage = (field, file) => data(api.patch("/admin/company/", toFormData({ [field]: file })));

// Catégories
export const getAdminCategories = () => data(api.get("/admin/categories/"));
export const createCategory = (values) => data(api.post("/admin/categories/", values));
export const updateCategory = (id, values) => data(api.patch(`/admin/categories/${id}/`, values));
export const deleteCategory = (id) => api.delete(`/admin/categories/${id}/`);

// Services
export const getAdminServices = (params = {}) => data(api.get("/admin/services/", { params }));
export const getAdminService = (id) => data(api.get(`/admin/services/${id}/`));
export const createService = (values) => data(api.post("/admin/services/", values));
export const updateService = (id, values) => data(api.patch(`/admin/services/${id}/`, values));
export const deleteService = (id) => api.delete(`/admin/services/${id}/`);
export const uploadServiceCover = (id, file) =>
  data(api.patch(`/admin/services/${id}/`, toFormData({ cover_image: file })));
export const removeServiceCover = (id) => data(api.patch(`/admin/services/${id}/`, { cover_image: null }));

// Galerie
export const addServiceImage = (serviceId, file, altText = "") =>
  data(api.post(`/admin/services/${serviceId}/images/`, toFormData({ image: file, alt_text: altText })));
export const updateServiceImage = (serviceId, imageId, values) =>
  data(api.patch(`/admin/services/${serviceId}/images/${imageId}/`, values));
export const deleteServiceImage = (serviceId, imageId) => api.delete(`/admin/services/${serviceId}/images/${imageId}/`);

// Témoignages
export const getAdminTestimonials = (params = {}) => data(api.get("/admin/testimonials/", { params }));
export const createTestimonial = (values) => data(api.post("/admin/testimonials/", values));
export const updateTestimonial = (id, values) => data(api.patch(`/admin/testimonials/${id}/`, values));
export const uploadTestimonialPhoto = (id, file) =>
  data(api.patch(`/admin/testimonials/${id}/`, toFormData({ photo: file })));
export const deleteTestimonial = (id) => api.delete(`/admin/testimonials/${id}/`);

// Messages
export const getMessages = (params = {}) => data(api.get("/admin/messages/", { params }));
export const updateMessage = (id, values) => data(api.patch(`/admin/messages/${id}/`, values));
export const deleteMessage = (id) => api.delete(`/admin/messages/${id}/`);
