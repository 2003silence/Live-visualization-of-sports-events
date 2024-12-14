import { GameEvent, GameEventType } from '../../types';

export class EventParser {
    private static instance: EventParser;
    // 定义一个统一的球员名字映射表
    private readonly playerMappings = {
        'L. 勒布朗-詹姆斯': ['L. 勒布朗-詹姆斯', '勒布朗-詹姆斯', '勒布朗', '詹姆斯', 'L.詹姆斯'],
        '朱利叶斯-兰德尔': ['朱利叶斯-兰德尔', '兰德尔'],
        '杰登-麦克丹尼尔斯': ['杰登-麦克丹尼尔斯', '麦克丹尼尔斯'],
        '尼基尔-亚历山大-沃克': ['尼基尔-亚历山大-沃克', '亚历山大-沃克', '沃克'],
        'B. 勒布朗-詹姆斯': ['B. 勒布朗-詹姆斯', 'B.詹姆斯', 'B.勒布朗-詹姆斯'],
        '马克斯·克里斯蒂': ['马克斯·克里斯蒂', '克里斯蒂'],
        '戴维斯': ['戴维斯', 'A.戴维斯', 'A. 戴维斯'],
        '八村塁': ['八村塁'],
        '里维斯': ['里维斯'],
        '拉塞尔': ['拉塞尔'],
        '文森特': ['文森特'],
        '克内克特': ['克内克特'],
        '贾克森-海耶斯': ['贾克森-海耶斯', '海耶斯'],
        '爱德华兹': ['爱德华兹'],
        '戈贝尔': ['戈贝尔'],
        '康利': ['康利'],
        '迪温琴佐': ['迪温琴佐'],
        '拿斯列特': ['拿斯列特'],
        '乔-英格尔斯': ['乔-英格尔斯', '英格尔斯']
    };

    private constructor() {}

    public static getInstance(): EventParser {
        if (!EventParser.instance) {
            EventParser.instance = new EventParser();
        }
        return EventParser.instance;
    }

    public parseEventText(text: string): GameEvent[] {
        const events: GameEvent[] = [];
        const lines = text.split('\n').filter(line => line.trim());
        let currentQuarter = 1;

        // 用于跟踪球员状态和时间
        const playerStatus: { [key: string]: { inGame: boolean, lastTimeUpdate: string } } = {};
        const playTime: { [key: string]: number } = {};

        // 时间转换函数
        const timeToSeconds = (time: string): number => {
            const [minutes, seconds] = time.split(':').map(Number);
            return minutes * 60 + seconds;
        };

        // 计算时间差（考虑倒计时）
        const calculateTimeDiff = (startTime: string, endTime: string): number => {
            return timeToSeconds(startTime) - timeToSeconds(endTime);
        };

        // 更新所有在场球员的时间
        const updatePlayersTime = (currentTime: string) => {
            let updatedPlayers = new Set<string>();
            Object.entries(playerStatus).forEach(([key, status]) => {
                if (status.inGame) {
                    const timeDiff = calculateTimeDiff(status.lastTimeUpdate, currentTime);
                    if (timeDiff > 0) {
                        playTime[key] = (playTime[key] || 0) + timeDiff;
                        status.lastTimeUpdate = currentTime;
                        updatedPlayers.add(key);
                    }
                }
            });
            if (updatedPlayers.size > 0) {
                console.log(`\n=== Time Update at ${currentTime} ===`);
                console.log('Updated players:', Array.from(updatedPlayers).map(key => ({
                    player: key,
                    time: `${Math.round(playTime[key] / 60)}min`
                })));
            }
            return updatedPlayers;
        };

        // 初始化首发球员
        const homePlayers = [
            'L. 勒布朗-詹姆斯', '戴维斯', '八村塁', '里维斯', '拉塞尔'
        ];
        const awayPlayers = [
            '爱德华兹', '戈贝尔', '康利', '朱利叶斯-兰德尔', '杰登-麦克丹尼尔斯'
        ];

        // 初始化所有球员状态
        const allHomePlayers = [
            'L. 勒布朗-詹姆斯', '戴维斯', '八村塁', '里维斯', '拉塞尔',
            '文森特', '克内克特', '贾克森-海耶斯', '马克斯·克里斯蒂', 'B. 勒布朗-詹姆斯'
        ];
        const allAwayPlayers = [
            '爱德华兹', '戈贝尔', '康利', '朱利叶斯-兰德尔', '杰登-麦克丹尼尔斯',
            '迪温琴佐', '拿斯列特', '尼基尔-亚历山大-沃克', '乔-英格尔斯'
        ];

        // 初始化所有球员状态
        [...allHomePlayers, ...allAwayPlayers].forEach(player => {
            const team = allHomePlayers.includes(player) ? 'home' : 'away';
            const isStarter = (team === 'home' ? homePlayers : awayPlayers).includes(player);
            const key = `${team}-${player}`;
            playerStatus[key] = {
                inGame: isStarter,
                lastTimeUpdate: isStarter ? '12:00' : '00:00'
            };
            playTime[key] = 0;
        });

        // 输出初始状态
        console.log('\n=== Initial Player Status ===');
        Object.entries(playerStatus).forEach(([key, status]) => {
            console.log(`${key}: ${status.inGame ? 'In Game' : 'On Bench'} (Last update: ${status.lastTimeUpdate}, Total: ${Math.round(playTime[key] / 60)}min)`);
        });

        for (const line of lines) {
            // 检查是否是新的一节
            if (line.includes('节开始')) {
                const quarterMatch = line.match(/第(\d+)节/);
                if (quarterMatch) {
                    currentQuarter = parseInt(quarterMatch[1]);
                    console.log(`\n=== Quarter ${currentQuarter} Start ===`);
                    // 重置在场球员的时间
                    Object.entries(playerStatus).forEach(([key, status]) => {
                        if (status.inGame) {
                            status.lastTimeUpdate = '12:00';
                            console.log(`Reset ${key} lastTimeUpdate to 12:00 (Total: ${Math.round(playTime[key] / 60)}min)`);
                        }
                    });
                    events.push({
                        id: crypto.randomUUID(),
                        type: GameEventType.QUARTER_START,
                        team: 'home',
                        player: '',
                        time: '12:00',
                        quarter: currentQuarter,
                        points: 0,
                        isOffensive: false,
                        description: `第${currentQuarter}节开始`
                    });
                    continue;
                }
            }

            const lineEvents = this.parseLine(line, currentQuarter);
            if (lineEvents.length > 0) {
                lineEvents.forEach(event => {
                    // 先更新所有在场球员的时间
                    updatePlayersTime(event.time);

                    if (event.type === GameEventType.SUBSTITUTION) {
                        const subMatch = event.description?.match(/换人：\s*([^替]+?)\s*替换\s*([^替]+)$/);
                        if (subMatch) {
                            const [_, inPlayer, outPlayer] = subMatch;
                            const inPlayerKey = `${event.team}-${inPlayer.trim()}`;
                            const outPlayerKey = `${event.team}-${outPlayer.trim()}`;

                            console.log(`\n=== Substitution at ${event.time} ===`);
                            console.log(`${outPlayer} (${Math.round(playTime[outPlayerKey] / 60)}min) OUT`);
                            console.log(`${inPlayer} (${Math.round(playTime[inPlayerKey] / 60)}min) IN`);

                            // 更新球员状态
                            if (playerStatus[outPlayerKey]) {
                                playerStatus[outPlayerKey].inGame = false;
                                playerStatus[outPlayerKey].lastTimeUpdate = event.time;
                            }
                            if (playerStatus[inPlayerKey]) {
                                playerStatus[inPlayerKey].inGame = true;
                                playerStatus[inPlayerKey].lastTimeUpdate = event.time;
                            }
                        }
                    }
                });
                events.push(...lineEvents);
            }
        }

        // 输出最终状态
        console.log('\n=== Final Player Status ===');
        Object.entries(playerStatus).forEach(([key, status]) => {
            console.log(`${key}: ${status.inGame ? 'In Game' : 'On Bench'} (Last update: ${status.lastTimeUpdate}, Total: ${Math.round(playTime[key] / 60)}min)`);
        });

        return events;
    }

    private parseLine(line: string, quarter: number): GameEvent[] {
        const parts = line.split('\t');

        // 清理并验证时间格式
        let time = parts[0]?.trim() || '12:00';
        // 如果时间前后有空格，去除空格
        time = time.trim();
        // 如果时间格式不正确，使用默认值
        if (!time.match(/^\d{2}:\d{2}$/)) {
            console.warn('Invalid time format:', time);
            time = '12:00';
        }

        const homeAction = parts[1]?.trim() || '';
        const score = parts[2]?.trim() || '';
        const awayAction = parts[3]?.trim() || '';

        const events: GameEvent[] = [];

        // 解析比分
        const scoreMatch = score?.match(/(\d+)-(\d+)/);
        const currentScore = scoreMatch ? {
            home: parseInt(scoreMatch[1]),
            away: parseInt(scoreMatch[2])
        } : undefined;

        // 处理主队事件
        if (homeAction) {
            const event = this.parseAction(homeAction, 'home', quarter, time);
            if (event) {
                event.score = currentScore;
                events.push(event);
            }
        }

        // 处理客队事件
        if (awayAction) {
            const event = this.parseAction(awayAction, 'away', quarter, time);
            if (event) {
                event.score = currentScore;
                events.push(event);
            }
        }

        return events;
    }

    private parseAction(action: string, team: 'home' | 'away', quarter: number, time: string): GameEvent | null {
        const player = this.extractPlayerName(action);
        if (!player) return null;

        const type = this.determineEventType(action);
        if (!type) return null;

        // 从括号中提取当前总得分，格式如：命中(2 分) 或 (两罚)第一罚 命中(1 分)
        let points = 0;
        if (action.includes('罚球') || action.includes('两罚') || action.includes('三罚')) {
            // 罚球命中固定为1分，不管括号里显示的是什么
            if (action.includes('命中')) {
                points = 1;
            }
        } else {
            // 非罚球情况下，从括号中提取得分
            const pointsMatch = action.match(/命中\((\d+)\s*分\)/);
            if (pointsMatch) {
                points = parseInt(pointsMatch[1]);
            }
        }

        // 根据动作描述判断事件类型
        let eventType = type;
        if (action.includes('命中')) {
            if (action.includes('三分')) {
                eventType = GameEventType.THREE_POINTS_MADE;
            } else if (action.includes('罚球') || action.includes('两罚') || action.includes('三罚')) {
                eventType = GameEventType.FREE_THROW_MADE;
            } else {
                eventType = GameEventType.TWO_POINTS_MADE;
            }
        }

        // 如果是投篮不中，也需要记录当前总分
        if (action.includes('不中')) {
            if (action.includes('三分')) {
                eventType = GameEventType.THREE_POINTS_MISSED;
            } else if (action.includes('罚球') || action.includes('两罚') || action.includes('三罚')) {
                eventType = GameEventType.FREE_THROW_MISSED;
            } else {
                eventType = GameEventType.TWO_POINTS_MISSED;
            }
        }

        return {
            id: crypto.randomUUID(),
            type: eventType,
            team,
            quarter,
            time,
            player,
            points,
            isOffensive: type === GameEventType.REBOUND && action.includes('进攻篮板'),
            description: action
        };
    }

    private extractPlayerName(action: string): string | null {
        // 如果是换人事件，需要特殊处理
        if (action.includes('换人：')) {
            const subMatch = action.match(/换人：\s*([^替]+?)\s*替换\s*([^替]+)$/);
            if (subMatch) {
                const [_, inPlayer] = subMatch;
                return inPlayer.trim();
            }
        }

        // 定义所有球员的完整名字和可能的简写映射
        const playerMappings = {
            'L. 勒布朗-詹姆斯': ['L. 勒布朗-詹姆斯', '勒布朗-詹姆斯', '勒布朗', '詹姆斯', 'L.詹姆斯', 'L. 詹姆斯'],
            '戴维斯': ['戴维斯', 'A.戴维斯', 'A. 戴维斯'],
            '八村塁': ['八村塁'],
            '里维斯': ['里维斯'],
            '拉塞尔': ['拉塞尔'],
            '文森特': ['文森特'],
            '克内克特': ['克内克特'],
            '贾克森-海耶斯': ['贾克森-海耶斯', '贾克森海耶斯', '海耶斯'],
            '马克斯·克里斯蒂': ['马克斯·克里斯蒂', '克里斯蒂'],
            'B. 勒布朗-詹姆斯': ['B. 勒布朗-詹姆斯', 'B.詹姆斯', 'B. 詹姆斯', 'B.勒布朗-詹姆斯'],
            '爱德华兹': ['爱德华兹'],
            '戈贝尔': ['戈贝尔'],
            '康利': ['康利'],
            '朱利叶斯-兰德尔': ['朱利叶斯-兰德尔', '兰德尔'],
            '杰登-麦克丹尼尔斯': ['杰登-麦克丹尼尔斯', '麦克丹尼尔斯'],
            '迪温琴佐': ['迪温琴佐'],
            '拿斯列特': ['拿斯列特'],
            '尼基尔-亚历山大-沃克': ['尼基尔-亚历山大-沃克', '亚历山大-沃克', '沃克'],
            '乔-英格尔斯': ['乔-英格尔斯', '英格尔斯']
        };

        // 遍历所有球员名字及其简写
        for (const [fullName, variations] of Object.entries(playerMappings)) {
            for (const variation of variations) {
                if (action.startsWith(variation)) {
                    return fullName;
                }
            }
        }

        return null;
    }

    private determineEventType(action: string): GameEventType {
        // 换人
        if (action.includes('换人：')) return GameEventType.SUBSTITUTION;
        
        // 投篮
        if (action.includes('投篮') || action.includes('上篮') || action.includes('扣篮') || 
            action.includes('勾手') || action.includes('补篮') || action.includes('打板') || 
            action.includes('挑篮')) {
            if (action.includes('命中')) {
                if (action.includes('三分')) return GameEventType.THREE_POINTS_MADE;
                return GameEventType.TWO_POINTS_MADE;
            } else if (action.includes('不中')) {
                if (action.includes('三分')) return GameEventType.THREE_POINTS_MISSED;
                return GameEventType.TWO_POINTS_MISSED;
            }
        }
        
        // 罚球
        if (action.includes('罚球') || action.includes('两罚') || action.includes('三罚')) {
            if (action.includes('命中')) return GameEventType.FREE_THROW_MADE;
            if (action.includes('不中')) return GameEventType.FREE_THROW_MISSED;
        }
        
        // 其他事件
        if (action.includes('篮板')) return GameEventType.REBOUND;
        if (action.includes('助攻')) return GameEventType.ASSIST;
        if (action.includes('封盖')) return GameEventType.BLOCK;
        if (action.includes('抢断')) return GameEventType.STEAL;
        if (action.includes('犯规')) return GameEventType.FOUL;
        if (action.includes('失误')) return GameEventType.TURNOVER;
        
        return GameEventType.UNKNOWN;
    }

    public normalizePlayerName(name: string): string {
        for (const [fullName, variations] of Object.entries(this.playerMappings)) {
            if (variations.some(v => name.includes(v))) {
                return fullName;
            }
        }
        return name;
    }
} 