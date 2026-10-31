import Phaser from 'phaser';
import { BattlefieldScene } from './BattlefieldScene';

export function createPhaserConfig(parent: HTMLElement): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#1a1f14',
    scale: {
      mode: Phaser.Scale.RESIZE,
      width: '100%',
      height: '100%',
    },
    scene: [BattlefieldScene],
    fps: { target: 60, forceSetTimeOut: true },
    render: {
      pixelArt: true,
      antialias: false,
    },
  };
}
