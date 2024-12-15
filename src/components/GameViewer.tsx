import React, { useEffect, useRef } from 'react';
import { GameRenderer } from '../core/renderer/GameRenderer';
import { GameState } from '../types';

interface GameViewerProps {
    gameState: GameState;
    currentEventIndex: number;
}

export const GameViewer: React.FC<GameViewerProps> = ({ gameState, currentEventIndex }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<GameRenderer | null>(null);

    useEffect(() => {
        if (containerRef.current && !rendererRef.current) {
            rendererRef.current = new GameRenderer(containerRef.current);
            (containerRef.current as any).__pixi = rendererRef.current;
        }
    }, []);

    useEffect(() => {
        if (rendererRef.current) {
            rendererRef.current.updateGameState(gameState);
        }
    }, [gameState]);

    useEffect(() => {
        if (rendererRef.current && gameState && currentEventIndex >= 0 && currentEventIndex < gameState.events.length) {
            const currentEvent = gameState.events[currentEventIndex];
            rendererRef.current.playEvent(currentEvent);
        }
    }, [currentEventIndex, gameState]);

    return <div ref={containerRef} className="game-viewer" />;
}; 