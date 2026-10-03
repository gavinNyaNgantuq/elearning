import React from 'react';
import './Badge.css';

interface BadgeProps {
  variant?: 'blue';
  children: React.ReactNode;
  className?: string;
}

/**
 * Badge label ringan — selebar isi teks, tanpa border/shadow.
 * Dipakai untuk label identitas (mis. "E-Learning" di header).
 */
export default function Badge({
  variant = 'blue',
  children,
  className = '',
}: BadgeProps) {
  return (
    <span className={`badge badge-${variant} ${className}`.trim()}>
      {children}
    </span>
  );
}
