import Phaser from 'phaser';

export class EffectsSystem {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  muzzleFlash(x: number, y: number) {
    const g = this.scene.add.circle(x, y, 4, 0xffcc66, 0.9).setDepth(30);
    this.scene.tweens.add({
      targets: g,
      alpha: 0,
      scale: 2,
      duration: 80,
      onComplete: () => g.destroy(),
    });
  }

  tracer(x1: number, y1: number, x2: number, y2: number) {
    const g = this.scene.add.graphics().setDepth(25);
    g.lineStyle(1, 0xffaa44, 0.85);
    g.lineBetween(x1, y1, x2, y2);
    this.scene.tweens.add({
      targets: g,
      alpha: 0,
      duration: 120,
      onComplete: () => g.destroy(),
    });
  }

  shellImpact(x: number, y: number, large = false) {
    const r = large ? 18 : 10;
    const g = this.scene.add.circle(x, y, r, 0xff6633, 0.7).setDepth(28);
    const smoke = this.scene.add.circle(x, y, r * 1.4, 0x444444, 0.35).setDepth(27);
    this.scene.tweens.add({
      targets: [g, smoke],
      alpha: 0,
      scale: 2.2,
      duration: large ? 450 : 280,
      onComplete: () => {
        g.destroy();
        smoke.destroy();
      },
    });
  }

  explosion(x: number, y: number) {
    this.shellImpact(x, y, true);
  }
}
