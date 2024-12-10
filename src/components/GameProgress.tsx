import React from 'react';
import styled from 'styled-components';
import { GameEvent, GameState } from '../types';

const ProgressContainer = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    padding: 10px 20px;
    background: #f8f9fa;
    border-bottom: 1px solid #dee2e6;
`;

const ProgressBar = styled.div`
    width: 100%;
    height: 8px;
    background: #e9ecef;
    border-radius: 4px;
    margin: 10px 0;
    position: relative;
    cursor: pointer;
`;

const Progress = styled.div<{ width: number }>`
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: ${props => props.width}%;
    background: #007bff;
    border-radius: 4px;
    transition: width 0.3s ease;
`;

const EventDisplay = styled.div`
    padding: 10px;
    background: white;
    border-radius: 4px;
    margin-top: 10px;
    font-size: 16px;
    line-height: 1.5;
`;

const EventTime = styled.span`
    font-weight: bold;
    margin-right: 10px;
    color: #007bff;
`;

const EventDescription = styled.span`
    color: #333;
`;

interface GameProgressProps {
    gameState: GameState;
    currentEventIndex: number;
    onSeek: (index: number) => void;
}

export const GameProgress: React.FC<GameProgressProps> = ({
    gameState,
    currentEventIndex,
    onSeek
}) => {
    const progress = (currentEventIndex / (gameState.events.length - 1)) * 100;
    const currentEvent = gameState.events[currentEventIndex];

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = x / rect.width;
        const newIndex = Math.floor(percentage * (gameState.events.length - 1));
        onSeek(newIndex);
    };

    const formatEventDescription = (event: GameEvent) => {
        const team = event.team === 'home' ? gameState.homeTeam.name : gameState.awayTeam.name;
        return `${team} - ${event.description}`;
    };

    return (
        <ProgressContainer>
            <ProgressBar onClick={handleProgressClick}>
                <Progress width={progress} />
            </ProgressBar>
            <EventDisplay>
                <EventTime>{currentEvent.time}</EventTime>
                <EventDescription>
                    {formatEventDescription(currentEvent)}
                </EventDescription>
            </EventDisplay>
        </ProgressContainer>
    );
}; 