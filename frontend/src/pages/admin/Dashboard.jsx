import { ArrowRight, Building2, FileEdit, FolderTree, Inbox, Layers, MessageSquareQuote, Plus } from "lucide-react";
import { Link, useOutletContext } from "react-router";

import AdminPage from "../../components/admin/AdminPage";
import Button from "../../components/Button";
import { Skeleton } from "../../components/States";
import { useAuth } from "../../context/AuthContext";

const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" });

function StatCard({ label, value, icon: Icon, to, highlight }) {
  return (
    <Link
      to={to}
      className={`group rounded-2xl border bg-white p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover ${
        highlight ? "border-primary/30" : "border-gray-200"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className={`grid size-10 place-items-center rounded-xl ${highlight ? "bg-primary text-white" : "bg-primary/10 text-primary"}`}>
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <ArrowRight className="size-4 text-gray-300 transition-colors group-hover:text-primary" aria-hidden="true" />
      </div>
      {value === undefined ? (
        <Skeleton className="mt-4 h-8 w-12" />
      ) : (
        <p className="mt-4 font-display text-3xl font-bold tracking-[-0.02em] text-gray-900">{value}</p>
      )}
      <p className="mt-0.5 text-sm text-gray-600">{label}</p>
    </Link>
  );
}

export default function Dashboard() {
  const { stats } = useOutletContext();
  const { user } = useAuth();

  return (
    <AdminPage
      title={`Bonjour${user?.first_name ? ` ${user.first_name}` : ""} 👋`}
      description="Vue d'ensemble du site et des dernières demandes reçues."
      actions={
        <>
          <Button to="/admin/entreprise" variant="outline" size="sm">
            <Building2 className="size-4" aria-hidden="true" /> Modifier le profil
          </Button>
          <Button to="/admin/services/nouveau" size="sm">
            <Plus className="size-4" aria-hidden="true" /> Nouveau service
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Services publiés" value={stats?.services_published} icon={Layers} to="/admin/services?is_published=true" />
        <StatCard label="Brouillons" value={stats?.services_draft} icon={FileEdit} to="/admin/services?is_published=false" />
        <StatCard label="Catégories" value={stats?.categories} icon={FolderTree} to="/admin/categories" />
        <StatCard
          label="Messages non lus"
          value={stats?.messages_unread}
          icon={Inbox}
          to="/admin/messages?is_read=false"
          highlight={stats?.messages_unread > 0}
        />
        <StatCard
          label="Témoignages publiés"
          value={stats && `${stats.testimonials_published}/${stats.testimonials_total}`}
          icon={MessageSquareQuote}
          to="/admin/temoignages"
        />
      </div>

      <section className="mt-8 rounded-2xl border border-gray-200 bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-6">
          <h2 className="font-display text-lg font-semibold text-gray-900">Derniers messages</h2>
          <Link to="/admin/messages" className="text-sm font-semibold text-primary hover:underline">
            Tout voir
          </Link>
        </div>
        {!stats ? (
          <div className="space-y-3 p-6">
            {[1, 2, 3].map((n) => (
              <Skeleton key={n} className="h-10 w-full" />
            ))}
          </div>
        ) : stats.latest_messages.length === 0 ? (
          <p className="px-6 py-10 text-center text-[15px] text-gray-500">Aucun message reçu pour le moment.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {stats.latest_messages.map((message) => (
              <li key={message.id}>
                <Link
                  to={`/admin/messages?message=${message.id}`}
                  className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-gray-50 sm:px-6"
                >
                  <span
                    className={`size-2.5 shrink-0 rounded-full ${message.is_read ? "bg-gray-200" : "bg-primary"}`}
                    aria-label={message.is_read ? "Lu" : "Non lu"}
                  />
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-[15px] ${message.is_read ? "text-gray-700" : "font-semibold text-gray-900"}`}>
                      {message.subject}
                    </p>
                    <p className="truncate text-sm text-gray-500">{message.full_name}</p>
                  </div>
                  <time dateTime={message.created_at} className="hidden shrink-0 text-sm text-gray-400 sm:block">
                    {dateFormat.format(new Date(message.created_at))}
                  </time>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AdminPage>
  );
}
