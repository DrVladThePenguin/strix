export const TILE_SIZE = 32;
export const GRID_COLS = 150;
export const GRID_ROWS = 112;

export type TerrainCell =
  | 'grass'
  | 'forest'
  | 'hedgerow'
  | 'road'
  | 'water'
  | 'building'
  | 'trenches'
  | 'hill';

export interface TerrainMapData {
  cols: number;
  rows: number;
  cells: TerrainCell[][];
  walkCost: number[][];
  cover: number[][];
}

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function terrainCost(cell: TerrainCell): number {
  switch (cell) {
    case 'forest':
      return 2.2;
    case 'hedgerow':
      return 1.8;
    case 'hill':
      return 1.5;
    case 'trenches':
      return 1.3;
    case 'road':
      return 0.7;
    case 'building':
      return 999;
    case 'water':
      return 999;
    default:
      return 1;
  }
}

function coverValue(cell: TerrainCell): number {
  switch (cell) {
    case 'building':
      return 0.9;
    case 'trenches':
      return 0.85;
    case 'hedgerow':
      return 0.75;
    case 'forest':
      return 0.6;
    case 'hill':
      return 0.35;
    default:
      return 0.1;
  }
}

export function generateTerrain(seed: number, cols = GRID_COLS, rows = GRID_ROWS): TerrainMapData {
  const rand = mulberry32(seed);
  const cells: TerrainCell[][] = [];
  const walkCost: number[][] = [];
  const cover: number[][] = [];

  for (let y = 0; y < rows; y++) {
    cells[y] = [];
    walkCost[y] = [];
    cover[y] = [];
    for (let x = 0; x < cols; x++) {
      const n = rand();
      let cell: TerrainCell = 'grass';
      if (n < 0.08) cell = 'forest';
      else if (n < 0.14) cell = 'hedgerow';
      else if (n < 0.17) cell = 'hill';
      else if (n < 0.19) cell = 'trenches';
      else if (n < 0.205) cell = 'building';
      else if (n < 0.215) cell = 'water';
      if (y % 17 === 0 && x > 5 && x < cols - 5) cell = 'road';
      cells[y][x] = cell;
      walkCost[y][x] = terrainCost(cell);
      cover[y][x] = coverValue(cell);
    }
  }

  return { cols, rows, cells, walkCost, cover };
}

export function worldToGrid(x: number, y: number): { gx: number; gy: number } {
  return {
    gx: Math.max(0, Math.min(GRID_COLS - 1, Math.floor(x / TILE_SIZE))),
    gy: Math.max(0, Math.min(GRID_ROWS - 1, Math.floor(y / TILE_SIZE))),
  };
}

export function gridToWorld(gx: number, gy: number): { x: number; y: number } {
  return { x: gx * TILE_SIZE + TILE_SIZE / 2, y: gy * TILE_SIZE + TILE_SIZE / 2 };
}

export function isWalkable(map: TerrainMapData, gx: number, gy: number): boolean {
  if (gx < 0 || gy < 0 || gx >= map.cols || gy >= map.rows) return false;
  return map.walkCost[gy][gx] < 900;
}
