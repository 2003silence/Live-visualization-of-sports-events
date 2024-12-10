// 添加到文件开头
export interface GameDataEvent {
    time: string;
    homeTeamAction: string;
    score: string;
    awayTeamAction: string;
}

// 添加游戏数据类型
export interface GameDataInfo {
    id: string;
    date: string;
    venue: string;
    homeTeam: {
        id: string;
        name: string;
        logo: string;
    };
    awayTeam: {
        id: string;
        name: string;
        logo: string;
    };
}

// 添加原始游戏数据类型
export interface RawGameData {
    [key: string]: {
        data: string;
        info: GameDataInfo;
    };
}

// 球员
export interface Player {
    id: string;
    name: string;
    number: string;
    position: string;
    team: string;
    stats: PlayerStats;
}

// 球员统计数据
export interface PlayerStats {
    // 基础数据
    points: number;
    rebounds: number;
    assists: number;
    steals: number;
    blocks: number;
    fouls: number;
    turnovers: number;
    playTime: number;  // 上场时间（分钟）

    // 投篮数据
    twoPointsMade: number;
    twoPointsAttempted: number;
    threePointsMade: number;
    threePointsAttempted: number;
    freeThrowsMade: number;
    freeThrowsAttempted: number;

    // 篮板细分
    offensiveRebounds: number;
    defensiveRebounds: number;
}

// 球队
export interface Team {
    id: string;
    name: string;
    logo: string;
    players: Player[];
    stats: TeamStats;
}

// 球队统计数据
export interface TeamStats {
    points: number;
    rebounds: number;
    assists: number;
    steals: number;
    blocks: number;
    fouls: number;
    turnovers: number;
    twoPointsMade: number;
    twoPointsAttempted: number;
    threePointsMade: number;
    threePointsAttempted: number;
    freeThrowsMade: number;
    freeThrowsAttempted: number;
    offensiveRebounds: number;
    defensiveRebounds: number;
}

// 比赛事件
export interface GameEvent {
    id: string;
    type: GameEventType;
    team: 'home' | 'away';
    player: string;
    time: string;
    quarter: number;
    score?: {
        home: number;
        away: number;
    };
    isOffensive?: boolean;
    description?: string;
}

// 事件类型
export enum GameEventType {
    GAME_START = 'GAME_START',
    GAME_END = 'GAME_END',
    QUARTER_START = 'QUARTER_START',
    QUARTER_END = 'QUARTER_END',
    TWO_POINTS_MADE = 'TWO_POINTS_MADE',
    TWO_POINTS_MISSED = 'TWO_POINTS_MISSED',
    THREE_POINTS_MADE = 'THREE_POINTS_MADE',
    THREE_POINTS_MISSED = 'THREE_POINTS_MISSED',
    FREE_THROW_MADE = 'FREE_THROW_MADE',
    FREE_THROW_MISSED = 'FREE_THROW_MISSED',
    REBOUND = 'REBOUND',
    ASSIST = 'ASSIST',
    BLOCK = 'BLOCK',
    STEAL = 'STEAL',
    FOUL = 'FOUL',
    TURNOVER = 'TURNOVER',
    TIMEOUT = 'TIMEOUT',
    SUBSTITUTION = 'SUBSTITUTION',
    JUMP_BALL = 'JUMP_BALL',
    VIOLATION = 'VIOLATION',
    UNKNOWN = 'UNKNOWN'
}

// 比赛状态
export interface GameState {
    id: string;
    homeTeam: Team;
    awayTeam: Team;
    quarter: number;
    time: string;
    events: GameEvent[];
    status: GameStatus;
}

// 比赛状态枚举
export enum GameStatus {
    NOT_STARTED = 'NOT_STARTED',
    IN_PROGRESS = 'IN_PROGRESS',
    FINISHED = 'FINISHED'
} 