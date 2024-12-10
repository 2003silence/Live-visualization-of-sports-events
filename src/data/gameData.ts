import { gameData as lakersVsWolvesData, gameInfo as lakersVsWolvesInfo } from './raw/lakers_vs_wolves';
import { GameDataEvent, RawGameData, GameDataInfo } from '../types';

// 导出原始数据
export const rawGames: RawGameData = {
    lakers_vs_wolves: {
        data: lakersVsWolvesData,
        info: lakersVsWolvesInfo
    }
};

// 数据处理函数
export const parseGameData = (data: string): GameDataEvent[] => {
    return data
        .split('\n')
        .filter(line => {
            const trimmed = line.trim();
            return trimmed && 
                   !trimmed.includes('时间') &&
                   !trimmed.includes('第') &&
                   !trimmed.startsWith('时间');
        })
        .map(line => {
            const [time, homeAction, score, awayAction] = line.split('\t');
            return {
                time,
                homeTeamAction: homeAction || '',
                score: score || '',
                awayTeamAction: awayAction || ''
            };
        });
};

// 获取比赛信息
export const getGameInfo = (gameId: string): GameDataInfo | undefined => {
    return rawGames[gameId]?.info;
};

// 获取比赛数据
export const getGameData = (gameId: string): string | undefined => {
    return rawGames[gameId]?.data;
};

// 获取可用的比赛列表
export const getAvailableGames = () => {
    return Object.entries(rawGames).map(([gameId, game]) => ({
        gameId,
        ...game.info
    }));
};

// 导出当前比赛数据（用于兼容现有代码）
export const gameData = rawGames.lakers_vs_wolves.data;