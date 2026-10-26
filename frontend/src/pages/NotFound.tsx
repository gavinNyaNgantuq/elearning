import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function NotFound() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleBack = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="notfound-page">
      <div className="notfound-card">
        <div className="notfound-code" aria-hidden="true">404</div>
        <h1 className="notfound-title">Halaman Tidak Ditemukan</h1>
        <p className="notfound-desc">
          Halaman yang kamu cari tidak ada atau sudah dipindahkan.
        </p>
        <button type="button" className="notfound-btn" onClick={handleBack}>
          {isAuthenticated ? 'Kembali ke Dashboard' : 'Ke Halaman Login'}
        </button>
      </div>
    </div>
  );
}
