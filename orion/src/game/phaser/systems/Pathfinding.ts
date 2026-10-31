import type { TerrainMapData } from './TerrainMap';
import { isWalkable } from './TerrainMap';

interface Node {
  x: number;
  y: number;
  g: number;
  f: number;
  parent?: Node;
}

function heuristic(ax: number, ay: number, bx: number, by: number): number {
  return Math.abs(ax - bx) + Math.abs(ay - by);
}

export function findPath(
  map: TerrainMapData,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
): { x: number; y: number }[] {
  if (!isWalkable(map, endX, endY)) {
    const alt = findNearestWalkable(map, endX, endY, 8);
    if (!alt) return [];
    endX = alt.x;
    endY = alt.y;
  }

  const open: Node[] = [];
  const closed = new Set<string>();
  const key = (x: number, y: number) => `${x},${y}`;

  const start: Node = { x: startX, y: startY, g: 0, f: heuristic(startX, startY, endX, endY) };
  open.push(start);

  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ];

  while (open.length > 0) {
    open.sort((a, b) => a.f - b.f);
    const current = open.shift()!;
    if (current.x === endX && current.y === endY) {
      const path: { x: number; y: number }[] = [];
      let c: Node | undefined = current;
      while (c) {
        path.push({ x: c.x, y: c.y });
        c = c.parent;
      }
      return path.reverse();
    }
    closed.add(key(current.x, current.y));

    for (const [dx, dy] of dirs) {
      const nx = current.x + dx;
      const ny = current.y + dy;
      if (!isWalkable(map, nx, ny)) continue;
      const k = key(nx, ny);
      if (closed.has(k)) continue;
      const moveCost = map.walkCost[ny][nx] * (dx !== 0 && dy !== 0 ? 1.414 : 1);
      const g = current.g + moveCost;
      const existing = open.find((n) => n.x === nx && n.y === ny);
      if (existing && existing.g <= g) continue;
      const node: Node = {
        x: nx,
        y: ny,
        g,
        f: g + heuristic(nx, ny, endX, endY),
        parent: current,
      };
      if (existing) {
        existing.g = g;
        existing.f = node.f;
        existing.parent = current;
      } else {
        open.push(node);
      }
    }
  }
  return [];
}

function findNearestWalkable(
  map: TerrainMapData,
  gx: number,
  gy: number,
  radius: number,
): { x: number; y: number } | null {
  for (let r = 1; r <= radius; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const x = gx + dx;
        const y = gy + dy;
        if (isWalkable(map, x, y)) return { x, y };
      }
    }
  }
  return null;
}
