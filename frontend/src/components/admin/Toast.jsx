import { AlertCircle, CheckCircle2 } from "lucide-react";
import { createContext, useCallback, useContext, useState } from "react";

const ToastContext = createContext(() => {});

/** Notifications temporaires en bas à droite : notify("Enregistré"), notify("Erreur", "error"). */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const notify = useCallback((message, type = "success") => {
    const id = crypto.randomUUID();
    setToasts((list) => [...list, { id, message, type }]);
    setTimeout(() => setToasts((list) => list.filter((toast) => toast.id !== id)), 4000);
  }, []);

  return (
    <ToastContext value={notify}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed right-4 bottom-4 z-[70] flex flex-col gap-2">
        {toasts.map(({ id, message, type }) => (
          <div
            key={id}
            role={type === "error" ? "alert" : "status"}
            className={`pointer-events-auto flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg ${
              type === "error" ? "bg-red-600" : "bg-night"
            }`}
          >
            {type === "error" ? (
              <AlertCircle className="size-5 shrink-0" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="size-5 shrink-0 text-emerald-400" aria-hidden="true" />
            )}
            {message}
          </div>
        ))}
      </div>
    </ToastContext>
  );
}

export const useToast = () => useContext(ToastContext);
