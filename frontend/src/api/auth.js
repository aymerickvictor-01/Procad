import api from "./client";

const data = (request) => request.then((response) => response.data);

/** Dépose le cookie csrftoken : nécessaire avant la connexion (Django vérifie le jeton). */
export const fetchCsrf = () => data(api.get("/auth/csrf/"));
export const login = (username, password) => data(api.post("/auth/login/", { username, password }));
export const logout = () => api.post("/auth/logout/");
export const getMe = () => data(api.get("/auth/me/"));
export const changePassword = (payload) => data(api.post("/auth/change-password/", payload));
