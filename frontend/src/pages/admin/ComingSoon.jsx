import AdminPage from "../../components/admin/AdminPage";

/** Page provisoire : développée à l'étape 4d. */
export default function AdminComingSoon({ title }) {
  return (
    <AdminPage title={title}>
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center text-gray-500">
        Cette page sera disponible à l'étape suivante.
      </div>
    </AdminPage>
  );
}
