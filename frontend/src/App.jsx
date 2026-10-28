import { Outlet, Route, Routes } from "react-router";

import { AuthProvider } from "./context/AuthContext";
import AdminLayout from "./layouts/AdminLayout";
import PublicLayout from "./layouts/PublicLayout";
import AdminAccount from "./pages/admin/Account";
import AdminCategories from "./pages/admin/Categories";
import AdminCompany from "./pages/admin/Company";
import Dashboard from "./pages/admin/Dashboard";
import AdminLogin from "./pages/admin/Login";
import AdminMessages from "./pages/admin/Messages";
import AdminNotFound from "./pages/admin/NotFound";
import ServiceForm from "./pages/admin/ServiceForm";
import AdminServices from "./pages/admin/Services";
import AdminTestimonials from "./pages/admin/Testimonials";
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
          <Route path="services" element={<AdminServices />} />
          <Route path="services/nouveau" element={<ServiceForm />} />
          <Route path="services/:id/modifier" element={<ServiceForm />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="temoignages" element={<AdminTestimonials />} />
          <Route path="messages" element={<AdminMessages />} />
          <Route path="entreprise" element={<AdminCompany />} />
          <Route path="compte" element={<AdminAccount />} />
          <Route path="*" element={<AdminNotFound />} />
        </Route>
      </Route>

      <Route element={<PublicLayout />}>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
