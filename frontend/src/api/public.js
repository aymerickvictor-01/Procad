import api from "./client";

const data = (request) => request.then((response) => response.data);

export const getCompany = () => data(api.get("/company/"));
export const getCategories = () => data(api.get("/categories/"));
export const getServices = (params = {}) => data(api.get("/services/", { params }));
export const getService = (slug) => data(api.get(`/services/${slug}/`));
export const getTestimonials = (params = {}) => data(api.get("/testimonials/", { params }));
export const sendContactMessage = (payload) => data(api.post("/contact/", payload));
