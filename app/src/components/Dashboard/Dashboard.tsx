import ProtectedRoute from "../Auth/ProtectedRoute/ProtectedRoute";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div>
        <h1>Dashboard</h1>
        <p>Only visible to authenticated users</p>
      </div>
    </ProtectedRoute>
  );
}
