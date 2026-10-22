export interface Box { x: number; y: number; width: number; height: number }

export function placeBalloon(target: Box, balloon: { width: number; height: number }, viewport: { width: number; height: number }) {
  const margin = 14, gap = 22;
  const { width: w, height: h } = balloon;
  const cx = target.x + target.width / 2, cy = target.y + target.height / 2;
  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
  const candidates = [
    { side: 'right', x: target.x + target.width + gap, y: cy - h / 2 },
    { side: 'left', x: target.x - w - gap, y: cy - h / 2 },
    { side: 'below', x: cx - w / 2, y: target.y + target.height + gap },
    { side: 'above', x: cx - w / 2, y: target.y - h - gap },
  ].map(item => {
    const x = clamp(item.x, margin, viewport.width - w - margin);
    const y = clamp(item.y, margin, viewport.height - h - margin);
    const overlap = Math.max(0, Math.min(x + w, target.x + target.width + 6) - Math.max(x, target.x - 6)) *
      Math.max(0, Math.min(y + h, target.y + target.height + 6) - Math.max(y, target.y - 6));
    return { ...item, x, y, overlap, score: overlap * 10000 + Math.abs(x - item.x) + Math.abs(y - item.y) };
  });
  candidates.sort((a, b) => a.score - b.score);
  const best = candidates[0];
  const start = { x: clamp(cx, best.x, best.x + w), y: clamp(cy, best.y, best.y + h) };
  const end = { x: clamp(start.x, target.x, target.x + target.width), y: clamp(start.y, target.y, target.y + target.height) };
  return { ...best, start, end };
}
