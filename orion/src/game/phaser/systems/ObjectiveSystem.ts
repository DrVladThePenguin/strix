import Phaser from 'phaser';
import type { BattleContext } from '../entities/BattleContext';

export interface ObjectiveZone {
  id: string;
  name: string;
  x: number;
  y: number;
  radius: number;
  owner: 'neutral' | 'friendly' | 'enemy';
  captureProgress: number;
}

export class ObjectiveSystem {
  zones: ObjectiveZone[] = [];
  private markers: Phaser.GameObjects.Graphics[] = [];
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  setupDefaults(worldW: number, worldH: number) {
    this.zones = [
      {
        id: 'obj-a',
        name: 'Crossroads',
        x: worldW * 0.45,
        y: worldH * 0.42,
        radius: 120,
        owner: 'neutral',
        captureProgress: 0,
      },
      {
        id: 'obj-b',
        name: 'Farmstead',
        x: worldW * 0.62,
        y: worldH * 0.38,
        radius: 100,
        owner: 'enemy',
        captureProgress: -0.4,
      },
      {
        id: 'obj-c',
        name: 'Bridge',
        x: worldW * 0.55,
        y: worldH * 0.55,
        radius: 110,
        owner: 'neutral',
        captureProgress: 0,
      },
    ];
    this.drawMarkers();
  }

  private drawMarkers() {
    for (const m of this.markers) m.destroy();
    this.markers = [];
    for (const z of this.zones) {
      const g = this.scene.add.graphics().setDepth(3);
      const color = z.owner === 'friendly' ? 0x6b8f4a : z.owner === 'enemy' ? 0x8f4a4a : 0x8b7355;
      g.lineStyle(2, color, 0.8);
      g.strokeCircle(z.x, z.y, z.radius);
      g.fillStyle(color, 0.08);
      g.fillCircle(z.x, z.y, z.radius);
      this.markers.push(g);
    }
  }

  update(deltaSec: number, ctx: BattleContext) {
    for (const zone of this.zones) {
      let friendly = 0;
      let enemy = 0;
      for (const squad of ctx.squads) {
        for (const s of squad.livingSoldiers()) {
          const d = Math.hypot(s.sprite.x - zone.x, s.sprite.y - zone.y);
          if (d > zone.radius) continue;
          if (s.friendly) friendly += 1;
          else enemy += 1;
        }
      }
      const delta = (friendly - enemy) * 0.015 * deltaSec;
      zone.captureProgress = Phaser.Math.Clamp(zone.captureProgress + delta, -1, 1);
      if (zone.captureProgress >= 0.85) zone.owner = 'friendly';
      else if (zone.captureProgress <= -0.85) zone.owner = 'enemy';
      else if (Math.abs(zone.captureProgress) < 0.2) zone.owner = 'neutral';
    }
    this.drawMarkers();
  }

  destroy() {
    for (const m of this.markers) m.destroy();
    this.markers = [];
  }
}
