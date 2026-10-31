export interface GridCell {
  walkable: boolean;
  cover: number;
  concealment: number;
}

export class Pathfinder {
  private width: number;
  private height: number;
  private cellSize: number;
  private gridW: number;
  private gridH: number;
  private cells: GridCell[][];

  constructor(mapWidth: number, mapHeight: number, cellSize = 32) {
    this.width = mapWidth;
    this.height = mapHeight;
    this.cellSize = cellSize;
    this.gridW = Math.ceil(mapWidth / cellSize);
    this.gridH = Math.ceil(mapHeight / cellSize);
    this.cells = [];
    for (let gy = 0; gy < this.gridH; gy++) {
      const row: GridCell[] = [];
      for (let gx = 0; gx < this.gridW; gx++) {
        row.push({ walkable: true, cover: 0, concealment: 0 });
      }
      this.cells.push(row);
    }
  }

  worldToGrid(x: number, y: number): { gx: number; gy: number } {
    return {
      gx: Math.floor(Math.max(0, Math.min(this.width - 1, x)) / this.cellSize),
      gy: Math.floor(Math.max(0, Math.min(this.height - 1, y)) / this.cellSize),
    };
  }

  gridToWorld(gx: number, gy: number): { x: number; y: number } {
    return {
      x: gx * this.cellSize + this.cellSize / 2,
      y: gy * this.cellSize + this.cellSize / 2,
    };
  }

  setBlockedRect(x: number, y: number, w: number, h: number, walkable = false): void {
    const min = this.worldToGrid(x, y);
    const max = this.worldToGrid(x + w, y + h);
    for (let gy = min.gy; gy <= max.gy; gy++) {
      for (let gx = min.gx; gx <= max.gx; gx++) {
        if (this.cells[gy]?.[gx]) {
          this.cells[gy][gx].walkable = walkable;
        }
      }
    }
  }

  findPath(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
  ): { x: number; y: number }[] {
    const start = this.worldToGrid(startX, startY);
    const end = this.worldToGrid(endX, endY);
    const path = this.aStar(start.gx, start.gy, end.gx, end.gy);
    if (path.length === 0) {
      return [{ x: endX, y: endY }];
    }
    return path.map((p) => this.gridToWorld(p.gx, p.gy));
  }

  private aStar(sx: number, sy: number, ex: number, ey: number): { gx: number; gy: number }[] {
    const key = (x: number, y: number) => `${x},${y}`;
    const h = (x: number, y: number) => Math.abs(x - ex) + Math.abs(y - ey);
    const open = new Map<string, { gx: number; gy: number; f: number; g: number }>();
    const cameFrom = new Map<string, { gx: number; gy: number }>();
    const gScore = new Map<string, number>();

    const startKey = key(sx, sy);
    gScore.set(startKey, 0);
    open.set(startKey, { gx: sx, gy: sy, f: h(sx, sy), g: 0 });

    const neighbors = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, 1],
      [-1, 1],
      [1, -1],
      [-1, -1],
    ];

    while (open.size > 0) {
      let current: { gx: number; gy: number; f: number; g: number } | null = null;
      for (const node of open.values()) {
        if (!current || node.f < current.f) current = node;
      }
      if (!current) break;

      const ck = key(current.gx, current.gy);
      if (current.gx === ex && current.gy === ey) {
        const result: { gx: number; gy: number }[] = [];
        let cur: { gx: number; gy: number } | undefined = current;
        while (cur) {
          result.unshift(cur);
          cur = cameFrom.get(key(cur.gx, cur.gy));
        }
        return result;
      }

      open.delete(ck);

      for (const [dx, dy] of neighbors) {
        const nx = current.gx + dx;
        const ny = current.gy + dy;
        if (nx < 0 || ny < 0 || nx >= this.gridW || ny >= this.gridH) continue;
        const cell = this.cells[ny][nx];
        if (!cell.walkable) continue;

        const nk = key(nx, ny);
        const tentative = (gScore.get(ck) ?? Infinity) + (dx !== 0 && dy !== 0 ? 1.414 : 1);
        if (tentative >= (gScore.get(nk) ?? Infinity)) continue;

        cameFrom.set(nk, { gx: current.gx, gy: current.gy });
        gScore.set(nk, tentative);
        open.set(nk, { gx: nx, gy: ny, f: tentative + h(nx, ny), g: tentative });
      }
    }

    return [];
  }
}
