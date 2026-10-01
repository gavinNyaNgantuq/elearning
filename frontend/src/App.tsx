import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import PortalLayout from './components/PortalLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ExamList from './pages/ExamList';
import CreateExam from './pages/CreateExam';
import EnterToken from './pages/EnterToken';
import ExamPage from './pages/ExamPage';
import ExamResult from './pages/ExamResult';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <PrivateRoute>
                <PortalLayout />
              </PrivateRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/exams" element={<ExamList />} />
            <Route path="/exams/create" element={<CreateExam />} />
            <Route path="/exam/enter-token" element={<EnterToken />} />
            <Route path="/exam/:token" element={<ExamPage />} />
            <Route path="/exam/:token/result" element={<ExamResult />} />
          </Route>
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
