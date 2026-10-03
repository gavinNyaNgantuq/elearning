import { useNavigate } from 'react-router-dom';
import Button from './Button';

/**
 * Tombol Kembali — kembali ke halaman sebelumnya dengan navigate(-1).
 * Dipakai di halaman detail/sub-halaman portal.
 */
export default function BackButton({ label = 'Kembali' }: { label?: string }) {
  const navigate = useNavigate();

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      className="page-back"
      onClick={() => navigate(-1)}
      aria-label={`${label} ke halaman sebelumnya`}
      icon={
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
      }
    >
      {label}
    </Button>
  );
}
