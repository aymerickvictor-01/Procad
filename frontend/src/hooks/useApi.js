import { useCallback, useEffect, useState } from "react";

/**
 * Charge des données au montage et quand `deps` changent.
 * Renvoie { data, error, loading, reload, setData }. Une réponse arrivée après un changement
 * de paramètres (ou un démontage) est ignorée. `setData` modifie les données localement
 * (ex. mise à jour d'une ligne après un PATCH, sans tout recharger).
 */
export default function useApi(fetcher, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setState((previous) => ({ ...previous, error: null, loading: true }));
    fetcher()
      .then((data) => active && setState({ data, error: null, loading: false }))
      .catch((error) => active && setState({ data: null, error, loading: false }));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);
  const setData = useCallback(
    (update) => setState((previous) => ({ ...previous, data: typeof update === "function" ? update(previous.data) : update })),
    [],
  );
  return { ...state, reload, setData };
}
