import ApplicationDashboard from '../../components/Dashboard/Dashboard';
import ProtectedRoute from '../../components/Auth/ProtectedRoute/ProtectedRoute';

export default function ApplicationDashboardPage() {
  return (
    <ProtectedRoute>
      <ApplicationDashboard />
    </ProtectedRoute>
  );
}
