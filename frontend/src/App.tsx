import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import PortalLayout from './components/PortalLayout';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import ExamList from './pages/ExamList';
import CreateExam from './pages/CreateExam';
import ExamManagement from './pages/ExamManagement';
import ExamCorrection from './pages/ExamCorrection';
import EnterToken from './pages/EnterToken';
import ExamPage from './pages/ExamPage';
import ExamResult from './pages/ExamResult';
import Classes from './pages/Classes';
import Subjects from './pages/Subjects';
import Schedules from './pages/Schedules';
import Materials from './pages/Materials';
import Assignments from './pages/Assignments';
import Announcements from './pages/Announcements';
import StudentProfile from './pages/StudentProfile';
import ModulePlaceholder from './pages/ModulePlaceholder';
import StudentsAdmin from './pages/StudentsAdmin';
import TeachersAdmin from './pages/TeachersAdmin';
import TahunAjaran from './pages/TahunAjaran';
import NotFound from './pages/NotFound';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (user?.role !== 'admin') return <Navigate to="/dashboard" />;
  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route
            element={
              <PrivateRoute>
                <PortalLayout />
              </PrivateRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<StudentProfile />} />
            <Route path="/exams" element={<ExamList />} />
            <Route path="/exams/create" element={<CreateExam />} />
            <Route path="/exams/manage" element={<ExamManagement />} />
            <Route path="/correction" element={<ExamCorrection />} />
            <Route
              path="/classes"
              element={
                <AdminRoute>
                  <Classes />
                </AdminRoute>
              }
            />
            <Route
              path="/subjects"
              element={
                <AdminRoute>
                  <Subjects />
                </AdminRoute>
              }
            />
            <Route path="/schedules" element={<Schedules />} />
            <Route path="/materials" element={<Materials />} />
            <Route path="/assignments" element={<Assignments />} />
            <Route path="/announcements" element={<Announcements />} />
            <Route
              path="/students"
              element={
                <AdminRoute>
                  <StudentsAdmin />
                </AdminRoute>
              }
            />
            <Route
              path="/teachers"
              element={
                <AdminRoute>
                  <TeachersAdmin />
                </AdminRoute>
              }
            />
            <Route
              path="/tahun-ajaran"
              element={
                <AdminRoute>
                  <TahunAjaran />
                </AdminRoute>
              }
            />
            <Route
              path="/nilai"
              element={<ModulePlaceholder title="Nilai Hasil" description="Lihat hasil belajar dan penilaian" />}
            />
            <Route
              path="/absensi"
              element={<ModulePlaceholder title="Absensi" description="Riwayat kehadiran dan status kehadiran" />}
            />
            <Route
              path="/catatan"
              element={<ModulePlaceholder title="Catatan Guru" description="Catatan dan feedback dari guru" />}
            />
            <Route
              path="/arsip"
              element={<ModulePlaceholder title="Arsip" description="Dokumen dan materi yang telah diarsipkan" />}
            />
            <Route
              path="/eperpus"
              element={<ModulePlaceholder title="E-Perpus" description="Akses koleksi perpustakaan digital" />}
            />
            <Route path="/exam/enter-token" element={<EnterToken />} />
            <Route path="/exam/:token" element={<ExamPage />} />
            <Route path="/exam/:token/result" element={<ExamResult />} />
          </Route>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
