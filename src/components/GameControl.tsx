import React, { useState } from 'react';
import styled from 'styled-components';
import { GameState } from '../types';

const ControlContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px;
    background: #f8f9fa;
    border-bottom: 1px solid #dee2e6;
`;

const ControlRow = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 10px 0;
`;

const Button = styled.button`
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 8px 16px;
    margin: 0 5px;
    border: none;
    border-radius: 4px;
    background: #007bff;
    color: white;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.2s;
    &:hover {
        background: #0056b3;
    }
    &:disabled {
        background: #6c757d;
        cursor: not-allowed;
    }
`;

const SpeedControl = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0 20px;
`;

const SpeedButton = styled(Button)<{ $active: boolean }>`
    background: ${props => props.$active ? '#28a745' : '#6c757d'};
    padding: 4px 8px;
    &:hover {
        background: ${props => props.$active ? '#218838' : '#5a6268'};
    }
`;

const TimeDisplay = styled.div`
    font-size: 24px;
    font-weight: bold;
    margin: 0 20px;
`;

const QuarterDisplay = styled.div`
    font-size: 18px;
    margin: 0 20px;
`;

const ScoreDisplay = styled.div`
    display: flex;
    align-items: center;
    margin: 0 20px;
    font-size: 24px;
    font-weight: bold;
`;

const TeamScore = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
`;

const TeamName = styled.span`
    min-width: 120px;
    text-align: center;
`;

const Score = styled.span`
    min-width: 40px;
    text-align: center;
`;

interface GameControlProps {
    gameState: GameState;
    onPlay: () => void;
    onPause: () => void;
    onNext: () => void;
    onPrev: () => void;
    onSpeedChange: (speed: number) => void;
    isPlaying: boolean;
    currentSpeed: number;
}

export const GameControl: React.FC<GameControlProps> = ({
    gameState,
    onPlay,
    onPause,
    onNext,
    onPrev,
    onSpeedChange,
    isPlaying,
    currentSpeed
}) => {
    return (
        <ControlContainer>
            <ControlRow>
                <Button onClick={onPrev} title="上一个事件">
                    <i className="fas fa-backward"></i>
                    <span>上一步</span>
                </Button>
                {isPlaying ? (
                    <Button onClick={onPause} title="暂停">
                        <i className="fas fa-pause"></i>
                        <span>暂停</span>
                    </Button>
                ) : (
                    <Button onClick={onPlay} title="播放">
                        <i className="fas fa-play"></i>
                        <span>播放</span>
                    </Button>
                )}
                <Button onClick={onNext} title="下一个事件">
                    <i className="fas fa-forward"></i>
                    <span>下一步</span>
                </Button>

                <SpeedControl>
                    <span>播放速度：</span>
                    <SpeedButton 
                        onClick={() => onSpeedChange(0.5)} 
                        $active={currentSpeed === 0.5}
                        title="0.5倍速"
                    >
                        0.5x
                    </SpeedButton>
                    <SpeedButton 
                        onClick={() => onSpeedChange(1)} 
                        $active={currentSpeed === 1}
                        title="正常速度"
                    >
                        1x
                    </SpeedButton>
                    <SpeedButton 
                        onClick={() => onSpeedChange(2)} 
                        $active={currentSpeed === 2}
                        title="2倍速"
                    >
                        2x
                    </SpeedButton>
                </SpeedControl>
            </ControlRow>

            <ControlRow>
                <QuarterDisplay>
                    第{gameState.quarter}节
                </QuarterDisplay>
                
                <TimeDisplay>
                    {gameState.time}
                </TimeDisplay>
                
                <ScoreDisplay>
                    <TeamScore>
                        <TeamName>{gameState.homeTeam.name}</TeamName>
                        <Score>{gameState.homeTeam.stats.points}</Score>
                    </TeamScore>
                    <span>-</span>
                    <TeamScore>
                        <Score>{gameState.awayTeam.stats.points}</Score>
                        <TeamName>{gameState.awayTeam.name}</TeamName>
                    </TeamScore>
                </ScoreDisplay>
            </ControlRow>
        </ControlContainer>
    );
}; 