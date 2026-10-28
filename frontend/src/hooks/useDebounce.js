import { useEffect, useState } from "react";

/** Renvoie `value` une fois qu'elle n'a plus changé pendant `delay` ms (ex. saisie de recherche). */
export default function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
