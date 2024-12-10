import React from 'react';
import styled from 'styled-components';
import { Team } from '../types';
import { TechnicalStats } from './TechnicalStats';

const Container = styled.div`
    padding: 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const Title = styled.h2`
    margin: 0 0 20px 0;
    font-size: 18px;
    color: #333;
`;

interface StatsViewerProps {
    homeTeam: Team;
    awayTeam: Team;
}

export const StatsViewer: React.FC<StatsViewerProps> = ({ homeTeam, awayTeam }) => {
    return (
        <Container>
            <Title>双方技术统计</Title>
            <TechnicalStats team={homeTeam} />
            <TechnicalStats team={awayTeam} />
        </Container>
    );
}; 