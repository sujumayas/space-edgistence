import { useEffect, useState } from 'react';

// Sprite-sheet loader + cache. Games render procedurally by default (so the
// project is fully playable with zero art), but this loader is here for any
// future PNG drop-in: provide a sheet URL and draw frames by pixel coords.

const cache = new Map<string, HTMLImageElement>();

export function loadSprite(url: string): Promise<HTMLImageElement> {
  const existing = cache.get(url);
  if (existing && existing.complete) return Promise.resolve(existing);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      cache.set(url, img);
      resolve(img);
    };
    img.onerror = reject;
    img.src = url;
  });
}

export type FrameRect = { sx: number; sy: number; sw: number; sh: number };

/** Draw one frame of a (already-loaded) sheet at integer dest coords. */
export function drawFrame(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  frame: FrameRect,
  dx: number,
  dy: number,
  dw = frame.sw,
  dh = frame.sh,
): void {
  ctx.drawImage(img, frame.sx, frame.sy, frame.sw, frame.sh, dx | 0, dy | 0, dw, dh);
}

/** React hook: returns the image once loaded, or null while pending. */
export function useSprite(url: string | null): HTMLImageElement | null {
  const [img, setImg] = useState<HTMLImageElement | null>(
    url ? cache.get(url) ?? null : null,
  );
  useEffect(() => {
    if (!url) return;
    let active = true;
    loadSprite(url)
      .then((loaded) => {
        if (active) setImg(loaded);
      })
      .catch(() => {
        if (active) setImg(null);
      });
    return () => {
      active = false;
    };
  }, [url]);
  return img;
}
