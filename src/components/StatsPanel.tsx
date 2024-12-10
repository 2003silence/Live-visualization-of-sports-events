import React from 'react';
import styled from 'styled-components';
import { Team, Player } from '../types';

const StatsContainer = styled.div`
    background: #fff;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const TeamHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
`;

const TeamLogo = styled.img`
    width: 40px;
    height: 40px;
`;

const TeamName = styled.h2`
    margin: 0;
    font-size: 18px;
`;

const StatsTable = styled.table`
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
`;

const Th = styled.th`
    text-align: left;
    padding: 8px;
    border-bottom: 2px solid #eee;
    font-weight: bold;
`;

const Td = styled.td`
    padding: 8px;
    border-bottom: 1px solid #eee;
`;

interface StatsPanelProps {
    team: Team;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ team }) => {
    return (
        <StatsContainer>
            <TeamHeader>
                <TeamLogo src={team.logo} alt={team.name} />
                <TeamName>{team.name}</TeamName>
            </TeamHeader>
            <StatsTable>
                <thead>
                    <tr>
                        <Th>球员</Th>
                        <Th>得分</Th>
                        <Th>篮板</Th>
                        <Th>助攻</Th>
                        <Th>抢断</Th>
                        <Th>盖帽</Th>
                        <Th>犯规</Th>
                    </tr>
                </thead>
                <tbody>
                    {team.players.map(player => (
                        <tr key={player.id}>
                            <Td>{player.name}</Td>
                            <Td>{player.stats.points}</Td>
                            <Td>{player.stats.rebounds}</Td>
                            <Td>{player.stats.assists}</Td>
                            <Td>{player.stats.steals}</Td>
                            <Td>{player.stats.blocks}</Td>
                            <Td>{player.stats.fouls}</Td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr>
                        <Td>总计</Td>
                        <Td>{team.stats.points}</Td>
                        <Td>{team.stats.rebounds}</Td>
                        <Td>{team.stats.assists}</Td>
                        <Td>{team.stats.steals}</Td>
                        <Td>{team.stats.blocks}</Td>
                        <Td>{team.stats.fouls}</Td>
                    </tr>
                </tfoot>
            </StatsTable>
            <StatsTable>
                <thead>
                    <tr>
                        <Th>投篮</Th>
                        <Th>命中</Th>
                        <Th>出手</Th>
                        <Th>命中率</Th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <Td>两分球</Td>
                        <Td>{team.stats.twoPointsMade}</Td>
                        <Td>{team.stats.twoPointsAttempted}</Td>
                        <Td>
                            {team.stats.twoPointsAttempted > 0
                                ? `${((team.stats.twoPointsMade / team.stats.twoPointsAttempted) * 100).toFixed(1)}%`
                                : '0.0%'}
                        </Td>
                    </tr>
                    <tr>
                        <Td>三分球</Td>
                        <Td>{team.stats.threePointsMade}</Td>
                        <Td>{team.stats.threePointsAttempted}</Td>
                        <Td>
                            {team.stats.threePointsAttempted > 0
                                ? `${((team.stats.threePointsMade / team.stats.threePointsAttempted) * 100).toFixed(1)}%`
                                : '0.0%'}
                        </Td>
                    </tr>
                    <tr>
                        <Td>罚球</Td>
                        <Td>{team.stats.freeThrowsMade}</Td>
                        <Td>{team.stats.freeThrowsAttempted}</Td>
                        <Td>
                            {team.stats.freeThrowsAttempted > 0
                                ? `${((team.stats.freeThrowsMade / team.stats.freeThrowsAttempted) * 100).toFixed(1)}%`
                                : '0.0%'}
                        </Td>
                    </tr>
                </tbody>
            </StatsTable>
        </StatsContainer>
    );
}; 