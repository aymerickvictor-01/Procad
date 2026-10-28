import { useCallback } from "react";
import { useSearchParams } from "react-router";

/**
 * Filtres stockés dans l'URL. `update({ category: "x", page: null })` : une valeur vide retire le paramètre.
 */
export default function useUrlFilters() {
  const [params, setParams] = useSearchParams();

  const update = useCallback(
    (changes, { replace = false } = {}) =>
      setParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          Object.entries(changes).forEach(([key, value]) =>
            value === null || value === undefined || value === "" ? next.delete(key) : next.set(key, String(value)),
          );
          return next;
        },
        { replace },
      ),
    [setParams],
  );

  return [params, update];
}
