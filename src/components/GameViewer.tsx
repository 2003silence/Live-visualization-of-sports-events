import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { GameState } from '../types';
import { GameRenderer } from '../core/renderer/GameRenderer';

interface GameViewerProps {
    gameState: GameState;
    currentEventIndex: number;
}

export interface GameViewerRef {
    showStartText: () => void;
}

export const GameViewer = forwardRef<GameViewerRef, GameViewerProps>(({ gameState, currentEventIndex }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<GameRenderer | null>(null);

    useEffect(() => {
        if (containerRef.current && !rendererRef.current) {
            rendererRef.current = new GameRenderer(containerRef.current);
        }

        return () => {
            if (rendererRef.current) {
                rendererRef.current.destroy();
                rendererRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (rendererRef.current) {
            rendererRef.current.updateGameState(gameState);
        }
    }, [gameState]);

    useEffect(() => {
        if (rendererRef.current && gameState && currentEventIndex < gameState.events.length) {
            const currentEvent = gameState.events[currentEventIndex];
            console.log('Playing event:', currentEvent);
            rendererRef.current.playEvent(currentEvent);
        }
    }, [currentEventIndex, gameState]);

    useImperativeHandle(ref, () => ({
        showStartText: () => {
            if (rendererRef.current) {
                rendererRef.current.showGameStartText();
            }
        }
    }));

    return (
        <div 
            ref={containerRef} 
            style={{ 
                width: '800px', 
                height: '450px', 
                backgroundColor: '#2C2C2C',
                borderRadius: '8px',
                overflow: 'hidden'
            }}
        />
    );
});

GameViewer.displayName = 'GameViewer'; 