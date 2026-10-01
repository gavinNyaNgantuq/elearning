import { useAuth } from '../contexts/AuthContext';
import StudentPortal from './StudentPortal';
import TeacherPortal from './TeacherPortal';
import AdminPortal from './AdminPortal';

export default function Dashboard() {
  const { user } = useAuth();

  if (user?.role === 'siswa') {
    return <StudentPortal />;
  }

  if (user?.role === 'guru') {
    return <TeacherPortal />;
  }

  if (user?.role === 'admin') {
    return <AdminPortal />;
  }

  return null;
}
