import { useEffect, useRef, useState } from 'react';

/**
 * Sistem animasi reusable (pemanjang animations.css).
 * Hanya menyentuh layer visual — tidak mengubah logika/aplikasi.
 */

/**
 * Tambah ripple putih transparan dari titik klik.
 * Elemen induk harus position:relative + overflow:hidden.
 * Durasi visual maksimal 400ms (keyframe kf-ripple).
 */
export function addRipple(element: HTMLElement, x: number, y: number): void {
  const rect = element.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 2;
  const span = document.createElement('span');
  span.className = 'ripple-span';
  span.setAttribute('aria-hidden', 'true');
  span.style.width = `${size}px`;
  span.style.height = `${size}px`;
  span.style.left = `${x - rect.left - size / 2}px`;
  span.style.top = `${y - rect.top - size / 2}px`;
  element.appendChild(span);
  window.setTimeout(() => {
    span.remove();
  }, 450);
}

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Hitung naik dari 0 menuju nilai sebenarnya (600ms, ease-out,
 * tanpa bounce). Berjalan saat komponen pertama tampil; bila
 * target berubah (mis. data selesai dimuat), angka bergerak
 * dari nilai yang sedang tampil menuju target baru.
 * Saat prefers-reduced-motion: nilai langsung ditampilkan.
 * Nilai asli tidak pernah diubah — hanya tampilan.
 */
export function useCountUp(target: number, duration = 600, decimals = 0): number {
  const [value, setValue] = useState(0);
  const currentRef = useRef(0);

  useEffect(() => {
    if (prefersReducedMotion()) {
      currentRef.current = target;
      setValue(target);
      return;
    }

    let raf = 0;
    const from = currentRef.current;
    const start = performance.now();
    const factor = 10 ** decimals;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = Math.round((from + (target - from) * eased) * factor) / factor;
      currentRef.current = next;
      setValue(next);
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, decimals]);

  return value;
}
