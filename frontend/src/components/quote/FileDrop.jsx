import { FileText, ImagePlus, X } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";

// Limites identiques à celles du serveur (settings.CONTACT_ATTACHMENTS_*).
export const MAX_FILES = 5;
const MAX_SIZE = 10 * 1024 * 1024;
const MAX_TOTAL = 20 * 1024 * 1024;
const ACCEPT = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export const formatSize = (bytes) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} Ko` : `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} Mo`;

/** Vérifie les fichiers ajoutés ; renvoie { accepted, error }. */
function check(current, added) {
  const accepted = [];
  let error = "";
  for (const file of added) {
    if (!ACCEPT.includes(file.type)) error = `« ${file.name} » : formats acceptés JPEG, PNG, WebP ou PDF.`;
    else if (file.size > MAX_SIZE) error = `« ${file.name} » dépasse 10 Mo.`;
    else if (current.length + accepted.length >= MAX_FILES) error = `${MAX_FILES} fichiers maximum.`;
    else if ([...current, ...accepted, file].reduce((sum, f) => sum + f.size, 0) > MAX_TOTAL)
      error = "20 Mo maximum au total.";
    else accepted.push(file);
  }
  return { accepted, error };
}

function Preview({ file, onRemove }) {
  const url = useMemo(() => (file.type.startsWith("image/") ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => url && URL.revokeObjectURL(url), [url]);

  return (
    <li className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-2.5 pr-3">
      <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-gray-100 text-gray-500">
        {url ? <img src={url} alt="" className="size-full object-cover" /> : <FileText className="size-6" aria-hidden="true" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-gray-900">{file.name}</span>
        <span className="text-[13px] text-gray-500">{formatSize(file.size)}</span>
      </span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Retirer ${file.name}`}
        className="grid size-9 place-items-center rounded-lg text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </li>
  );
}

/** Zone d'ajout de photos et de plans (glisser-déposer ou sélection), avec aperçus. */
export default function FileDrop({ files, onChange }) {
  const id = useId();
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  function add(list) {
    const { accepted, error: message } = check(files, Array.from(list));
    setError(message);
    if (accepted.length) onChange([...files, ...accepted]);
  }

  const full = files.length >= MAX_FILES;
  return (
    <div>
      <label
        htmlFor={id}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          add(event.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed px-6 py-7 text-center transition-colors ${
          dragging ? "border-primary bg-primary/5" : "border-gray-300 bg-gray-50 hover:border-primary/50 hover:bg-primary/[0.03]"
        } ${full ? "pointer-events-none opacity-60" : ""}`}
      >
        <span className="grid size-12 place-items-center rounded-full bg-white text-primary shadow-card">
          <ImagePlus className="size-6" aria-hidden="true" />
        </span>
        <span className="mt-3 text-[15px] font-semibold text-gray-900">
          {full ? "Nombre maximum de fichiers atteint" : "Ajouter des photos ou des plans"}
        </span>
        <span className="mt-1 text-[13px] text-gray-500">
          Glissez vos fichiers ici ou touchez pour choisir — JPEG, PNG, WebP ou PDF, {MAX_FILES} fichiers, 20 Mo au total
        </span>
        <input
          id={id}
          type="file"
          multiple
          accept={ACCEPT.join(",")}
          className="sr-only"
          disabled={full}
          onChange={(event) => {
            add(event.target.files);
            event.target.value = ""; // permet de rajouter le même fichier après l'avoir retiré
          }}
        />
      </label>
      {error && (
        <p role="alert" className="mt-2 text-[13px] font-medium text-red-600">
          {error}
        </p>
      )}
      {files.length > 0 && (
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {files.map((file, index) => (
            <Preview
              key={`${file.name}-${file.size}-${file.lastModified}`}
              file={file}
              onRemove={() => {
                setError("");
                onChange(files.filter((_, i) => i !== index));
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
