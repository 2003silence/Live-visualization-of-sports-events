import { GameEvent, GameEventType } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export class EventParser {
    private static instance: EventParser;
    private previousPoints: { [key: string]: number } = {};  // 记录每个球员的上一次得分

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

        for (const line of lines) {
            // 跳过表头和节开始/结束的行
            if (line.includes('时间') || 
                line.includes('第') && line.includes('节开始') || 
                line.includes('节结束') ||
                line.includes('全场结束')) {
                continue;
            }

            const lineEvents = this.parseLine(line, currentQuarter);
            events.push(...lineEvents);  // 添加所有事件
        }

        return events;
    }

    private parseLine(line: string, quarter: number): GameEvent[] {  // 改为返回数组
        const parts = line.split('\t');
        console.log('Line parts:', parts);

        const time = parts[0];
        const homeAction = parts[1] || '';
        const score = parts[2] || '';
        const awayAction = parts[3] || '';

        const events: GameEvent[] = [];

        // 解析比分
        const scoreMatch = score?.match(/(\d+)-(\d+)/);
        const currentScore = scoreMatch ? {
            home: parseInt(scoreMatch[1]),
            away: parseInt(scoreMatch[2])
        } : undefined;

        // 处理主队事件
        if (homeAction && !homeAction.includes('节')) {
            const event = this.parseAction(homeAction, 'home', quarter, time);
            if (event) {
                event.score = currentScore;
                events.push(event);

                // 检查助攻格式并打印出来
                console.log('Checking assist in:', homeAction);
                if (homeAction.includes('助攻')) {
                    const fullText = homeAction;
                    console.log('Full text with assist:', fullText);
                }

                // 修改助攻匹配正则表达式
                const assistMatch = homeAction.match(/\(([^)]+?)\s+\d+\s*次助攻\)/);
                if (assistMatch && (event.type === GameEventType.TWO_POINTS_MADE || 
                                  event.type === GameEventType.THREE_POINTS_MADE)) {
                    const assistPlayer = assistMatch[1];
                    console.log('Found assist:', {
                        action: homeAction,
                        assistPlayer,
                        match: assistMatch,
                        groups: assistMatch.groups,
                        fullMatch: assistMatch[0]
                    });

                    // 验证球员名字是否在列表中
                    if (this.isValidPlayerName(assistPlayer)) {
                        const assistEvent: GameEvent = {
                            id: crypto.randomUUID(),
                            type: GameEventType.ASSIST,
                            team: 'home',
                            quarter,
                            time,
                            player: assistPlayer,
                            points: 0,
                            isOffensive: false,
                            description: `${assistPlayer} 助攻`
                        };
                        events.push(assistEvent);
                    } else {
                        console.warn('Invalid assist player name:', assistPlayer);
                    }
                }
            }
        }

        // 处理客队事件
        if (awayAction && !awayAction.includes('节')) {
            const event = this.parseAction(awayAction, 'away', quarter, time);
            if (event) {
                event.score = currentScore;
                events.push(event);

                const assistMatch = awayAction.match(/\(([^)]+?)\s+\d+\s*次助攻\)/);
                if (assistMatch && (event.type === GameEventType.TWO_POINTS_MADE || 
                                  event.type === GameEventType.THREE_POINTS_MADE)) {
                    const assistPlayer = assistMatch[1];
                    console.log('Found assist:', {
                        action: awayAction,
                        assistPlayer,
                        match: assistMatch,
                        groups: assistMatch.groups,
                        fullMatch: assistMatch[0]
                    });

                    // 验证球员名字是否在列表中
                    if (this.isValidPlayerName(assistPlayer)) {
                        const assistEvent: GameEvent = {
                            id: crypto.randomUUID(),
                            type: GameEventType.ASSIST,
                            team: 'away',
                            quarter,
                            time,
                            player: assistPlayer,
                            points: 0,
                            isOffensive: false,
                            description: `${assistPlayer} 助攻`
                        };
                        events.push(assistEvent);
                    } else {
                        console.warn('Invalid assist player name:', assistPlayer);
                    }
                }
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
        const players = [
            'L. 勒布朗-詹姆斯', '戴维斯', '八村塁', '里维斯', '拉塞尔',
            '克内克特', '马克斯·克里斯蒂', '贾克森-海耶斯', '文森特',
            'B. 勒布朗-詹姆斯',
            '爱德华兹', '戈贝尔', '康利', '朱利叶斯-兰德尔',
            '杰登-麦克丹尼尔斯', '迪温琴佐', '拿斯列特',
            '尼基尔-亚历山大-沃克', '乔-英格尔斯'
        ];

        for (const player of players) {
            if (action.startsWith(player)) {
                return player;
            }
        }

        return null;
    }

    private determineEventType(action: string): GameEventType {
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
        
        // 换人
        if (action.includes('换下')) return GameEventType.SUBSTITUTION;
        
        return GameEventType.UNKNOWN;
    }

    // 添加一个方法来验证球员名字
    private isValidPlayerName(name: string): boolean {
        const players = [
            'L. 勒布朗-詹姆斯', '戴维斯', '八村塁', '里维斯', '拉塞尔',
            '克内克特', '马克斯·克里斯蒂', '贾克森-海耶斯', '文森特',
            'B. 勒布朗-詹姆斯',
            '爱德华兹', '戈贝尔', '康利', '朱利叶斯-兰德尔',
            '杰登-麦克丹尼尔斯', '迪温琴佐', '拿斯列特',
            '尼基尔-亚历山大-沃克', '乔-英格尔斯'
        ];

        return players.includes(name);
    }
} 