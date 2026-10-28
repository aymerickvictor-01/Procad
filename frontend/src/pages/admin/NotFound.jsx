import AdminPage from "../../components/admin/AdminPage";
import Button from "../../components/Button";

export default function AdminNotFound() {
  return (
    <AdminPage title="Page introuvable">
      <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
        <p className="text-gray-600">Cette page de l'administration n'existe pas.</p>
        <Button to="/admin" variant="outline" className="mt-6">
          Retour au tableau de bord
        </Button>
      </div>
    </AdminPage>
  );
}
