import { ImagePlus, LoaderCircle, Trash2 } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // identique à MAX_IMAGE_UPLOAD_SIZE côté Django

/** Vérifie un fichier avant envoi ; renvoie un message d'erreur ou null. Le serveur revérifie. */
export function checkImageFile(file) {
  if (!ACCEPTED.includes(file.type)) return "Formats acceptés : JPEG, PNG, WebP.";
  if (file.size > MAX_SIZE) return "L'image ne doit pas dépasser 5 Mo.";
  return null;
}

/**
 * Sélection d'une image avec aperçu.
 * `value` : URL de l'image actuelle (serveur) ou fichier local en attente d'envoi.
 */
export default function ImagePicker({ label, value, onSelect, onRemove, busy, error, hint, aspect = "aspect-[16/10]" }) {
  const inputId = useId();
  const inputRef = useRef(null);
  const [localError, setLocalError] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!(value instanceof File)) return setPreview(typeof value === "string" ? value : null);
    const url = URL.createObjectURL(value);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  function handleChange(event) {
    const file = event.target.files?.[0];
    event.target.value = ""; // permet de resélectionner le même fichier
    if (!file) return;
    const problem = checkImageFile(file);
    setLocalError(problem);
    if (!problem) onSelect(file);
  }

  const message = localError || error;

  return (
    <div>
      <p className="mb-1.5 text-sm font-semibold text-gray-800">{label}</p>
      <div className={`relative ${aspect} overflow-hidden rounded-xl border border-dashed border-gray-300 bg-gray-50`}>
        {preview ? (
          <img src={preview} alt="" className="size-full object-cover" />
        ) : (
          <label
            htmlFor={inputId}
            className="flex size-full cursor-pointer flex-col items-center justify-center gap-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-primary"
          >
            <ImagePlus className="size-8" aria-hidden="true" />
            <span className="text-sm font-medium">Choisir une image</span>
          </label>
        )}
        {busy && (
          <div className="absolute inset-0 grid place-items-center bg-white/70">
            <LoaderCircle className="size-7 animate-spin text-primary" aria-label="Envoi en cours" />
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={ACCEPTED.join(",")}
        className="sr-only"
        onChange={handleChange}
        disabled={busy}
      />

      {preview && (
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="rounded-full border border-gray-300 px-3 py-1 text-[13px] font-semibold text-gray-700 hover:border-primary hover:text-primary"
          >
            Remplacer
          </button>
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[13px] font-semibold text-red-600 hover:bg-red-50"
            >
              <Trash2 className="size-3.5" aria-hidden="true" /> Retirer
            </button>
          )}
        </div>
      )}
      {message ? (
        <p role="alert" className="mt-1.5 text-[13px] font-medium text-red-600">
          {message}
        </p>
      ) : (
        <p className="mt-1.5 text-[13px] text-gray-500">{hint ?? "JPEG, PNG ou WebP, 5 Mo maximum."}</p>
      )}
    </div>
  );
}
