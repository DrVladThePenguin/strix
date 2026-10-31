import { gridToWorld, worldToGrid, isWalkable, type TerrainMapData } from './TerrainMap';

export function coverAt(map: TerrainMapData, worldX: number, worldY: number): number {
  const { gx, gy } = worldToGrid(worldX, worldY);
  if (gy < 0 || gx < 0 || gy >= map.rows || gx >= map.cols) return 0;
  return map.cover[gy][gx];
}

export function findCoverPosition(
  map: TerrainMapData,
  fromX: number,
  fromY: number,
  radiusTiles = 8,
): { x: number; y: number } | null {
  const start = worldToGrid(fromX, fromY);
  let best: { x: number; y: number; score: number } | null = null;
  for (let dy = -radiusTiles; dy <= radiusTiles; dy++) {
    for (let dx = -radiusTiles; dx <= radiusTiles; dx++) {
      const gx = start.gx + dx;
      const gy = start.gy + dy;
      if (!isWalkable(map, gx, gy)) continue;
      const c = map.cover[gy][gx];
      if (c < 0.35) continue;
      const w = gridToWorld(gx, gy);
      const dist = Math.hypot(w.x - fromX, w.y - fromY);
      const score = c * 100 - dist * 0.05;
      if (!best || score > best.score) best = { x: w.x, y: w.y, score };
    }
  }
  return best ? { x: best.x, y: best.y } : null;
}
