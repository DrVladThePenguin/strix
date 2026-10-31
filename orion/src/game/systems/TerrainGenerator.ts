import Phaser from 'phaser';
import type { BattlefieldDefinition } from '../../data/battlefields';
import type { Pathfinder } from './Pathfinder';

interface TerrainFeature {
  type: 'forest' | 'building' | 'hedgerow' | 'road' | 'trenches' | 'water';
  x: number;
  y: number;
  w: number;
  h: number;
}

export function generateTerrain(
  scene: Phaser.Scene,
  bf: BattlefieldDefinition,
  pathfinder: Pathfinder,
): Phaser.GameObjects.Container {
  const root = scene.add.container(0, 0);
  const { grass, dirt, forest, water, road } = bf.terrainPalette;

  const bg = scene.add.rectangle(bf.width / 2, bf.height / 2, bf.width, bf.height, grass);
  root.add(bg);

  const rng = seededRandom(bf.id.length * 9973);

  for (let i = 0; i < 120; i++) {
    const px = rng() * bf.width;
    const py = rng() * bf.height;
    const patch = scene.add.ellipse(px, py, 40 + rng() * 80, 30 + rng() * 60, dirt, 0.35);
    root.add(patch);
  }

  const features: TerrainFeature[] = [];

  for (let i = 0; i < 18; i++) {
    features.push({
      type: 'forest',
      x: 200 + rng() * (bf.width - 400),
      y: 200 + rng() * (bf.height - 400),
      w: 80 + rng() * 160,
      h: 60 + rng() * 120,
    });
  }

  for (let i = 0; i < 8; i++) {
    features.push({
      type: 'building',
      x: 300 + rng() * (bf.width - 600),
      y: 300 + rng() * (bf.height - 600),
      w: 48 + rng() * 64,
      h: 40 + rng() * 50,
    });
  }

  for (let i = 0; i < 14; i++) {
    features.push({
      type: 'hedgerow',
      x: rng() * bf.width,
      y: rng() * bf.height,
      w: 120 + rng() * 200,
      h: 12 + rng() * 8,
    });
  }

  features.push({
    type: 'road',
    x: 0,
    y: bf.height / 2 - 20,
    w: bf.width,
    h: 40,
  });

  for (const f of features) {
    drawFeature(scene, root, f, { grass, dirt, forest, water, road }, pathfinder);
  }

  drawGrid(scene, root, bf.width, bf.height);

  return root;
}

function drawFeature(
  scene: Phaser.Scene,
  root: Phaser.GameObjects.Container,
  f: TerrainFeature,
  palette: BattlefieldDefinition['terrainPalette'],
  pathfinder: Pathfinder,
): void {
  switch (f.type) {
    case 'forest': {
      const rect = scene.add.rectangle(f.x + f.w / 2, f.y + f.h / 2, f.w, f.h, palette.forest, 0.85);
      root.add(rect);
      for (let t = 0; t < 8; t++) {
        const tx = f.x + Math.random() * f.w;
        const ty = f.y + Math.random() * f.h;
        root.add(scene.add.circle(tx, ty, 6 + Math.random() * 10, palette.forest));
      }
      pathfinder.setBlockedRect(f.x, f.y, f.w, f.h, true);
      break;
    }
    case 'building': {
      const b = scene.add.rectangle(f.x + f.w / 2, f.y + f.h / 2, f.w, f.h, 0x6a5a48);
      b.setStrokeStyle(2, 0x3a3028);
      root.add(b);
      pathfinder.setBlockedRect(f.x, f.y, f.w, f.h, false);
      break;
    }
    case 'hedgerow': {
      const h = scene.add.rectangle(f.x + f.w / 2, f.y + f.h / 2, f.w, f.h, palette.forest, 0.9);
      root.add(h);
      break;
    }
    case 'road': {
      const r = scene.add.rectangle(f.x + f.w / 2, f.y + f.h / 2, f.w, f.h, palette.road);
      root.add(r);
      break;
    }
    default:
      break;
  }
}

function drawGrid(
  scene: Phaser.Scene,
  root: Phaser.GameObjects.Container,
  width: number,
  height: number,
): void {
  const step = 200;
  const graphics = scene.add.graphics();
  graphics.lineStyle(1, 0x2a3a20, 0.15);
  for (let x = 0; x <= width; x += step) {
    graphics.lineBetween(x, 0, x, height);
  }
  for (let y = 0; y <= height; y += step) {
    graphics.lineBetween(0, y, width, y);
  }
  root.add(graphics);
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function worldToGridLabel(x: number, y: number): string {
  const col = String.fromCharCode(65 + Math.floor(x / 200) % 26);
  const row = Math.floor(y / 200) + 1;
  return `${col}${row}`;
}
