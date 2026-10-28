import { useEffect } from "react";
import { Outlet, useLocation } from "react-router";

import Footer from "../components/Footer";
import Navbar from "../components/Navbar";

export default function PublicLayout() {
  const { pathname } = useLocation();

  // Chaque nouvelle page commence en haut.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#contenu"
        className="sr-only z-[100] rounded-full bg-primary px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Aller au contenu
      </a>
      <Navbar />
      <main id="contenu" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
