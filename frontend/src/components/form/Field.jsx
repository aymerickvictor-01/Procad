import { useId } from "react";

export const inputClass =
  "w-full rounded-xl border bg-white px-4 py-3 text-[15px] text-gray-900 transition outline-none " +
  "placeholder:text-gray-400 focus:border-primary focus:ring-4 focus:ring-primary/10 " +
  "aria-[invalid=true]:border-red-400 aria-[invalid=true]:focus:ring-red-100 border-gray-300 " +
  "disabled:bg-gray-50 disabled:text-gray-500";

/**
 * Champ de formulaire : libellé, aide, message d'erreur, avec les attributs d'accessibilité.
 * `children` reçoit les props à poser sur le contrôle : <Field>{(props) => <input {...props} />}</Field>
 */
export default function Field({ label, required, error, hint, counter, className = "", children }) {
  const id = useId();
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;

  return (
    <div className={className}>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-semibold text-gray-800">
          {label}
          {required && (
            <span className="ml-0.5 text-red-500" aria-hidden="true">
              *
            </span>
          )}
        </label>
        {counter}
      </div>
      {children({ id, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy, required })}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-[13px] text-gray-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-[13px] font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

/** Compteur de caractères (« 120 / 200 »), rouge au-delà de la limite. */
export function CharCounter({ value, max }) {
  const length = value?.length ?? 0;
  return (
    <span className={`text-[12px] tabular-nums ${length > max ? "font-semibold text-red-600" : "text-gray-400"}`}>
      {length} / {max}
    </span>
  );
}
