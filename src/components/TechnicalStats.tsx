import React from 'react';
import styled from 'styled-components';
import { Team } from '../types';

const Table = styled.table`
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
    font-size: 14px;
`;

const Th = styled.th`
    padding: 8px;
    text-align: center;
    background-color: #f8f9fa;
    border: 1px solid #dee2e6;
`;

const Td = styled.td`
    padding: 8px;
    text-align: center;
    border: 1px solid #dee2e6;
`;

const PlayerName = styled.td`
    padding: 8px;
    text-align: left;
    border: 1px solid #dee2e6;
    min-width: 120px;
`;

const Position = styled.span`
    color: #666;
    margin-left: 8px;
`;

interface TechnicalStatsProps {
    team: Team;
}

export const TechnicalStats: React.FC<TechnicalStatsProps> = ({ team }) => {
    // 计算球队总数据
    const teamTotals = team.players.reduce((totals, player) => ({
        playTime: totals.playTime + player.stats.playTime,
        twoPointsMade: totals.twoPointsMade + player.stats.twoPointsMade,
        twoPointsAttempted: totals.twoPointsAttempted + player.stats.twoPointsAttempted,
        threePointsMade: totals.threePointsMade + player.stats.threePointsMade,
        threePointsAttempted: totals.threePointsAttempted + player.stats.threePointsAttempted,
        freeThrowsMade: totals.freeThrowsMade + player.stats.freeThrowsMade,
        freeThrowsAttempted: totals.freeThrowsAttempted + player.stats.freeThrowsAttempted,
        offensiveRebounds: totals.offensiveRebounds + player.stats.offensiveRebounds,
        defensiveRebounds: totals.defensiveRebounds + player.stats.defensiveRebounds,
        rebounds: totals.rebounds + player.stats.rebounds,
        assists: totals.assists + player.stats.assists,
        fouls: totals.fouls + player.stats.fouls,
        steals: totals.steals + player.stats.steals,
        turnovers: totals.turnovers + player.stats.turnovers,
        blocks: totals.blocks + player.stats.blocks,
        points: totals.points + player.stats.points
    }), {
        playTime: 0,
        twoPointsMade: 0,
        twoPointsAttempted: 0,
        threePointsMade: 0,
        threePointsAttempted: 0,
        freeThrowsMade: 0,
        freeThrowsAttempted: 0,
        offensiveRebounds: 0,
        defensiveRebounds: 0,
        rebounds: 0,
        assists: 0,
        fouls: 0,
        steals: 0,
        turnovers: 0,
        blocks: 0,
        points: 0
    });

    const formatShootingStats = (made: number, attempted: number) => 
        `${made}-${attempted}`;

    const calculatePercentage = (made: number, attempted: number) =>
        attempted > 0 ? ((made / attempted) * 100).toFixed(1) : '0.0';

    return (
        <Table>
            <thead>
                <tr>
                    <Th>球员</Th>
                    <Th>位置</Th>
                    <Th>时间</Th>
                    <Th>投篮</Th>
                    <Th>三分</Th>
                    <Th>罚球</Th>
                    <Th>进攻</Th>
                    <Th>防守</Th>
                    <Th>总计</Th>
                    <Th>助攻</Th>
                    <Th>犯规</Th>
                    <Th>抢断</Th>
                    <Th>失误</Th>
                    <Th>盖帽</Th>
                    <Th>得分</Th>
                </tr>
            </thead>
            <tbody>
                {team.players.map(player => (
                    <tr key={player.id}>
                        <PlayerName>
                            {player.name}
                            <Position>{player.position}</Position>
                        </PlayerName>
                        <Td>{player.position}</Td>
                        <Td>{player.stats.playTime}</Td>
                        <Td>
                            {formatShootingStats(
                                player.stats.twoPointsMade + player.stats.threePointsMade,
                                player.stats.twoPointsAttempted + player.stats.threePointsAttempted
                            )}
                        </Td>
                        <Td>
                            {formatShootingStats(
                                player.stats.threePointsMade,
                                player.stats.threePointsAttempted
                            )}
                        </Td>
                        <Td>
                            {formatShootingStats(
                                player.stats.freeThrowsMade,
                                player.stats.freeThrowsAttempted
                            )}
                        </Td>
                        <Td>{player.stats.offensiveRebounds}</Td>
                        <Td>{player.stats.defensiveRebounds}</Td>
                        <Td>{player.stats.rebounds}</Td>
                        <Td>{player.stats.assists}</Td>
                        <Td>{player.stats.fouls}</Td>
                        <Td>{player.stats.steals}</Td>
                        <Td>{player.stats.turnovers}</Td>
                        <Td>{player.stats.blocks}</Td>
                        <Td>{player.stats.points}</Td>
                    </tr>
                ))}
            </tbody>
            <tfoot>
                <tr>
                    <Td colSpan={2}>总计</Td>
                    <Td>{teamTotals.playTime}</Td>
                    <Td>{formatShootingStats(
                        teamTotals.twoPointsMade + teamTotals.threePointsMade,
                        teamTotals.twoPointsAttempted + teamTotals.threePointsAttempted
                    )}</Td>
                    <Td>{formatShootingStats(
                        teamTotals.threePointsMade,
                        teamTotals.threePointsAttempted
                    )}</Td>
                    <Td>{formatShootingStats(
                        teamTotals.freeThrowsMade,
                        teamTotals.freeThrowsAttempted
                    )}</Td>
                    <Td>{teamTotals.offensiveRebounds}</Td>
                    <Td>{teamTotals.defensiveRebounds}</Td>
                    <Td>{teamTotals.rebounds}</Td>
                    <Td>{teamTotals.assists}</Td>
                    <Td>{teamTotals.fouls}</Td>
                    <Td>{teamTotals.steals}</Td>
                    <Td>{teamTotals.turnovers}</Td>
                    <Td>{teamTotals.blocks}</Td>
                    <Td>{teamTotals.points}</Td>
                </tr>
                <tr>
                    <Td colSpan={3}>命中率</Td>
                    <Td>
                        {calculatePercentage(
                            teamTotals.twoPointsMade + teamTotals.threePointsMade,
                            teamTotals.twoPointsAttempted + teamTotals.threePointsAttempted
                        )}%
                    </Td>
                    <Td>
                        {calculatePercentage(
                            teamTotals.threePointsMade,
                            teamTotals.threePointsAttempted
                        )}%
                    </Td>
                    <Td>
                        {calculatePercentage(
                            teamTotals.freeThrowsMade,
                            teamTotals.freeThrowsAttempted
                        )}%
                    </Td>
                    <Td colSpan={9}></Td>
                </tr>
            </tfoot>
        </Table>
    );
}; 