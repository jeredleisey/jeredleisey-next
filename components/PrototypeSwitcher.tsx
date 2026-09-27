'use client';

// PROTOTYPE (#57). Throwaway. Not for main.
// A floating bar that cycles the ?variant= search param. The arrow keys also cycle it.
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export function PrototypeSwitcher({
  variants,
  current,
}: {
  variants: { key: string; name: string }[];
  current: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const index = Math.max(0, variants.findIndex((v) => v.key === current));

  useEffect(() => {
    const go = (step: number) => {
      const next = variants[(index + step + variants.length) % variants.length];
      router.replace(`${pathname}?variant=${next.key}`, { scroll: false });
    };
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.closest('input, textarea, select, [contenteditable]'))) return;
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, variants, pathname, router]);

  if (process.env.NODE_ENV === 'production') return null;

  const step = (n: number) => {
    const next = variants[(index + n + variants.length) % variants.length];
    router.replace(`${pathname}?variant=${next.key}`, { scroll: false });
  };

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-1 rounded-full bg-black text-white text-xs font-mono shadow-lg ring-1 ring-white/20 px-1 py-1">
      <button type="button" onClick={() => step(-1)} className="px-3 py-1.5 rounded-full hover:bg-white/15" aria-label="Previous variant">
        ←
      </button>
      <span className="px-2 whitespace-nowrap">
        {variants[index].key} ({variants[index].name})
      </span>
      <button type="button" onClick={() => step(1)} className="px-3 py-1.5 rounded-full hover:bg-white/15" aria-label="Next variant">
        →
      </button>
    </div>
  );
}
