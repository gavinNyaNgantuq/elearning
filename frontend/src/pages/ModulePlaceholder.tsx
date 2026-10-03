import BackButton from '../components/BackButton';
import './ModulePlaceholder.css';

interface ModulePlaceholderProps {
  title: string;
  description?: string;
}

/**
 * Placeholder untuk modul yang menu/entry-nya sudah ada
 * di portal tetapi halamannya belum dibangun.
 * Menampilkan EmptyState yang rapi alih-alih halaman kosong.
 */
export default function ModulePlaceholder({
  title,
  description = 'Modul ini sedang dalam pengembangan.',
}: ModulePlaceholderProps) {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <BackButton />
          <h1 className="page-title">{title}</h1>
          <p className="page-subtitle">{description}</p>
        </div>
      </div>

      <div className="module-placeholder">
        <div className="empty-state">
          <div className="empty-state-content">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <h3>Segera hadir</h3>
            <p>Halaman {title.toLowerCase()} belum tersedia.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
