import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api, { apiErrorMessage } from '../services/api';
import BackButton from '../components/BackButton';
import './Portal.css';

interface StudentProfile {
  id: number;
  user_id: number;
  nis: string;
  class_id: number;
  class_name: string;
  major_name: string;
  username: string;
  email: string;
  phone: string | null;
}

const StudentProfile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [changePasswordMode, setChangePasswordMode] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError('');
      
      // User object only has user_id, need to fetch student record first
      // Backend GET /students returns all students with filter
      // We can use user info to construct profile, or call user endpoint
      
      // Option: Use user endpoint to get full data
      const userResponse = await api.get(`/users/${user?.id}`);
      
      if (!userResponse.data.success) {
        throw new Error('Gagal memuat data user');
      }

      const userData = userResponse.data.data;
      
      // Construct profile from user data and context
      const profileData: StudentProfile = {
        id: user?.id || 0,
        user_id: user?.id || 0,
        nis: user?.nis || '',
        class_id: 0, // Not available from user endpoint
        class_name: user?.class_name || '',
        major_name: '', // Will be empty if not in user data
        username: userData.username || user?.name || '',
        email: userData.email || user?.email || '',
        phone: userData.phone || null
      };
      
      setProfile(profileData);
      setPhone(profileData.phone || '');
    } catch (err: any) {
      const message = apiErrorMessage(err, 'Gagal memuat data profil');
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile || !user) return;

    try {
      setSaving(true);
      setError('');

      // Update nomor telepon lewat endpoint self-service
      await api.put(`/users/me/phone`, {
        phone: phone || null
      });

      alert('Profil berhasil diperbarui');
      setEditMode(false);
      fetchProfile();
    } catch (err: any) {
      const message = apiErrorMessage(err, 'Gagal memperbarui profil');
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    if (newPassword.length < 8) {
      setError('Password baru minimal 8 karakter');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password tidak cocok');
      return;
    }

    try {
      setSaving(true);
      setError('');

      await api.put(`/users/${user.id}/password`, {
        current_password: currentPassword,
        new_password: newPassword
      });

      alert('Password berhasil diubah. Silakan login kembali.');
      logout();
      navigate('/login');
    } catch (err: any) {
      const message = apiErrorMessage(err, 'Gagal mengubah password');
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setPhone(profile?.phone || '');
    setError('');
  };

  const handleCancelPassword = () => {
    setChangePasswordMode(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
  };

  if (loading) {
    return (
      <div className="portal-loading">
        <div className="loading-spinner" />
        <p>Memuat profil...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="portal-loading">
        <p className="error-message">{error || 'Data profil tidak ditemukan'}</p>
        <button onClick={() => navigate('/dashboard')} className="btn btn-md btn-primary">
          Kembali ke Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="student-dashboard">
      <BackButton />
      <section className="hero-section">
        <div className="hero-card">
          <div className="hero-content">
            <div className="hero-greeting">
              <p className="greeting-label">Profil Saya</p>
              <h1 className="greeting-name">{profile.username}</h1>
            </div>
          </div>
          <div className="hero-avatar">
            {profile.username?.charAt(0).toUpperCase()}
          </div>
        </div>
      </section>

      {error && (
        <div className="alert alert-error profile-alert">
          {error}
        </div>
      )}

      {/* Profile Information */}
      <section className="info-section">
        <div className="section-header">
          <h2 className="section-title">Informasi Profil</h2>
          {!editMode && !changePasswordMode && (
            <button 
              onClick={() => setEditMode(true)} 
              className="btn btn-md btn-secondary"
            >
              Edit Profil
            </button>
          )}
        </div>
        <div className="section-content">
          {editMode ? (
            <form onSubmit={handleUpdateProfile} className="form-container">
              <div className="form-group">
                <label className="form-label">Nama Lengkap</label>
                <input
                  type="text"
                  value={profile.username}
                  disabled
                  className="form-input"
                />
                <small className="form-hint">
                  Nama tidak dapat diubah sendiri
                </small>
              </div>

              <div className="form-group">
                <label className="form-label">NIS</label>
                <input
                  type="text"
                  value={profile.nis}
                  disabled
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Kelas</label>
                <input
                  type="text"
                  value={profile.class_name}
                  disabled
                  className="form-input"
                />
              </div>

              {profile.major_name && (
                <div className="form-group">
                  <label className="form-label">Jurusan</label>
                  <input
                    type="text"
                    value={profile.major_name}
                    disabled
                    className="form-input"
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="form-input"
                />
                <small className="form-hint">
                  Email tidak dapat diubah sendiri
                </small>
              </div>

              <div className="form-group">
                <label className="form-label">Nomor HP</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="form-input"
                  placeholder="08xxxxxxxxxx"
                />
              </div>

              <div className="form-actions">
                <button 
                  type="submit" 
                  className="btn btn-md btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
                <button 
                  type="button" 
                  onClick={handleCancelEdit}
                  className="btn btn-md btn-secondary"
                  disabled={saving}
                >
                  Batal
                </button>
              </div>
            </form>
          ) : changePasswordMode ? (
            <form onSubmit={handleChangePassword} className="form-container">
              <div className="form-group">
                <label className="form-label">Password Saat Ini *</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password Baru *</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="form-input"
                  required
                  minLength={8}
                />
                <small className="form-hint">
                  Minimal 8 karakter
                </small>
              </div>

              <div className="form-group">
                <label className="form-label">Konfirmasi Password Baru *</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="form-input"
                  required
                  minLength={8}
                />
              </div>

              <div className="form-actions">
                <button 
                  type="submit" 
                  className="btn btn-md btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Mengubah...' : 'Ubah Password'}
                </button>
                <button 
                  type="button" 
                  onClick={handleCancelPassword}
                  className="btn btn-md btn-secondary"
                  disabled={saving}
                >
                  Batal
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-display">
              <div className="profile-item">
                <span className="profile-label">Nama Lengkap</span>
                <span className="profile-value">{profile.username}</span>
              </div>

              <div className="profile-item">
                <span className="profile-label">NIS</span>
                <span className="profile-value">{profile.nis}</span>
              </div>

              <div className="profile-item">
                <span className="profile-label">Kelas</span>
                <span className="profile-value">{profile.class_name}</span>
              </div>

              {profile.major_name && (
                <div className="profile-item">
                  <span className="profile-label">Jurusan</span>
                  <span className="profile-value">{profile.major_name}</span>
                </div>
              )}

              <div className="profile-item">
                <span className="profile-label">Email</span>
                <span className="profile-value">{profile.email}</span>
              </div>

              <div className="profile-item">
                <span className="profile-label">Nomor HP</span>
                <span className="profile-value">{profile.phone || '-'}</span>
              </div>

              <div className="profile-password-toggle">
                <button 
                  onClick={() => setChangePasswordMode(true)}
                  className="btn btn-md btn-secondary"
                >
                  Ubah Password
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default StudentProfile;
