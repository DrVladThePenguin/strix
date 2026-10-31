import { worldToGrid, type TerrainMapData } from './TerrainMap';

const BLOCKING = new Set(['building', 'water']);

function blocksVision(map: TerrainMapData, gx: number, gy: number): boolean {
  if (gx < 0 || gy < 0 || gx >= map.cols || gy >= map.rows) return true;
  const cell = map.cells[gy][gx];
  if (BLOCKING.has(cell)) return true;
  if (cell === 'forest' || cell === 'hedgerow') return true;
  return false;
}

export function hasLineOfSight(
  map: TerrainMapData,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): boolean {
  const a = worldToGrid(x1, y1);
  const b = worldToGrid(x2, y2);
  let x0 = a.gx;
  let y0 = a.gy;
  const xEnd = b.gx;
  const yEnd = b.gy;
  const dx = Math.abs(xEnd - x0);
  const dy = Math.abs(yEnd - y0);
  const sx = x0 < xEnd ? 1 : -1;
  const sy = y0 < yEnd ? 1 : -1;
  let err = dx - dy;

  while (true) {
    if (x0 === xEnd && y0 === yEnd) return true;
    if (!(x0 === a.gx && y0 === a.gy) && !(x0 === xEnd && y0 === yEnd)) {
      if (blocksVision(map, x0, y0)) return false;
    }
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
  }
}
