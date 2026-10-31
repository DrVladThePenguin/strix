import Phaser from 'phaser';
import type { FactionId } from '../../../types/game';
import { FACTIONS } from '../../../data/factions';

const TERRAIN_COLORS: Record<string, number> = {
  grass: 0x4a6b3a,
  forest: 0x2f4a28,
  hedgerow: 0x3d5c32,
  road: 0x8b7a5a,
  water: 0x3a5a7a,
  building: 0x6b5c4a,
  trenches: 0x4a4030,
  hill: 0x5a7a48,
};

export function registerBattlefieldTextures(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);

  for (const [name, color] of Object.entries(TERRAIN_COLORS)) {
    g.clear();
    g.fillStyle(color, 1);
    g.fillRect(0, 0, 32, 32);
    if (name === 'forest') {
      g.fillStyle(0x1f3018, 1);
      for (let i = 0; i < 5; i++) {
        g.fillCircle(8 + i * 5, 10 + (i % 2) * 6, 4);
      }
    }
    if (name === 'hedgerow') {
      g.fillStyle(0x2a4020, 1);
      g.fillRect(0, 12, 32, 10);
    }
    if (name === 'road') {
      g.lineStyle(2, 0x6b6350, 0.5);
      g.lineBetween(16, 0, 16, 32);
    }
    if (name === 'building') {
      g.fillStyle(0x4a4035, 1);
      g.fillRect(4, 4, 24, 24);
      g.fillStyle(0x2a2520, 1);
      g.fillRect(10, 14, 6, 10);
    }
    if (name === 'trenches') {
      g.fillStyle(0x3a3028, 1);
      g.fillRect(0, 14, 32, 6);
    }
    g.generateTexture(`terrain-${name}`, 32, 32);
  }

  for (const faction of Object.values(FACTIONS)) {
    createSoldierTexture(scene, g, faction.id, faction.primaryColor, faction.helmetColor, false);
    createSoldierTexture(scene, g, faction.id, faction.secondaryColor, faction.helmetColor, true);
  }

  g.clear();
  g.fillStyle(0xffffff, 0.25);
  g.fillRect(0, 0, 32, 32);
  g.lineStyle(2, 0xffe066, 1);
  g.strokeRect(1, 1, 30, 30);
  g.generateTexture('selection-ring', 32, 32);

  g.destroy();
}

function createSoldierTexture(
  _scene: Phaser.Scene,
  g: Phaser.GameObjects.Graphics,
  factionId: FactionId,
  bodyColor: number,
  helmetColor: number,
  enemy: boolean,
) {
  const key = enemy ? `soldier-${factionId}-enemy` : `soldier-${factionId}`;
  g.clear();
  g.fillStyle(0x000000, 0.35);
  g.fillEllipse(6, 14, 8, 3);
  g.fillStyle(bodyColor, 1);
  g.fillRect(3, 7, 6, 7);
  g.fillStyle(helmetColor, 1);
  g.fillRect(3, 4, 6, 4);
  g.fillStyle(0x2a2520, 1);
  g.fillRect(8, 8, 5, 2);
  if (enemy) {
    g.lineStyle(1, 0xaa4444, 1);
    g.strokeRect(2, 3, 8, 12);
  }
  g.generateTexture(key, 16, 16);
}

export function soldierTextureKey(factionId: FactionId, friendly: boolean): string {
  return friendly ? `soldier-${factionId}` : `soldier-${factionId}-enemy`;
}
