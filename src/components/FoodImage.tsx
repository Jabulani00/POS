import { clsx } from 'clsx';
import { useState } from 'react';
import type { MenuCategory } from '../types';

// Per-category gradient used for the emoji fallback tile (offline-safe, always renders).
const gradients: Record<MenuCategory, string> = {
  Burgers: 'from-orange-100 to-amber-200',
  Chicken: 'from-amber-100 to-orange-200',
  Sides: 'from-yellow-100 to-amber-100',
  Drinks: 'from-sky-100 to-cyan-200',
};

interface Props {
  src: string | null;
  emoji: string;
  alt: string;
  category: MenuCategory;
  className?: string;
  emojiSize?: string;
}

/**
 * Food photo with graceful degradation: shows the image when it loads, otherwise a
 * branded gradient tile with the item's emoji — so the grid never shows broken images,
 * on a bad network or fully offline (brief §6 offline-first).
 */
export function FoodImage({ src, emoji, alt, category, className, emojiSize = 'text-4xl' }: Props) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const showPhoto = Boolean(src) && !failed;

  return (
    <div className={clsx('relative overflow-hidden bg-gradient-to-br', gradients[category], className)}>
      {/* Emoji tile always underneath — acts as placeholder while the photo loads and as fallback */}
      <div
        className={clsx(
          'absolute inset-0 flex items-center justify-center transition-opacity',
          showPhoto && loaded ? 'opacity-0' : 'opacity-100',
        )}
        aria-hidden={showPhoto && loaded}
      >
        <span className={emojiSize}>{emoji}</span>
      </div>

      {showPhoto && (
        <img
          src={src ?? undefined}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={clsx(
            'h-full w-full object-cover transition-opacity duration-300',
            loaded ? 'opacity-100' : 'opacity-0',
          )}
        />
      )}
    </div>
  );
}
