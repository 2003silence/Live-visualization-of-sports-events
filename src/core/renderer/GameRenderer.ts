import * as PIXI from 'pixi.js';
import { GameEvent, GameState, GameEventType } from '../../types';
import gsap from 'gsap';

export class GameRenderer {
    private app: PIXI.Application;
    private court: PIXI.Container;
    private ball: PIXI.Sprite;
    private players: Map<string, PIXI.Container>;
    private animations: Map<GameEventType, (event: GameEvent) => void>;
    private readonly INITIAL_POSITIONS = {
        home: [
            {x: 150, y: 150},
            {x: 150, y: 300},
            {x: 250, y: 225},
            {x: 300, y: 150},
            {x: 300, y: 300}
        ],
        away: [
            {x: 650, y: 150},
            {x: 650, y: 300},
            {x: 550, y: 225},
            {x: 500, y: 150},
            {x: 500, y: 300}
        ]
    };
    private gameStartText: PIXI.Text | null = null;
    private overlay: PIXI.Graphics | null = null;

    constructor(container: HTMLDivElement) {
        // 创建PIXI应用
        this.app = new PIXI.Application({
            width: 800,
            height: 450,
            backgroundColor: 0x2C2C2C, // 深色背景
            antialias: true
        });
        container.appendChild(this.app.view as unknown as Node);

        // 初始化场景
        this.court = new PIXI.Container();
        this.app.stage.addChild(this.court);
        this.drawCourt();

        // 初始化球员
        this.players = new Map();

        // 创建篮球 - 移到最后创建，确保在最上层
        this.ball = this.createBall();
        this.app.stage.addChild(this.ball); // 直接添加到stage而不是court

        // 初始化动画处理器
        this.animations = new Map();
        this.initializeAnimations();
        
        // 初始化遮罩层
        this.initOverlay();
        
        // 初始化比赛开始文本
        this.initGameStartText();
    }

    private drawCourt() {
        // 创建球场地板
        const floor = new PIXI.Graphics();
        floor.beginFill(0xCD853F); // 木地板颜色
        floor.drawRect(50, 50, 700, 350);
        floor.endFill();

        // 绘制球场线条
        const lines = new PIXI.Graphics();
        lines.lineStyle(2, 0xFFFFFF, 0.8);

        // 球场边界
        lines.drawRect(50, 50, 700, 350);

        // 中场线
        lines.moveTo(400, 50);
        lines.lineTo(400, 400);

        // 中圈
        lines.drawCircle(400, 225, 40);

        // 左侧罚球区
        lines.beginFill(0xCC0000, 0.3); // 红色半透明
        lines.drawRect(50, 125, 150, 200);
        lines.endFill();

        // 右侧罚球区
        lines.beginFill(0xCC0000, 0.3);
        lines.drawRect(600, 125, 150, 200);
        lines.endFill();

        // 三分线
        lines.lineStyle(2, 0xFFFFFF, 0.8);
        lines.moveTo(50, 125);
        lines.arcTo(250, 225, 50, 325, 200);
        lines.lineTo(50, 325);

        lines.moveTo(750, 125);
        lines.arcTo(550, 225, 750, 325, 200);
        lines.lineTo(750, 325);

        // 篮板和篮筐
        const leftBasket = new PIXI.Graphics();
        leftBasket.lineStyle(3, 0xFF0000);
        leftBasket.drawRect(40, 200, 2, 50);
        leftBasket.drawCircle(60, 225, 10);

        const rightBasket = new PIXI.Graphics();
        rightBasket.lineStyle(3, 0xFF0000);
        rightBasket.drawRect(758, 200, 2, 50);
        rightBasket.drawCircle(740, 225, 10);

        // 添加广告牌
        const ads = new PIXI.Graphics();
        ads.beginFill(0x333333);
        for (let i = 0; i < 5; i++) {
            ads.drawRect(100 + i * 140, 20, 100, 20);
        }
        ads.endFill();

        this.court.addChild(floor);
        this.court.addChild(lines);
        this.court.addChild(leftBasket);
        this.court.addChild(rightBasket);
        this.court.addChild(ads);
    }

    private createBall(): PIXI.Sprite {
        const ball = new PIXI.Graphics();
        ball.beginFill(0xFFA500);
        ball.drawCircle(0, 0, 8);
        ball.endFill();
        
        const sprite = new PIXI.Sprite(this.app.renderer.generateTexture(ball));
        sprite.anchor.set(0.5);
        sprite.position.set(400, 225);
        return sprite;
    }

    private createPlayer(team: string, number: string): PIXI.Container {
        const player = new PIXI.Container();

        // 球员图标 - 增大尺寸并添加边框
        const icon = new PIXI.Graphics();
        icon.lineStyle(2, 0xFFFFFF); // 添加白色边框
        icon.beginFill(team === 'home' ? 0xFF0000 : 0x0000FF);
        icon.drawCircle(0, 0, 15); // 增大半径到15
        icon.endFill();

        // 球员号码 - 调整字体大小
        const text = new PIXI.Text(number, {
            fontSize: 12,
            fill: 0xFFFFFF,
            fontWeight: 'bold'
        });
        text.anchor.set(0.5);

        player.addChild(icon);
        player.addChild(text);
        return player;
    }

    private initializeAnimations() {
        this.animations.set(GameEventType.TWO_POINTS_MADE, this.animateShot.bind(this));
        this.animations.set(GameEventType.THREE_POINTS_MADE, this.animateShot.bind(this));
        this.animations.set(GameEventType.FREE_THROW_MADE, this.animateShot.bind(this));
        this.animations.set(GameEventType.REBOUND, this.animateRebound.bind(this));
        this.animations.set(GameEventType.BLOCK, this.animateBlock.bind(this));
        this.animations.set(GameEventType.FOUL, this.animateFoul.bind(this));
        this.animations.set(GameEventType.TURNOVER, this.animateTurnover.bind(this));
    }

    private animateShot(event: GameEvent) {
        const isHome = event.team === 'home';
        const startPos = this.getStartPosition(event);
        const endPos = this.getBasketPosition(isHome);
        const controlPoint = this.getControlPoint(startPos, endPos, event.type);

        // 随机选择投篮和防守球员
        const shooter = this.getRandomPlayer(event.team);
        const defender = this.getRandomPlayer(isHome ? 'away' : 'home');
        
        if (!shooter || !defender) return;

        // 计算球员的起始位置 - 投篮球员在投篮位置，防守球员在旁边
        const shooterStartPos = startPos; // 投篮球员直接使用投篮位置
        const defenderStartPos = this.getRandomPositionNearBall(startPos.x, startPos.y, 30, event.team !== 'home');

        const tl = gsap.timeline();

        // 1. 先移动球员到位置
        tl.to([shooter.position, defender.position], {
            duration: 0.3,
            x: (target: any) => target === shooter.position ? shooterStartPos.x : defenderStartPos.x,
            y: (target: any) => target === shooter.position ? shooterStartPos.y : defenderStartPos.y,
            ease: "power1.inOut"
        });

        // 2. 球移动到投篮球员位置
        tl.to(this.ball, {
            duration: 0.3,
            x: shooterStartPos.x,
            y: shooterStartPos.y,
            ease: "power1.inOut"
        }, "-=0.3");

        // 3. 球直接移动到篮筐
        tl.to(this.ball, {
            duration: 0.4,
            x: endPos.x,
            y: endPos.y,
            ease: "power1.inOut",
            onComplete: () => {
                // 显示特效
                if (event.type === GameEventType.THREE_POINTS_MADE) {
                    // 三分命中特效
                    const threePointText = new PIXI.Text('3分!', {
                        fontFamily: 'Arial',
                        fontSize: 32,
                        fill: ['#FFD700', '#FFA500'],
                        fontWeight: 'bold',
                        stroke: '#FFFFFF',
                        strokeThickness: 4,
                        dropShadow: true,
                        dropShadowColor: 0x000000,
                        dropShadowBlur: 4,
                        dropShadowDistance: 2
                    });
                    threePointText.anchor.set(0.5);
                    threePointText.position.set(endPos.x, endPos.y - 50);
                    threePointText.alpha = 0;
                    this.app.stage.addChild(threePointText);

                    gsap.to(threePointText, {
                        duration: 0.5,
                        alpha: 1,
                        y: threePointText.y - 30,
                        ease: "elastic.out",
                        onComplete: () => {
                            gsap.to(threePointText, {
                                duration: 0.3,
                                alpha: 0,
                                y: threePointText.y - 20,
                                delay: 0.5,
                                onComplete: () => {
                                    this.app.stage.removeChild(threePointText);
                                }
                            });
                        }
                    });
                } else if (event.type === GameEventType.THREE_POINTS_MISSED || 
                          event.type === GameEventType.TWO_POINTS_MISSED) {
                    // 投篮不中特效
                    const missText = new PIXI.Text('未命中', {
                        fontFamily: 'Arial',
                        fontSize: 24,
                        fill: 0xFF0000,
                        stroke: 0xFFFFFF,
                        strokeThickness: 4,
                        dropShadow: true,
                        dropShadowColor: 0x000000,
                        dropShadowBlur: 4,
                        dropShadowDistance: 2
                    });
                    missText.anchor.set(0.5);
                    missText.position.set(endPos.x, endPos.y - 50);
                    missText.alpha = 0;
                    this.app.stage.addChild(missText);

                    gsap.to(missText, {
                        duration: 0.5,
                        alpha: 1,
                        y: missText.y - 30,
                        ease: "elastic.out",
                        onComplete: () => {
                            gsap.to(missText, {
                                duration: 0.3,
                                alpha: 0,
                                y: missText.y - 20,
                                delay: 0.5,
                                onComplete: () => {
                                    this.app.stage.removeChild(missText);
                                }
                            });
                        }
                    });
                }
            }
        });

        // 4. 球员投篮动作
        tl.to(shooter.position, {
            duration: 0.4,
            y: shooterStartPos.y - 10,
            ease: "power1.out"
        }, "-=0.4").to(shooter.position, {
            duration: 0.4,
            y: shooterStartPos.y,
            ease: "power1.in"
        });

        // 5. 防守球员��应
        tl.to(defender.position, {
            duration: 0.3,
            y: shooterStartPos.y - 5,
            x: shooterStartPos.x + (isHome ? 20 : -20),
            ease: "power1.out"
        }, "-=0.8").to(defender.position, {
            duration: 0.3,
            y: shooterStartPos.y,
            ease: "power1.in"
        });

        // 6. 最后回到初始位置
        tl.to([this.ball, shooter.position, defender.position], {
            duration: 0.3,
            x: (target: any) => {
                if (target === this.ball) return 400;
                const pos = target as PIXI.ObservablePoint;
                if (pos === shooter.position) {
                    return this.INITIAL_POSITIONS[isHome ? 'home' : 'away'][0].x;
                }
                return this.INITIAL_POSITIONS[isHome ? 'away' : 'home'][0].x;
            },
            y: (target: any) => {
                if (target === this.ball) return 225;
                const pos = target as PIXI.ObservablePoint;
                if (pos === shooter.position) {
                    return this.INITIAL_POSITIONS[isHome ? 'home' : 'away'][0].y;
                }
                return this.INITIAL_POSITIONS[isHome ? 'away' : 'home'][0].y;
            },
            ease: "power1.inOut",
            delay: 0.3
        });
    }

    private getStartPosition(event: GameEvent): {x: number, y: number} {
        const isHome = event.team === 'home';
        
        switch(event.type) {
            case GameEventType.THREE_POINTS_MADE:
            case GameEventType.THREE_POINTS_MISSED:
                // 三分球起始位置 - 在对方篮筐250半径的圆上
                const basketPos = this.getBasketPosition(isHome); // 改为自己这边的篮筐
                const radius = 250; // 三分线半径
                
                // 生成一个随机角度，但限在合理围内
                // 对于主队（左侧），角度范围在 -60° 到 60° 之间
                // 对于客队（右侧），角度范围在 120° 到 240° 之间
                let angle;
                if (isHome) {
                    // 主队投篮，面向左侧篮筐
                    angle = (Math.random() * 120 + 120) * Math.PI / 180;
                } else {
                    // 客队投篮，面向右侧篮筐
                    angle = (Math.random() * 120 - 60) * Math.PI / 180;
                }

                // 计算圆上的点
                let x = basketPos.x + radius * Math.cos(angle);
                let y = basketPos.y + radius * Math.sin(angle);

                // 确保不超出球场界
                x = Math.max(60, Math.min(740, x));
                y = Math.max(80, Math.min(370, y));

                return { x, y };
                
            case GameEventType.TWO_POINTS_MADE:
            case GameEventType.TWO_POINTS_MISSED:
                // 两分球起始位置
                return {
                    x: isHome ? 200 : 600, // 调整位置更靠近自己的篮筐
                    y: 225
                };
                
            case GameEventType.FREE_THROW_MADE:
            case GameEventType.FREE_THROW_MISSED:
                // 罚球起始位置
                return {
                    x: isHome ? 100 : 700, // 调整位置更靠近自己的篮筐
                    y: 225
                };
                
            default:
                return {
                    x: 400,
                    y: 225
                };
        }
    }

    private getBasketPosition(isHome: boolean): {x: number, y: number} {
        return {
            x: isHome ? 740 : 60, // 篮筐x坐标
            y: 225 // 篮筐y坐标
        };
    }

    private getControlPoint(start: {x: number, y: number}, end: {x: number, y: number}, eventType: GameEventType): {x: number, y: number} {
        const midX = (start.x + end.x) / 2;
        let arcHeight: number;
        
        switch(eventType) {
            case GameEventType.THREE_POINTS_MADE:
            case GameEventType.THREE_POINTS_MISSED:
                arcHeight = 120; // 增加三分球高度
                break;
                
            case GameEventType.TWO_POINTS_MADE:
            case GameEventType.TWO_POINTS_MISSED:
                arcHeight = 90; // 增加两分球高度
                break;
                
            case GameEventType.FREE_THROW_MADE:
            case GameEventType.FREE_THROW_MISSED:
                arcHeight = 70; // 增加罚球高度
                break;
                
            default:
                arcHeight = 80;
        }
        
        return {
            x: midX,
            y: Math.min(start.y, end.y) - arcHeight
        };
    }

    private animateRebound(event: GameEvent) {
        const isHome = event.team === 'home';
        const basketPos = this.getBasketPosition(!isHome);
        
        // 随机选择篮板和对方球员
        const rebounder = this.getRandomPlayer(event.team);
        const opponent = this.getRandomPlayer(isHome ? 'away' : 'home');
        
        if (!rebounder || !opponent) return;

        const tl = gsap.timeline();

        // 所有元素移动到篮筐位置
        tl.to([this.ball, rebounder.position, opponent.position], {
            duration: 0.3,
            x: basketPos.x + (isHome ? -20 : 20),
            y: basketPos.y,
            ease: "power1.inOut"
        });

        // 篮板球动作
        tl.to(this.ball, {
            duration: 0.4,
            y: basketPos.y - 30,
            x: isHome ? basketPos.x - 40 : basketPos.x + 40,
            ease: "power2.out"
        }).to(this.ball, {
            duration: 0.4,
            y: basketPos.y + 10,
            ease: "bounce.out"
        });

        // 球员争抢动作
        tl.to([rebounder.position, opponent.position], {
            duration: 0.8,
            y: (_target: any) => basketPos.y + (Math.random() * 20 - 10),
            x: (_target: any) => {
                const baseX = isHome ? basketPos.x - 40 : basketPos.x + 40;
                return baseX + (Math.random() * 20 - 10);
            },
            ease: "power1.inOut"
        }, "-=0.8");

        // 所有元素回到初始位置
        tl.to([this.ball, rebounder.position, opponent.position], {
            duration: 0.3,
            x: (target: any) => {
                if (target === this.ball) return 400;
                const pos = target as PIXI.ObservablePoint;
                if (pos === rebounder.position) {
                    return this.INITIAL_POSITIONS[isHome ? 'home' : 'away'][0].x;
                }
                return this.INITIAL_POSITIONS[isHome ? 'away' : 'home'][0].x;
            },
            y: (target: any) => {
                if (target === this.ball) return 225;
                const pos = target as PIXI.ObservablePoint;
                if (pos === rebounder.position) {
                    return this.INITIAL_POSITIONS[isHome ? 'home' : 'away'][0].y;
                }
                return this.INITIAL_POSITIONS[isHome ? 'away' : 'home'][0].y;
            },
            ease: "power1.inOut",
            delay: 0.2
        });
    }

    private animateBlock(event: GameEvent) {
        const isHome = event.team === 'home';
        const startPos = this.getStartPosition({...event, team: isHome ? 'away' : 'home'});
        
        // 随机选择盖帽和被盖帽球员
        const blocker = this.getRandomPlayer(event.team);
        const shooter = this.getRandomPlayer(isHome ? 'away' : 'home');
        
        if (!blocker || !shooter) return;

        const tl = gsap.timeline();

        // 所有元素移动到起始位置
        tl.to([this.ball, blocker.position, shooter.position], {
            duration: 0.3,
            x: startPos.x,
            y: startPos.y,
            ease: "power1.inOut"
        });

        // 盖帽动作
        tl.to([this.ball, blocker.position], {
            duration: 0.3,
            y: startPos.y - 40,
            x: (target: any) => {
                const baseX = isHome ? startPos.x - 30 : startPos.x + 30;
                return target === this.ball ? baseX : baseX + (isHome ? -20 : 20);
            },
            ease: "power2.out"
        }).to([this.ball, blocker.position], {
            duration: 0.4,
            y: startPos.y + 30,
            x: (target: any) => {
                const baseX = isHome ? startPos.x - 60 : startPos.x + 60;
                return target === this.ball ? baseX : baseX + (isHome ? -20 : 20);
            },
            ease: "power3.in"
        });

        // 所有元素回到初始位置
        tl.to([this.ball, blocker.position, shooter.position], {
            duration: 0.3,
            x: (target: any) => {
                if (target === this.ball) return 400;
                const pos = target as PIXI.ObservablePoint;
                if (pos === blocker.position) {
                    return this.INITIAL_POSITIONS[isHome ? 'home' : 'away'][0].x;
                }
                return this.INITIAL_POSITIONS[isHome ? 'away' : 'home'][0].x;
            },
            y: (target: any) => {
                if (target === this.ball) return 225;
                const pos = target as PIXI.ObservablePoint;
                if (pos === blocker.position) {
                    return this.INITIAL_POSITIONS[isHome ? 'home' : 'away'][0].y;
                }
                return this.INITIAL_POSITIONS[isHome ? 'away' : 'home'][0].y;
            },
            ease: "power1.inOut",
            delay: 0.2
        });
    }

    private animateFoul(event: GameEvent) {
        const isHome = event.team === 'home';
        
        // 随机选择犯规和被犯规球员
        const fouler = this.getRandomPlayer(event.team);
        const opponent = this.getRandomPlayer(isHome ? 'away' : 'home');
        
        if (!fouler || !opponent) return;

        // 创建���规文字
        const foulText = new PIXI.Text('犯规!', {
            fontFamily: 'Arial',
            fontSize: 24,
            fill: 0xFF0000,
            stroke: 0xFFFFFF,
            strokeThickness: 4,
            dropShadow: true,
            dropShadowColor: 0x000000,
            dropShadowBlur: 4,
            dropShadowDistance: 2
        });
        foulText.anchor.set(0.5);
        foulText.position.set(this.ball.x, this.ball.y - 30);
        foulText.alpha = 0;
        this.court.addChild(foulText);

        const tl = gsap.timeline();

        // 球员移动到相近位置
        tl.to([fouler.position, opponent.position], {
            duration: 0.3,
            x: (target: any) => {
                const baseX = (fouler.position.x + opponent.position.x) / 2;
                return target === fouler.position ? baseX - 20 : baseX + 20;
            },
            y: (target: any) => {
                const baseY = (fouler.position.y + opponent.position.y) / 2;
                return baseY + (Math.random() * 20 - 10);
            },
            ease: "power1.inOut"
        });

        // 显示犯规文字
        tl.to(foulText, {
            duration: 0.3,
            alpha: 1,
            y: foulText.y - 20,
            ease: "power2.out"
        }, "-=0.2");

        // 犯规动作
        tl.to([fouler.position, opponent.position], {
            duration: 0.2,
            x: (target: any) => {
                const currentX = target === fouler.position ? 
                    fouler.position.x : opponent.position.x;
                return currentX + (Math.random() * 10 - 5);
            },
            y: (target: any) => {
                const currentY = target === fouler.position ? 
                    fouler.position.y : opponent.position.y;
                return currentY + (Math.random() * 10 - 5);
            },
            repeat: 2,
            yoyo: true,
            ease: "power1.inOut"
        }, "-=0.2");

        // 淡出文字
        tl.to(foulText, {
            duration: 0.3,
            alpha: 0,
            y: foulText.y - 20,
            ease: "power2.in",
            onComplete: () => {
                this.court.removeChild(foulText);
            }
        });

        // 所有元素回到初始位置
        tl.to([fouler.position, opponent.position], {
            duration: 0.5,
            x: (target: any) => {
                return target === fouler.position ?
                    this.INITIAL_POSITIONS[isHome ? 'home' : 'away'][0].x :
                    this.INITIAL_POSITIONS[isHome ? 'away' : 'home'][0].x;
            },
            y: (target: any) => {
                return target === fouler.position ?
                    this.INITIAL_POSITIONS[isHome ? 'home' : 'away'][0].y :
                    this.INITIAL_POSITIONS[isHome ? 'away' : 'home'][0].y;
            },
            ease: "power1.inOut"
        });
    }

    private animateTurnover(event: GameEvent) {
        const isHome = event.team === 'home';
        
        // 随机选择失误球员和抢断球员
        const turnoverPlayer = this.getRandomPlayer(event.team);
        const stealingPlayer = this.getRandomPlayer(isHome ? 'away' : 'home');
        
        if (!turnoverPlayer || !stealingPlayer) return;

        // 计算失误发生的位置（在失误球员所在半场）
        const turnoverPos = {
            x: isHome ? 200 + Math.random() * 150 : 450 + Math.random() * 150,
            y: 150 + Math.random() * 150
        };

        const tl = gsap.timeline();

        // 创建失误文字
        const turnoverText = new PIXI.Text('失误!', {
            fontFamily: 'Arial',
            fontSize: 24,
            fill: 0xFF0000,
            stroke: 0xFFFFFF,
            strokeThickness: 4,
            dropShadow: true,
            dropShadowColor: 0x000000,
            dropShadowBlur: 4,
            dropShadowDistance: 2
        });
        turnoverText.anchor.set(0.5);
        turnoverText.position.set(turnoverPos.x, turnoverPos.y - 30);
        turnoverText.alpha = 0;
        this.app.stage.addChild(turnoverText);

        // 1. 移动球员和球到失误位置
        tl.to([turnoverPlayer.position, stealingPlayer.position, this.ball], {
            duration: 0.3,
            x: (target: any) => {
                if (target === this.ball) return turnoverPos.x;
                return target === turnoverPlayer.position ? 
                    turnoverPos.x : 
                    turnoverPos.x + (isHome ? 30 : -30);
            },
            y: (target: any) => {
                if (target === this.ball) return turnoverPos.y;
                return turnoverPos.y;
            },
            ease: "power1.inOut"
        });

        // 2. 显示失误文字
        tl.to(turnoverText, {
            duration: 0.3,
            alpha: 1,
            y: turnoverText.y - 20,
            ease: "power2.out"
        });

        // 3. 球脱手动画
        tl.to(this.ball, {
            duration: 0.4,
            x: turnoverPos.x + (isHome ? 50 : -50),
            y: turnoverPos.y - 30,
            ease: "power2.out"
        }).to(this.ball, {
            duration: 0.3,
            y: turnoverPos.y + 20,
            ease: "bounce.out"
        });

        // 4. 抢断球员接球
        tl.to(this.ball, {
            duration: 0.3,
            x: stealingPlayer.position.x,
            y: stealingPlayer.position.y,
            ease: "power1.inOut"
        });

        // 5. 失误球员懊恼动作
        tl.to(turnoverPlayer.position, {
            duration: 0.2,
            rotation: isHome ? -0.2 : 0.2,
            repeat: 1,
            yoyo: true,
            ease: "power1.inOut"
        }, "-=0.6");

        // 6. 淡出文字
        tl.to(turnoverText, {
            duration: 0.3,
            alpha: 0,
            y: turnoverText.y - 20,
            ease: "power2.in",
            onComplete: () => {
                this.app.stage.removeChild(turnoverText);
            }
        });

        // 7. 所有元素回到初始位置
        tl.to([this.ball, turnoverPlayer.position, stealingPlayer.position], {
            duration: 0.3,
            x: (target: any) => {
                if (target === this.ball) return 400;
                const pos = target as PIXI.ObservablePoint;
                if (pos === turnoverPlayer.position) {
                    return this.INITIAL_POSITIONS[isHome ? 'home' : 'away'][0].x;
                }
                return this.INITIAL_POSITIONS[isHome ? 'away' : 'home'][0].x;
            },
            y: (target: any) => {
                if (target === this.ball) return 225;
                const pos = target as PIXI.ObservablePoint;
                if (pos === turnoverPlayer.position) {
                    return this.INITIAL_POSITIONS[isHome ? 'home' : 'away'][0].y;
                }
                return this.INITIAL_POSITIONS[isHome ? 'away' : 'home'][0].y;
            },
            rotation: 0,
            ease: "power1.inOut",
            delay: 0.2
        });
    }

    public updateGameState(state: GameState) {
        // 清除现有球员
        this.players.forEach(player => {
            this.court.removeChild(player);
        });
        this.players.clear();

        // 初始化主队球员，使用固定位置
        for (let i = 0; i < 5; i++) {
            const player = this.createPlayer('home', String(i + 1));
            player.position.set(
                this.INITIAL_POSITIONS.home[i].x,
                this.INITIAL_POSITIONS.home[i].y
            );
            this.players.set(`home_${i}`, player);
            this.court.addChild(player);
        }

        // 初始化客队球员，使用固定位置
        for (let i = 0; i < 5; i++) {
            const player = this.createPlayer('away', String(i + 1));
            player.position.set(
                this.INITIAL_POSITIONS.away[i].x,
                this.INITIAL_POSITIONS.away[i].y
            );
            this.players.set(`away_${i}`, player);
            this.court.addChild(player);
        }
    }

    public playEvent(event: GameEvent) {
        // 如果是第一个件，显示比赛开始文本
        if (event.quarter === 1 && event.time === '12:00') {
            this.showGameStart();
        }
        
        const animation = this.animations.get(event.type);
        if (animation) {
            animation(event);
        }
    }

    public resize(width: number, height: number) {
        this.app.renderer.resize(width, height);
        // 调整场景比例和位置
    }

    public destroy() {
        this.app.destroy(true);
    }

    private initOverlay() {
        // 创建全屏遮罩
        this.overlay = new PIXI.Graphics();
        this.overlay.beginFill(0x000000, 0.5);  // 黑色半透明
        this.overlay.drawRect(0, 0, 800, 450);  // 覆盖整个画布
        this.overlay.endFill();
        this.overlay.alpha = 0;  // 初始透明
        
        // 遮罩添加到舞台最顶层
        this.app.stage.addChild(this.overlay);
    }

    private initGameStartText() {
        this.gameStartText = new PIXI.Text('比赛开始', {
            fontFamily: '"华文行楷", "STXingkai", "楷体", "KaiTi", Arial',
            fontSize: 72,
            fill: ['#FF0000', '#FF4444'],
            fontWeight: 'normal',
            dropShadow: true,
            dropShadowColor: 0x000000,
            dropShadowBlur: 6,
            dropShadowDistance: 3,
            stroke: '#880000',
            strokeThickness: 2,
            letterSpacing: 4
        });
        
        this.gameStartText.anchor.set(0.5);
        this.gameStartText.position.set(400, 225);
        this.gameStartText.alpha = 0;
        
        // 将文添加到舞台最顶层，确保在遮罩之上
        this.app.stage.addChild(this.gameStartText);
    }

    public showGameStart() {
        if (!this.gameStartText || !this.overlay) return;
        
        // 重置状态
        this.gameStartText.alpha = 0;
        this.gameStartText.scale.set(1);
        this.overlay.alpha = 0;
        
        // 创建动画效果
        const tl = gsap.timeline();
        
        // 首先让背景变暗
        tl.to(this.overlay, {
            alpha: 0.5,
            duration: 0.3,
            ease: "power2.out"
        });
        
        // 然后显示文字
        tl.to(this.gameStartText, {
            alpha: 1,
            duration: 0.5,
            ease: "power2.out"
        }, "-=0.2");  // 略微提前开始文字画
        
        // 停留一会后开始淡出
        tl.to([this.gameStartText, this.overlay], {
            alpha: 0,
            scale: this.gameStartText.scale.x * 1.5,
            duration: 1,
            ease: "power2.in",
            delay: 1
        });
    }

    // 添加一个辅助方法来随机获取球员
    private getRandomPlayer(team: 'home' | 'away'): PIXI.Container | undefined {
        const teamPlayers = Array.from(this.players.entries())
            .filter(([key]) => key.startsWith(team))
            .map(([_, player]) => player);
        
        if (teamPlayers.length === 0) return undefined;
        const randomIndex = Math.floor(Math.random() * teamPlayers.length);
        return teamPlayers[randomIndex];
    }

    // 添加一个辅助方法来获取有效的随机位置
    private getRandomPositionNearBall(
        baseX: number, 
        baseY: number, 
        spread: number = 50,
        isHome: boolean
    ): {x: number, y: number} {
        // 球场边界
        const COURT_BOUNDS = {
            left: 60,
            right: 740,
            top: 60,
            bottom: 390
        };

        // 生成随机偏移
        const getRandomOffset = () => (Math.random() - 0.5) * spread * 2;

        // 尝试获取有效位置
        let x = baseX + getRandomOffset();
        let y = baseY + getRandomOffset();

        // 确保位置在球场内
        x = Math.max(COURT_BOUNDS.left + 20, Math.min(COURT_BOUNDS.right - 20, x));
        y = Math.max(COURT_BOUNDS.top + 20, Math.min(COURT_BOUNDS.bottom - 20, y));

        // 确保主队在左半场，客队在右半场
        if (isHome && x > 400) {
            x = 400 - (x - 400);
        } else if (!isHome && x < 400) {
            x = 400 + (400 - x);
        }

        return {x, y};
    }
} 