import { AlertTriangle, X } from "lucide-react";
import { useEffect, useId, useRef } from "react";

import Button from "../Button";

/**
 * Fenêtre modale basée sur <dialog> : focus piégé, Échap et clic à l'extérieur pour fermer.
 */
export default function Modal({ open, onClose, title, children, footer, size = "max-w-lg" }) {
  const ref = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => event.target === ref.current && onClose()}
      className={`m-auto w-[calc(100%-2rem)] ${size} rounded-2xl bg-white p-0 text-gray-900 shadow-2xl backdrop:bg-night/60 backdrop:backdrop-blur-sm`}
    >
      {open && (
        <div className="flex max-h-[85dvh] flex-col">
          <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-6 py-4">
            <h2 id={titleId} className="font-display text-lg font-semibold">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            >
              <X className="size-5" />
            </button>
          </div>
          <div className="overflow-y-auto px-6 py-5">{children}</div>
          {footer && <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}

/** Demande de confirmation avant une action irréversible (suppression...). */
export function ConfirmDialog({ open, title, message, confirmLabel = "Supprimer", busy, error, onConfirm, onClose }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="max-w-md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Annuler
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={busy}>
            {busy ? "Suppression…" : confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-red-50 text-red-600">
          <AlertTriangle className="size-5" aria-hidden="true" />
        </span>
        <div className="text-[15px] text-gray-600">
          <p>{message}</p>
          {error && (
            <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700">
              {error}
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}
