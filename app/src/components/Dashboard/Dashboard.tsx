import ProtectedRoute from "../Auth/ProtectedRoute/ProtectedRoute";
import Logout from "../Auth/Logout/Logout";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <main>
        <h1>Dashboard</h1>
        <p>Only visible to authenticated users</p>
        <Logout />
      </main>
    </ProtectedRoute>
  );
}
