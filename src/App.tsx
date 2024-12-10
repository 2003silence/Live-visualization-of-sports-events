import React, { useState, useEffect, useRef } from 'react';
import { GameViewer } from './components/GameViewer';
import { StatsViewer } from './components/StatsViewer';
import { Loading } from './components/Loading';
import { GameState, GameStatus, Team, Player, GameEventType, GameEvent } from './types';
import { EventParser } from './core/parser/EventParser';
import { gameData } from './data/gameData';
import { GameControl } from './components/GameControl';
import { GameProgress } from './components/GameProgress';

const App: React.FC = () => {
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingMessage, setLoadingMessage] = useState('初始化系统...');
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentEventIndex, setCurrentEventIndex] = useState(0);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const playIntervalRef = useRef<ReturnType<typeof setInterval>>();

    // 初始化球员数据
    const initializePlayers = (teamId: string, playerNames: string[]): Player[] => {
        return playerNames.map(name => ({
            id: `${teamId}-${name}`,
            name,
            number: '', // 可以后续添加球衣号码
            position: '', // 可以后续添加位置信息
            team: teamId,
            stats: {
                points: 0,
                rebounds: 0,
                assists: 0,
                steals: 0,
                blocks: 0,
                fouls: 0,
                turnovers: 0,
                playTime: 0,
                twoPointsMade: 0,
                twoPointsAttempted: 0,
                threePointsMade: 0,
                threePointsAttempted: 0,
                freeThrowsMade: 0,
                freeThrowsAttempted: 0,
                offensiveRebounds: 0,
                defensiveRebounds: 0
            }
        }));
    };

    // 创建一个辅助函数来初始化统计数据
    const createEmptyStats = () => ({
        points: 0,
        rebounds: 0,
        assists: 0,
        steals: 0,
        blocks: 0,
        fouls: 0,
        turnovers: 0,
        twoPointsMade: 0,
        twoPointsAttempted: 0,
        threePointsMade: 0,
        threePointsAttempted: 0,
        freeThrowsMade: 0,
        freeThrowsAttempted: 0,
        offensiveRebounds: 0,
        defensiveRebounds: 0
    });

    // 修改初始化球队数据的函数
    const initializeTeams = (): { homeTeam: Team; awayTeam: Team } => {
        const lakersPlayers = [
            'L. 勒布朗-詹姆斯',
            '戴维斯',
            '八村塁',
            '里维斯',
            '拉塞尔',
            '克内克特',
            '马克斯·克里斯蒂',
            '贾克森-海耶斯',
            '文森特'
        ];

        const wolvesPlayers = [
            '爱德华兹',
            '戈贝尔',
            '康利',
            '朱利叶斯-兰德尔',
            '杰登-麦克丹尼尔斯',
            '迪温琴佐',
            '拿斯列特',
            '尼基尔-亚历山大-沃克',
            '乔-英格尔斯'
        ];

        const homeTeam: Team = {
            id: 'home',
            name: '洛杉矶湖人',
            logo: '/assets/images/lakers.png',
            players: initializePlayers('home', lakersPlayers),
            stats: createEmptyStats()
        };

        const awayTeam: Team = {
            id: 'away',
            name: '明尼苏达森林狼',
            logo: '/assets/images/timberwolves.png',
            players: initializePlayers('away', wolvesPlayers),
            stats: createEmptyStats()
        };

        return { homeTeam, awayTeam };
    };

    const processEvent = (state: GameState, event: GameEvent) => {
        const team = event.team === 'home' ? state.homeTeam : state.awayTeam;
        const player = team.players.find(p => p.name === event.player);

        if (player) {
            // 更新上场时间
            if (event.time) {
                const [minutes] = event.time.split(':').map(Number);
                player.stats.playTime = minutes;
            }

            switch (event.type) {
                case GameEventType.TWO_POINTS_MADE:
                    player.stats.points += 2;
                    player.stats.twoPointsMade += 1;
                    player.stats.twoPointsAttempted += 1;
                    team.stats.points += 2;
                    team.stats.twoPointsMade += 1;
                    team.stats.twoPointsAttempted += 1;
                    break;
                case GameEventType.THREE_POINTS_MADE:
                    player.stats.points += 3;
                    player.stats.threePointsMade += 1;
                    player.stats.threePointsAttempted += 1;
                    team.stats.points += 3;
                    team.stats.threePointsMade += 1;
                    team.stats.threePointsAttempted += 1;
                    break;
                case GameEventType.TWO_POINTS_MISSED:
                    player.stats.twoPointsAttempted += 1;
                    team.stats.twoPointsAttempted += 1;
                    break;
                case GameEventType.THREE_POINTS_MISSED:
                    player.stats.threePointsAttempted += 1;
                    team.stats.threePointsAttempted += 1;
                    break;
                case GameEventType.FREE_THROW_MADE:
                    player.stats.points += 1;
                    player.stats.freeThrowsMade += 1;
                    player.stats.freeThrowsAttempted += 1;
                    team.stats.points += 1;
                    team.stats.freeThrowsMade += 1;
                    team.stats.freeThrowsAttempted += 1;
                    break;
                case GameEventType.FREE_THROW_MISSED:
                    player.stats.freeThrowsAttempted += 1;
                    team.stats.freeThrowsAttempted += 1;
                    break;
                case GameEventType.REBOUND:
                    if (event.isOffensive) {
                        player.stats.offensiveRebounds += 1;
                        player.stats.rebounds += 1;
                        team.stats.offensiveRebounds += 1;
                        team.stats.rebounds += 1;
                    } else {
                        player.stats.defensiveRebounds += 1;
                        player.stats.rebounds += 1;
                        team.stats.defensiveRebounds += 1;
                        team.stats.rebounds += 1;
                    }
                    break;
                case GameEventType.ASSIST:
                    player.stats.assists += 1;
                    team.stats.assists += 1;
                    break;
                case GameEventType.BLOCK:
                    player.stats.blocks += 1;
                    team.stats.blocks += 1;
                    break;
                case GameEventType.STEAL:
                    player.stats.steals += 1;
                    team.stats.steals += 1;
                    break;
                case GameEventType.FOUL:
                    player.stats.fouls += 1;
                    team.stats.fouls += 1;
                    break;
                case GameEventType.TURNOVER:
                    player.stats.turnovers += 1;
                    team.stats.turnovers += 1;
                    break;
            }

            // 更新比分
            if (event.score) {
                state.homeTeam.stats.points = event.score.home;
                state.awayTeam.stats.points = event.score.away;
            }
        }

        // 更新比赛时间和节数
        state.time = event.time;
        state.quarter = event.quarter;
    };

    const loadGameData = async () => {
        try {
            setLoadingMessage('加载比赛数据...');
            console.log('Loading game data...');
            
            setLoadingMessage('解析比赛事件...');
            const events = EventParser.getInstance().parseEventText(gameData);
            console.log(`Parsed ${events.length} events:`, events);
            
            setLoadingMessage('处理比赛数据...');
            const { homeTeam, awayTeam } = initializeTeams();
            console.log('Teams initialized:', { homeTeam, awayTeam });
            
            const initialState: GameState = {
                id: 'game1',
                homeTeam,
                awayTeam,
                quarter: 1,
                time: '12:00',
                events,
                status: GameStatus.IN_PROGRESS
            };

            console.log('Setting initial state:', initialState);
            setGameState(initialState);
            setLoading(false);
            console.log('Game state initialized successfully');
        } catch (error) {
            console.error('Failed to load game data:', error);
            setLoadingMessage('加载失败，请刷新重试');
        }
    };

    const handlePlay = () => {
        setIsPlaying(true);
        playIntervalRef.current = setInterval(() => {
            setCurrentEventIndex(prev => {
                if (prev >= (gameState?.events.length || 0) - 1) {
                    handlePause();
                    return prev;
                }
                return prev + 1;
            });
        }, 1000 / playbackSpeed);
    };

    const handlePause = () => {
        setIsPlaying(false);
        if (playIntervalRef.current) {
            clearInterval(playIntervalRef.current);
        }
    };

    const handleNext = () => {
        if (!gameState) return;
        
        const nextIndex = Math.min(currentEventIndex + 1, gameState.events.length - 1);
        if (nextIndex !== currentEventIndex) {
            setCurrentEventIndex(nextIndex);
        }
    };

    const handlePrev = () => {
        if (!gameState) return;
        
        if (currentEventIndex > 0) {
            // 重新初始化状态
            const { homeTeam, awayTeam } = initializeTeams();
            const newState: GameState = {
                ...gameState,
                homeTeam,
                awayTeam,
                quarter: 1,
                time: '12:00'
            };

            // 重新处理到当前事件之前的所有事件
            for (let i = 0; i < currentEventIndex - 1; i++) {
                processEvent(newState, gameState.events[i]);
            }

            setGameState(newState);
            setCurrentEventIndex(currentEventIndex - 1);
        }
    };

    const handleSpeedChange = (speed: number) => {
        setPlaybackSpeed(speed);
        if (isPlaying) {
            handlePause();
            handlePlay();
        }
    };

    const handleSeek = (index: number) => {
        if (isPlaying) {
            handlePause();
        }
        
        // 重新初始化状态
        const { homeTeam, awayTeam } = initializeTeams();
        const newState: GameState = {
            ...gameState!,
            homeTeam,
            awayTeam,
            quarter: 1,
            time: '12:00'
        };

        // 重新处理到目标事件之前的所有事件
        for (let i = 0; i <= index; i++) {
            processEvent(newState, gameState!.events[i]);
        }

        setGameState(newState);
        setCurrentEventIndex(index);
    };

    // 监听当前事件索引变化
    useEffect(() => {
        if (!gameState || currentEventIndex >= gameState.events.length) return;

        const currentEvent = gameState.events[currentEventIndex];
        const newState = { ...gameState };
        processEvent(newState, currentEvent);
        setGameState(newState);
    }, [currentEventIndex]);

    // 添加初始化的 useEffect
    useEffect(() => {
        loadGameData();
    }, []); // 只在组件挂载时执行一次

    // 清理定时器的 useEffect 保持不变
    useEffect(() => {
        return () => {
            if (playIntervalRef.current) {
                clearInterval(playIntervalRef.current);
            }
        };
    }, []);

    if (loading) {
        return <Loading message={loadingMessage} />;
    }

    if (!gameState) {
        return <Loading message="初始化游戏状态..." />;
    }

    return (
        <div className="app" style={{ padding: '20px' }}>
            <header>
                <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>
                    体育赛事直播可视化系统
                </h1>
            </header>
            {gameState && (
                <>
                    <GameControl
                        gameState={gameState}
                        onPlay={handlePlay}
                        onPause={handlePause}
                        onNext={handleNext}
                        onPrev={handlePrev}
                        onSpeedChange={handleSpeedChange}
                        isPlaying={isPlaying}
                        currentSpeed={playbackSpeed}
                    />
                    <GameProgress
                        gameState={gameState}
                        currentEventIndex={currentEventIndex}
                        onSeek={handleSeek}
                    />
                </>
            )}
            <main style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
                <GameViewer gameState={gameState} currentEventIndex={currentEventIndex} />
                <StatsViewer 
                    homeTeam={gameState.homeTeam}
                    awayTeam={gameState.awayTeam}
                />
            </main>
        </div>
    );
};

export default App; 