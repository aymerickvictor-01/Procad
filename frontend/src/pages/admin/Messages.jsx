import { ArrowLeft, Download, FileText, Mail, MailOpen, Phone, Reply, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router";

import { deleteMessage, getMessages, updateMessage } from "../../api/admin";
import { errorMessage } from "../../api/client";
import AdminPage from "../../components/admin/AdminPage";
import { ConfirmDialog } from "../../components/admin/Modal";
import { useToast } from "../../components/admin/Toast";
import Button from "../../components/Button";
import { formatSize } from "../../components/quote/FileDrop";
import WhatsAppIcon from "../../components/WhatsAppIcon";
import { inputClass } from "../../components/form/Field";
import Pagination from "../../components/Pagination";
import { EmptyState, ErrorState, Skeleton } from "../../components/States";
import useApi from "../../hooks/useApi";
import useDebounce from "../../hooks/useDebounce";
import useUrlFilters from "../../hooks/useUrlFilters";
import { whatsappUrl } from "../../lib/whatsapp";

const shortDate = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" });
const longDate = new Intl.DateTimeFormat("fr-FR", { dateStyle: "full", timeStyle: "short" });

const TABS = [
  ["", "Tous"],
  ["false", "Non lus"],
  ["true", "Lus"],
];

const KINDS = [
  ["", "Toutes les demandes"],
  ["quote", "Devis"],
  ["message", "Messages"],
];

// Mobile camerounais saisi sans indicatif (9 chiffres commençant par 6) : on ajoute le 237.
const clientWhatsapp = (phone, text) => {
  const digits = (phone ?? "").replace(/\D/g, "");
  return whatsappUrl(digits.length === 9 && digits.startsWith("6") ? `237${digits}` : digits, text);
};

function QuoteBadge() {
  return (
    <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[11px] font-bold tracking-wide text-primary uppercase">
      Devis
    </span>
  );
}

function Attachments({ attachments }) {
  if (!attachments.length) return null;
  const images = attachments.filter((a) => a.is_image);
  const documents = attachments.filter((a) => !a.is_image);
  return (
    <section className="mt-6">
      <h3 className="text-[12px] font-semibold tracking-wide text-gray-500 uppercase">
        Pièces jointes ({attachments.length})
      </h3>
      {images.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((image) => (
            <a
              key={image.id}
              href={`${image.url}?inline=1`}
              target="_blank"
              rel="noopener noreferrer"
              className="group block overflow-hidden rounded-lg border border-gray-200"
              title={`Ouvrir ${image.original_name}`}
            >
              <img
                src={`${image.url}?inline=1`}
                alt={image.original_name}
                loading="lazy"
                className="aspect-[4/3] w-full object-cover transition-transform group-hover:scale-105"
              />
            </a>
          ))}
        </div>
      )}
      <ul className="mt-3 space-y-2">
        {[...documents, ...images].map((file) => (
          <li key={file.id}>
            <a
              href={file.url}
              className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2.5 text-sm transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              <FileText className="size-5 shrink-0 text-gray-400" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate font-medium text-gray-900">{file.original_name}</span>
              <span className="shrink-0 text-[13px] text-gray-500">{formatSize(file.size)}</span>
              <Download className="size-4 shrink-0 text-primary" aria-hidden="true" />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function MessageDetail({ message, onToggleRead, onDelete, onBack }) {
  const replySubject = encodeURIComponent(`Re: ${message.subject} (${message.reference})`);
  const quote = message.kind === "quote";
  const whatsapp = clientWhatsapp(
    message.phone,
    `Bonjour ${message.full_name}, nous revenons vers vous au sujet de votre demande ${message.reference}.`,
  );
  const details = [
    ["Expéditeur", message.full_name],
    message.email && ["E-mail", <a key="e" href={`mailto:${message.email}`} className="text-primary hover:underline">{message.email}</a>],
    message.phone && ["Téléphone", <a key="t" href={`tel:${message.phone.replace(/\s/g, "")}`} className="text-primary hover:underline">{message.phone}</a>],
    ["Service concerné", message.service?.title ?? "—"],
    quote && ["Type de projet", message.project_type_label || "—"],
    quote && ["Lieu", message.city || "—"],
    quote && ["Délai souhaité", message.timeline_label || "Non précisé"],
    quote && ["Budget indicatif", message.budget || "Non précisé"],
  ].filter(Boolean);
  return (
    <article className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-5 py-3">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 lg:hidden">
          <ArrowLeft className="size-4" aria-hidden="true" /> Retour
        </button>
        <div className="ml-auto flex gap-1">
          <button
            type="button"
            onClick={onToggleRead}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            {message.is_read ? <Mail className="size-4" aria-hidden="true" /> : <MailOpen className="size-4" aria-hidden="true" />}
            {message.is_read ? "Marquer non lu" : "Marquer lu"}
          </button>
          <button type="button" onClick={onDelete} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
            <Trash2 className="size-4" aria-hidden="true" /> Supprimer
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          {quote && <QuoteBadge />}
          <span className="font-mono text-[13px] font-semibold text-gray-500">{message.reference}</span>
        </div>
        <h2 className="mt-1.5 text-xl font-bold tracking-[-0.01em] text-gray-900">{message.subject}</h2>
        <time dateTime={message.created_at} className="mt-1 block text-sm text-gray-500">
          {longDate.format(new Date(message.created_at))}
        </time>

        <dl className="mt-6 grid gap-4 rounded-xl bg-gray-50 p-4 text-[14px] sm:grid-cols-2">
          {details.map(([label, value]) => (
            <div key={label}>
              <dt className="text-[12px] font-semibold tracking-wide text-gray-500 uppercase">{label}</dt>
              <dd className="mt-0.5 font-semibold break-words text-gray-900">{value}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-6 text-[15px] leading-relaxed whitespace-pre-line text-gray-800">{message.message}</p>
        <Attachments attachments={message.attachments ?? []} />
      </div>

      <div className="flex flex-wrap gap-2 border-t border-gray-100 px-5 py-4">
        {whatsapp && (
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-[#25d366] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1ebe5b]"
          >
            <WhatsAppIcon className="size-4" /> Répondre sur WhatsApp
          </a>
        )}
        {message.email && (
          <Button href={`mailto:${message.email}?subject=${replySubject}`} variant={whatsapp ? "outline" : "primary"}>
            <Reply className="size-4" aria-hidden="true" /> Répondre par e-mail
          </Button>
        )}
        {message.phone && (
          <Button href={`tel:${message.phone.replace(/\s/g, "")}`} variant="outline">
            <Phone className="size-4" aria-hidden="true" /> Appeler
          </Button>
        )}
      </div>
    </article>
  );
}

export default function AdminMessages() {
  const notify = useToast();
  const { refreshStats } = useOutletContext();
  const [params, update] = useUrlFilters();
  const isRead = params.get("is_read") ?? "";
  const kind = params.get("kind") ?? "";
  const search = params.get("search") ?? "";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const selectedId = Number(params.get("message")) || null;

  const [query, setQuery] = useState(search);
  const debounced = useDebounce(query.trim());
  useEffect(() => {
    if (debounced !== search) update({ search: debounced, page: null }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const messages = useApi(
    () => getMessages({ is_read: isRead || undefined, kind: kind || undefined, search: search || undefined, page }),
    [isRead, kind, search, page],
  );
  const [selected, setSelected] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  function replaceMessage(updated) {
    messages.setData((data) => data && { ...data, results: data.results.map((m) => (m.id === updated.id ? updated : m)) });
    setSelected(updated);
  }

  async function setRead(message, value) {
    try {
      replaceMessage(await updateMessage(message.id, { is_read: value }));
      refreshStats();
    } catch (error) {
      notify(errorMessage(error), "error");
    }
  }

  // Ouvre le message demandé dans l'URL (?message=id) et le marque comme lu.
  useEffect(() => {
    if (!selectedId) return setSelected(null);
    const fromList = messages.data?.results.find((m) => m.id === selectedId);
    if (!fromList) return;
    setSelected(fromList);
    if (!fromList.is_read) setRead(fromList, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, messages.data?.results.length]);

  async function confirmDelete() {
    setDeleting(true);
    try {
      await deleteMessage(toDelete.id);
      setToDelete(null);
      update({ message: null });
      notify("Message supprimé.");
      messages.reload();
      refreshStats();
    } catch (error) {
      notify(errorMessage(error), "error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AdminPage title="Messages" description="Demandes de devis et messages envoyés depuis le site.">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <div className="flex gap-1 rounded-lg bg-gray-100 p-1" role="group" aria-label="Type de demande">
            {KINDS.map(([value, label]) => (
              <button
                key={label}
                type="button"
                aria-pressed={kind === value}
                onClick={() => update({ kind: value, page: null, message: null })}
                className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
                  kind === value ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex gap-2" role="group" aria-label="Filtrer les messages">
            {TABS.map(([value, label]) => (
              <button
                key={label}
                type="button"
                aria-pressed={isRead === value}
                onClick={() => update({ is_read: value, page: null })}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  isRead === value ? "bg-gray-900 text-white" : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-100"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="relative lg:w-72">
          <label htmlFor="message-search" className="sr-only">
            Rechercher dans les messages
          </label>
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
          <input id="message-search" type="search" placeholder="Nom, téléphone, référence…" value={query} onChange={(e) => setQuery(e.target.value)} className={`${inputClass} py-2.5 pl-11`} />
        </div>
      </div>

      {messages.loading && !messages.data ? (
        <Skeleton className="h-96 w-full rounded-xl" />
      ) : messages.error ? (
        <ErrorState error={messages.error} onRetry={messages.reload} />
      ) : messages.data.results.length === 0 ? (
        <EmptyState
          title={isRead || kind || search ? "Aucune demande ne correspond" : "Aucune demande reçue"}
          description={isRead || kind || search ? undefined : "Les demandes de devis et messages envoyés depuis le site apparaîtront ici."}
        />
      ) : (
        <div className="grid overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card lg:h-[640px] lg:grid-cols-[360px_1fr]">
          <div className={`flex min-h-0 flex-col border-gray-200 lg:border-r ${selected ? "hidden lg:flex" : "flex"}`}>
            <ul className="flex-1 divide-y divide-gray-100 overflow-y-auto">
              {messages.data.results.map((message) => (
                <li key={message.id}>
                  <button
                    type="button"
                    onClick={() => update({ message: message.id })}
                    aria-current={selected?.id === message.id ? "true" : undefined}
                    className={`flex w-full gap-3 px-4 py-3.5 text-left transition-colors ${
                      selected?.id === message.id ? "bg-primary/5" : "hover:bg-gray-50"
                    }`}
                  >
                    <span className={`mt-2 size-2 shrink-0 rounded-full ${message.is_read ? "bg-transparent" : "bg-primary"}`} aria-label={message.is_read ? undefined : "Non lu"} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className={`truncate text-[15px] ${message.is_read ? "text-gray-700" : "font-bold text-gray-900"}`}>{message.full_name}</span>
                        <time dateTime={message.created_at} className="shrink-0 text-[12px] text-gray-400">
                          {shortDate.format(new Date(message.created_at))}
                        </time>
                      </span>
                      <span className="mt-0.5 flex items-center gap-2">
                        {message.kind === "quote" && <QuoteBadge />}
                        <span className={`truncate text-sm ${message.is_read ? "text-gray-500" : "font-semibold text-gray-800"}`}>{message.subject}</span>
                      </span>
                      <span className="block truncate text-[13px] text-gray-400">{message.message}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            {messages.data.count > 12 && (
              <div className="border-t border-gray-100 px-2 pb-4 [&>nav]:mt-4">
                <Pagination page={page} count={messages.data.count} onChange={(next) => update({ page: next > 1 ? next : null, message: null })} />
              </div>
            )}
          </div>

          <div className={`min-h-0 ${selected ? "block" : "hidden lg:block"}`}>
            {selected ? (
              <MessageDetail
                message={selected}
                onToggleRead={() => setRead(selected, !selected.is_read)}
                onDelete={() => setToDelete(selected)}
                onBack={() => update({ message: null })}
              />
            ) : (
              <div className="grid h-full place-items-center p-10 text-center text-gray-400">
                <div>
                  <MailOpen className="mx-auto size-10" aria-hidden="true" />
                  <p className="mt-3 text-[15px]">Sélectionnez un message pour le lire.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Supprimer ce message ?"
        message={toDelete && `Le message de ${toDelete.full_name} (« ${toDelete.subject} ») sera définitivement supprimé.`}
        busy={deleting}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </AdminPage>
  );
}
