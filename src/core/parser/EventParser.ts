import { GameEvent, GameEventType } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export class EventParser {
    private static instance: EventParser;

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

            const event = this.parseLine(line, currentQuarter);
            if (event) {
                events.push(event);
            }
        }

        return events;
    }

    private parseLine(line: string, quarter: number): GameEvent | null {
        // 分割时间、主队动作、比分、客队动作
        const parts = line.split('\t').filter(Boolean);
        if (parts.length < 2) return null;

        const time = parts[0];
        const homeAction = parts[1];
        const score = parts[2];
        const awayAction = parts[3];

        const events: GameEvent[] = [];

        // 解析比分
        const scoreMatch = score?.match(/(\d+)-(\d+)/);
        const currentScore = scoreMatch ? {
            home: parseInt(scoreMatch[1]),
            away: parseInt(scoreMatch[2])
        } : undefined;

        // 处理主队事件
        if (homeAction && !homeAction.includes('第') && !homeAction.includes('节')) {
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

        return events[0] || null; // 暂时只返回第一个事件
    }

    private parseAction(action: string, team: 'home' | 'away', quarter: number, time: string): GameEvent | null {
        const player = this.extractPlayerName(action);
        if (!player) return null;

        const type = this.determineEventType(action);
        if (!type) return null;

        // 从括号中提取篮板数据，格式如：(进攻篮板:1 防守篮板:0)
        let isOffensive = false;
        if (type === GameEventType.REBOUND) {
            // 从括号中提取进攻篮板和防守篮板的数量
            const reboundMatch = action.match(/\(进攻篮板:(\d+)\s*防守篮板:(\d+)\)/);
            if (reboundMatch) {
                // 直接根据括号里的数字确定是进攻篮板还是防守篮板
                isOffensive = reboundMatch[1] === '1';
            }
        }

        return {
            id: crypto.randomUUID(),
            type,
            team,
            quarter,
            time,
            player,
            isOffensive,
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
        if (action.includes('罚球')) {
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
} 