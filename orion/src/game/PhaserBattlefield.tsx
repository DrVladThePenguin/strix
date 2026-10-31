import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { BattlefieldScene } from './scenes/BattlefieldScene';
import { useOrionStore } from '../stores/orionStore';

export function PhaserBattlefield({ parentId }: { parentId: string }) {
  const gameRef = useRef<Phaser.Game | null>(null);
  const operation = useOrionStore((s) => s.operation);

  useEffect(() => {
    if (!operation) return;

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: parentId,
      width: '100%',
      height: '100%',
      backgroundColor: '#1a2018',
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      scene: [BattlefieldScene],
      physics: {
        default: 'arcade',
        arcade: { debug: false },
      },
      render: {
        pixelArt: true,
        antialias: false,
      },
    });

    gameRef.current = game;

    return () => {
      game.destroy(true);
      gameRef.current = null;
    };
  }, [parentId, operation?.battlefield]);

  return null;
}
