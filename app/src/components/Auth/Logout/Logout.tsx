import { useAuth } from '../AuthProvider/AuthProvider';
import { useNotification } from '../../Notification/Notification';

export default function Logout() {
  const { logout } = useAuth();
  const { notify } = useNotification();

  return (
    <button
      onClick={() => {
        logout();
        notify('You have been logged out.', 'info');
      }}
      className="px-6 py-3 bg-red-600 rounded text-white font-semibold hover:bg-red-700 transition"
    >
      Logout
    </button>
  );
}
