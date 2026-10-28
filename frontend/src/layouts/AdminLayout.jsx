import {
  Building2,
  ExternalLink,
  FolderTree,
  Inbox,
  LayoutDashboard,
  Layers,
  LogOut,
  Menu,
  MessageSquareQuote,
  UserRound,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router";

import { getStats } from "../api/admin";
import { ToastProvider } from "../components/admin/Toast";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/Logo";

const NAV = [
  { to: "/admin", label: "Tableau de bord", icon: LayoutDashboard, end: true },
  { to: "/admin/services", label: "Services", icon: Layers },
  { to: "/admin/categories", label: "Catégories", icon: FolderTree },
  { to: "/admin/temoignages", label: "Témoignages", icon: MessageSquareQuote },
  { to: "/admin/messages", label: "Messages", icon: Inbox, badge: "messages_unread" },
  { to: "/admin/entreprise", label: "Entreprise", icon: Building2 },
  { to: "/admin/compte", label: "Mon compte", icon: UserRound },
];

function Sidebar({ stats, onNavigate }) {
  return (
    <div className="flex h-full flex-col bg-night text-ink">
      <div className="border-b border-white/10 p-4" onClick={onNavigate}>
        <Logo framed to="/admin" imageClassName="h-12" className="w-full justify-center" />
        <p className="mt-3 text-center text-[11px] font-semibold tracking-[0.12em] text-ink-muted uppercase">
          Administration
        </p>
      </div>
      <nav aria-label="Administration" className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV.map(({ to, label, icon: Icon, end, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition-colors ${
                isActive ? "bg-white/10 text-white shadow-[inset_3px_0_0_var(--color-accent)]" : "text-ink-tertiary hover:bg-white/5 hover:text-white"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`size-5 ${isActive ? "text-white" : ""}`} aria-hidden="true" />
                <span className="flex-1">{label}</span>
                {badge && stats?.[badge] > 0 && (
                  <span className="rounded-md bg-accent px-2 py-0.5 text-[12px] font-bold text-white">
                    {stats[badge]}
                    <span className="sr-only"> non lus</span>
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-white/10 p-3">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium text-ink-tertiary transition-colors hover:bg-white/5 hover:text-white"
        >
          <ExternalLink className="size-5" aria-hidden="true" /> Voir le site
        </a>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();

  // Compteurs (pastille des messages non lus), rafraîchis à chaque page et à la demande.
  const refreshStats = useCallback(() => {
    getStats()
      .then(setStats)
      .catch(() => {});
  }, []);
  useEffect(() => {
    refreshStats();
  }, [pathname, refreshStats]);

  return (
    <div className="min-h-dvh bg-gray-50">
      <meta name="robots" content="noindex" />

      {/* Barre latérale fixe (ordinateur) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">
        <Sidebar stats={stats} />
      </aside>

      {/* Menu tiroir (mobile) */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu d'administration">
          <button
            type="button"
            className="absolute inset-0 bg-night/60 backdrop-blur-sm"
            aria-label="Fermer le menu"
            onClick={() => setMenuOpen(false)}
          />
          <div className="relative h-full w-72 max-w-[85vw]">
            <Sidebar stats={stats} onNavigate={() => setMenuOpen(false)} />
          </div>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-gray-200 bg-white/90 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            className="rounded-lg p-2 text-gray-700 hover:bg-gray-100 lg:hidden"
            aria-label="Ouvrir le menu"
            onClick={() => setMenuOpen(true)}
          >
            {menuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-gray-600 sm:inline">
              Connecté en tant que <strong className="font-semibold text-gray-900">{user?.username}</strong>
            </span>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-3.5 py-1.5 text-[13px] font-semibold text-gray-700 transition-colors hover:border-red-300 hover:text-red-600"
            >
              <LogOut className="size-4" aria-hidden="true" /> Déconnexion
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
          <ToastProvider>
            <Outlet context={{ stats, refreshStats }} />
          </ToastProvider>
        </main>
      </div>
    </div>
  );
}
