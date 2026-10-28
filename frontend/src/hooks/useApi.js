import { useCallback, useEffect, useState } from "react";

/**
 * Charge des données au montage et quand `deps` changent.
 * Renvoie { data, error, loading, reload }. Une réponse arrivée après un changement
 * de paramètres (ou un démontage) est ignorée.
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
  return { ...state, reload };
}
