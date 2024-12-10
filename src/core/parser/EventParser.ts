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
        const lines = text.split('\n');
        let currentQuarter = 1;

        // 跳过表头
        const dataLines = lines.filter(line => {
            const trimmedLine = line.trim();
            return trimmedLine && 
                   !trimmedLine.startsWith('时间') && 
                   !trimmedLine.includes('第') && 
                   !trimmedLine.includes('节开始');
        });

        dataLines.forEach(line => {
            const parts = line.split('\t').filter(Boolean);
            if (parts.length < 3) return;

            const [time, team1Action, scoreStr, team2Action] = parts;
            
            // 解析时间
            const timeMatch = time.match(/(\d+):(\d+)/);
            if (!timeMatch) return;

            // 解析比分
            const scoreMatch = scoreStr.match(/(\d+)-(\d+)/);
            const currentScore = scoreMatch ? {
                home: parseInt(scoreMatch[1]),
                away: parseInt(scoreMatch[2])
            } : null;

            // 创建事件
            if (team1Action && team1Action.trim()) {
                const event = this.parseAction(team1Action, 'home', currentQuarter, time, line);
                if (event) {
                    // 如果是得分事件，添加比分信息
                    if (currentScore && this.isScoringEvent(event.type)) {
                        event.score = currentScore;
                    }
                    events.push(event);
                    console.log('Home event:', event);
                }
            }

            if (team2Action && team2Action.trim()) {
                const event = this.parseAction(team2Action, 'away', currentQuarter, time, line);
                if (event) {
                    // 如果是得分事件，添加比分信息
                    if (currentScore && this.isScoringEvent(event.type)) {
                        event.score = currentScore;
                    }
                    events.push(event);
                    console.log('Away event:', event);
                }
            }
        });

        return events;
    }

    private isScoringEvent(type: GameEventType): boolean {
        return [
            GameEventType.TWO_POINTS_MADE,
            GameEventType.THREE_POINTS_MADE,
            GameEventType.FREE_THROW_MADE
        ].includes(type);
    }

    private createEvent(type: GameEventType, team: string, quarter: number, description: string, time: string = '', player: string = ''): GameEvent {
        return {
            id: uuidv4(),
            type,
            team,
            quarter,
            time,
            player,
            description
        };
    }

    private extractPlayerName(action: string): string {
        // 处理特殊球员名字
        const specialNames = [
            'L. 勒布朗-詹姆斯',
            '戴维斯',
            '八村塁',
            '里维斯',
            '拉塞尔',
            '克内克特',
            '马克斯·克里斯蒂',
            '贾克森-海耶斯',
            '文森特',
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

        // 先检查是否是特殊名字
        for (const name of specialNames) {
            if (action.startsWith(name) || action.includes(` ${name}`)) {
                return name;
            }
        }

        // 处理普通球员名字
        const nameMatch = action.match(/^([^：\s]+(?:[\s·-][^：\s]+)*)/);
        if (nameMatch) {
            const name = nameMatch[1].trim();
            // 过滤掉一些常见的非名字开头
            if (!name.startsWith('第') && 
                !name.startsWith('换人') && 
                !name.startsWith('暂停') && 
                !name.startsWith('球权') &&
                !name.startsWith('湖人') &&
                !name.startsWith('森林狼')) {
                return name;
            }
        }

        return '';
    }

    private parseAction(action: string, team: string, quarter: number, time: string, fullDescription: string): GameEvent | null {
        // 获取球员名字
        const player = this.extractPlayerName(action);
        if (!player) {
            console.log('No player found for action:', action);
            return null;
        }
        
        // 投篮
        if (action.includes('投篮') || action.includes('上篮') || action.includes('扣篮') || action.includes('勾手') || action.includes('补篮')) {
            if (action.includes('命中')) {
                // 提取得分
                const pointsMatch = action.match(/命中\((\d+)分\)/);
                const points = pointsMatch ? parseInt(pointsMatch[1]) : 
                             action.includes('三分') ? 3 : 2;
                
                return {
                    ...this.createEvent(
                        action.includes('三分') ? GameEventType.THREE_POINTS_MADE : GameEventType.TWO_POINTS_MADE,
                        team,
                        quarter,
                        fullDescription,
                        time,
                        player
                    ),
                    points
                };
            }
        }

        // 罚球
        if (action.includes('罚球')) {
            if (action.includes('命中')) {
                return {
                    ...this.createEvent(GameEventType.FREE_THROW_MADE, team, quarter, fullDescription, time, player),
                    points: 1
                };
            }
        }

        // 助攻
        if (action.includes('助攻')) {
            const assistMatch = action.match(/(\d+)\s*次助攻/);
            const assists = assistMatch ? parseInt(assistMatch[1]) : 1;
            return {
                ...this.createEvent(GameEventType.ASSIST, team, quarter, fullDescription, time, player),
                assists
            };
        }

        // 篮板
        if (action.includes('篮板')) {
            const isOffensive = action.includes('进攻篮板');
            return {
                ...this.createEvent(GameEventType.REBOUND, team, quarter, fullDescription, time, player),
                isOffensive
            };
        }

        // 盖帽
        if (action.includes('封盖')) {
            const blockMatch = action.match(/(\d+)\s*次封盖/);
            const blocks = blockMatch ? parseInt(blockMatch[1]) : 1;
            return {
                ...this.createEvent(GameEventType.BLOCK, team, quarter, fullDescription, time, player),
                blocks
            };
        }

        // 抢断
        if (action.includes('抢断')) {
            const stealMatch = action.match(/(\d+)\s*次抢断/);
            const steals = stealMatch ? parseInt(stealMatch[1]) : 1;
            return {
                ...this.createEvent(GameEventType.STEAL, team, quarter, fullDescription, time, player),
                steals
            };
        }

        // 犯规
        if (action.includes('犯规')) {
            const foulMatch = action.match(/(\d+)\s*次犯规/);
            const fouls = foulMatch ? parseInt(foulMatch[1]) : 1;
            return {
                ...this.createEvent(GameEventType.FOUL, team, quarter, fullDescription, time, player),
                fouls
            };
        }

        // 失误
        if (action.includes('失误')) {
            const turnoverMatch = action.match(/(\d+)\s*次失误/);
            const turnovers = turnoverMatch ? parseInt(turnoverMatch[1]) : 1;
            return {
                ...this.createEvent(GameEventType.TURNOVER, team, quarter, fullDescription, time, player),
                turnovers
            };
        }

        return null;
    }

    private extractSubstitutionPlayers(action: string): { in: string; out: string } {
        const match = action.match(/换人：(.+)替换(.+)/);
        if (match) {
            return {
                in: match[1].trim(),
                out: match[2].trim()
            };
        }
        return { in: '', out: '' };
    }

    private parseScore(score: string): { home: number; away: number } {
        const match = score.match(/(\d+)-(\d+)/);
        if (match) {
            return {
                home: parseInt(match[1]),
                away: parseInt(match[2])
            };
        }
        return { home: 0, away: 0 };
    }
} 