import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import type { OperationConfig } from '../../types/game';
import { createPhaserConfig } from '../../game/phaser/config';
import { GameBridge } from '../../game/GameBridge';

interface PhaserCanvasProps {
  operation: OperationConfig;
  active: boolean;
}

export function PhaserCanvas({ operation, active }: PhaserCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!active || !hostRef.current) return;

    const game = new Phaser.Game(createPhaserConfig(hostRef.current));
    gameRef.current = game;
    GameBridge.setGame(game);

    game.events.once('ready', () => {
      GameBridge.startBattlefield(operation);
    });

    return () => {
      game.destroy(true);
      gameRef.current = null;
      GameBridge.clear();
    };
  }, [active]);

  useEffect(() => {
    if (!active || !gameRef.current) return;
    GameBridge.startBattlefield(operation);
  }, [operation, active]);

  return <div className="phaser-host" ref={hostRef} />;
}
