import { Outlet, Route, Routes } from "react-router";

import { AuthProvider } from "./context/AuthContext";
import AdminLayout from "./layouts/AdminLayout";
import PublicLayout from "./layouts/PublicLayout";
import AdminComingSoon from "./pages/admin/ComingSoon";
import Dashboard from "./pages/admin/Dashboard";
import AdminLogin from "./pages/admin/Login";
import About from "./pages/public/About";
import Contact from "./pages/public/Contact";
import Home from "./pages/public/Home";
import { LegalNotice, PrivacyPolicy } from "./pages/public/Legal";
import NotFound from "./pages/public/NotFound";
import ServiceDetail from "./pages/public/ServiceDetail";
import Services from "./pages/public/Services";
import ProtectedRoute from "./routes/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/services" element={<Services />} />
        <Route path="/services/:slug" element={<ServiceDetail />} />
        <Route path="/a-propos" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/mentions-legales" element={<LegalNotice />} />
        <Route path="/confidentialite" element={<PrivacyPolicy />} />
      </Route>

      {/* La session n'est vérifiée que dans l'espace d'administration. */}
      <Route
        element={
          <AuthProvider>
            <Outlet />
          </AuthProvider>
        }
      >
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          {/* Étape 4d */}
          <Route path="services" element={<AdminComingSoon title="Services" />} />
          <Route path="services/nouveau" element={<AdminComingSoon title="Nouveau service" />} />
          <Route path="services/:id/modifier" element={<AdminComingSoon title="Modifier le service" />} />
          <Route path="categories" element={<AdminComingSoon title="Catégories" />} />
          <Route path="temoignages" element={<AdminComingSoon title="Témoignages" />} />
          <Route path="messages" element={<AdminComingSoon title="Messages" />} />
          <Route path="entreprise" element={<AdminComingSoon title="Entreprise" />} />
          <Route path="compte" element={<AdminComingSoon title="Mon compte" />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>

      <Route element={<PublicLayout />}>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
