import { createContext, useCallback, useContext, useEffect, useState } from "react";

import * as auth from "../api/auth";
import api from "../api/client";

const AuthContext = createContext(null);

/**
 * Session administrateur. `status` : "loading" (vérification en cours), "authenticated" ou "anonymous".
 * Monté uniquement autour des routes /admin : le site public n'interroge jamais /api/auth/me/.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let active = true;
    auth
      .fetchCsrf()
      .then(() => auth.getMe())
      .then((me) => active && (setUser(me), setStatus("authenticated")))
      .catch(() => active && (setUser(null), setStatus("anonymous")));
    return () => {
      active = false;
    };
  }, []);

  // Session expirée pendant l'utilisation : toute réponse 401 renvoie vers la page de connexion.
  useEffect(() => {
    const id = api.interceptors.response.use(undefined, (error) => {
      const url = error.config?.url ?? "";
      if (error.response?.status === 401 && !url.startsWith("/auth/")) {
        setUser(null);
        setStatus("anonymous");
      }
      return Promise.reject(error);
    });
    return () => api.interceptors.response.eject(id);
  }, []);

  const login = useCallback(async (username, password) => {
    await auth.fetchCsrf();
    const me = await auth.login(username, password); // Django renouvelle ici le jeton CSRF
    setUser(me);
    setStatus("authenticated");
    return me;
  }, []);

  const logout = useCallback(async () => {
    try {
      await auth.logout();
    } finally {
      setUser(null);
      setStatus("anonymous");
    }
  }, []);

  return <AuthContext value={{ user, status, login, logout }}>{children}</AuthContext>;
}

export function useAuth() {
  return useContext(AuthContext);
}
