import { AlertCircle, Inbox, RotateCw } from "lucide-react";

import { errorMessage } from "../api/client";
import Button from "./Button";

/** Bloc gris animé utilisé pour les squelettes de chargement. */
export function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-lg bg-gray-200/80 ${className}`} />;
}

export function ErrorState({ error, onRetry, title = "Chargement impossible" }) {
  return (
    <div role="alert" className="flex flex-col items-center rounded-2xl border border-red-100 bg-red-50/60 px-6 py-12 text-center">
      <AlertCircle className="size-8 text-red-500" aria-hidden="true" />
      <p className="mt-3 font-display text-lg font-semibold text-gray-900">{title}</p>
      <p className="mt-1 text-[15px] text-gray-600">{errorMessage(error)}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-5" onClick={onRetry}>
          <RotateCw className="size-4" aria-hidden="true" /> Réessayer
        </Button>
      )}
    </div>
  );
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-300 bg-gray-50/60 px-6 py-14 text-center">
      <Inbox className="size-8 text-gray-400" aria-hidden="true" />
      <p className="mt-3 font-display text-lg font-semibold text-gray-900">{title}</p>
      {description && <p className="mt-1 max-w-md text-[15px] text-gray-600">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
