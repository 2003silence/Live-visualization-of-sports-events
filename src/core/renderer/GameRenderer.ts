import * as PIXI from 'pixi.js';
import { GameEvent, GameState, GameEventType } from '../../types';
import { gsap } from 'gsap';
import { PixiPlugin } from 'gsap/PixiPlugin';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';

// Register GSAP plugins
gsap.registerPlugin(PixiPlugin);
gsap.registerPlugin(MotionPathPlugin);
// Initialize PixiPlugin
PixiPlugin.registerPIXI(PIXI);

export class GameRenderer {
    private app: PIXI.Application;
    private court: PIXI.Container;
    private ball: PIXI.Sprite;
    private players: Map<string, PIXI.Container>;
    private animations: Map<GameEventType, (event: GameEvent) => void>;
    private gameStartText: PIXI.Text | null = null;
    private currentQuarter: number = 1;
    private isHomeOnRight: boolean = true;

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

        // 创建篮球
        this.ball = this.createBall();
        this.court.addChild(this.ball);

        // 初始化球员
        this.players = new Map();
        this.createPlayers();

        // 初始化动画处理器
        this.animations = new Map();
        this.initializeAnimations();
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
        lines.beginFill(0xCC0000, 0.3);
        lines.drawRect(50, 135, 200, 180);
        lines.endFill();

        // 右侧罚球区
        lines.beginFill(0xCC0000, 0.3);
        lines.drawRect(550, 135, 200, 180);
        lines.endFill();

        // 三分线
        lines.lineStyle(2, 0xFFFFFF, 0.8);
        
        // 左侧三分线
        lines.moveTo(50, 75);  // 开始于底线
        lines.lineTo(200, 75); // 直线部分
        lines.arc(200, 225, 150, -Math.PI/2, Math.PI/2); // 弧线部分
        lines.lineTo(50, 375); // 直线部分

        // 右侧三分线
        lines.moveTo(750, 75);  // 开始于底线
        lines.lineTo(600, 75);  // 直线部分
        lines.arc(600, 225, 150, -Math.PI/2, Math.PI/2, true); // 弧线部分
        lines.lineTo(750, 375); // 直线部分



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

    private initializeAnimations() {
        // 投篮相关动画
        this.animations.set(GameEventType.TWO_POINTS_MADE, this.animateShot.bind(this));
        this.animations.set(GameEventType.THREE_POINTS_MADE, this.animateShot.bind(this));
        this.animations.set(GameEventType.TWO_POINTS_MISSED, this.animateMissedShot.bind(this));
        this.animations.set(GameEventType.THREE_POINTS_MISSED, this.animateMissedShot.bind(this));
        this.animations.set(GameEventType.FREE_THROW_MADE, this.animateFreeThrow.bind(this));
        this.animations.set(GameEventType.FREE_THROW_MISSED, this.animateMissedFreeThrow.bind(this));
        
        // 其他动作动画
        this.animations.set(GameEventType.REBOUND, this.animateRebound.bind(this));
        this.animations.set(GameEventType.BLOCK, this.animateBlock.bind(this));
        this.animations.set(GameEventType.STEAL, this.animateSteal.bind(this));
        this.animations.set(GameEventType.TURNOVER, this.animateTurnover.bind(this));
        this.animations.set(GameEventType.FOUL, this.animateFoul.bind(this));
    }

    private animateShot(event: GameEvent) {
        const isHome = event.team === 'home';
        // 修改进攻方向：主队在右侧时向左进攻，在左侧时向右进攻
        const shootingToRight = (isHome !== this.isHomeOnRight);
        const endX = shootingToRight ? 750 : 50;
        const startX = shootingToRight ? 550 : 250;
        const isThree = event.type === GameEventType.THREE_POINTS_MADE;
        
        gsap.killTweensOf(this.ball);
        const player = this.players.get(`${event.team}_0`);
        if (player) {
            gsap.killTweensOf(player);
        }
        
        // 设置球的起始位置
        gsap.set(this.ball, {
            x: startX,
            y: 225
        });

        const tl = gsap.timeline();
        
        if (player) {
            // 第一步：球员移动到球的位置
            tl.to(player, {
                duration: 0.3,
                x: startX - (shootingToRight ? -20 : 20),
                y: 225,
                ease: "power2.out"
            });

            // 第二步：球员和球一起移动到投篮点
            let shootingSpotX, shootingSpotY;
            if (isThree) {
                // 三分球时，站在对方三分线上
                const oppositeThreePointX = shootingToRight ? 440 : 360;
                shootingSpotX = oppositeThreePointX;
                shootingSpotY = 225;

                // 球员和球一起移动到三分线
                tl.to([this.ball, player], {
                    duration: 0.4,
                    x: shootingSpotX,
                    y: shootingSpotY,
                    ease: "power1.inOut"
                });

                // 球独自飞向篮筐
                tl.to(this.ball, {
                    duration: 1,
                    motionPath: {
                        path: [
                            { x: shootingSpotX, y: shootingSpotY },
                            { x: (shootingSpotX + endX) / 2, y: 100 },
                            { x: endX, y: 225 }
                        ],
                        curviness: 1.5,
                        autoRotate: true
                    },
                    ease: "power2.inOut",
                    onComplete: () => {
                        if (isThree) {
                            this.showActionText('三分命中！', '#FFD700', 1.2);
                        }
                    }
                });
            } else {
                // 二分球时的位置和动作
                shootingSpotX = shootingToRight ? 550 : 250;
                shootingSpotY = 225;

                // 球员和球一起移动到投篮点并完成投篮
                tl.to([this.ball, player], {
                    duration: 0.4,
                    x: shootingSpotX,
                    y: shootingSpotY,
                    ease: "power1.inOut"
                })
                .to(this.ball, {
                    duration: 1,
                    motionPath: {
                        path: [
                            { x: shootingSpotX, y: shootingSpotY },
                            { x: (shootingSpotX + endX) / 2, y: 150 },
                            { x: endX, y: 225 }
                        ],
                        curviness: 1.5,
                        autoRotate: true
                    },
                    ease: "power2.inOut"
                });
            }

            // 最后：球和球员回到原位
            tl.to(this.ball, {
                duration: 0.5,
                x: 400,
                y: 225,
                ease: "power2.inOut"
            })
            .to(player, {
                duration: 0.5,
                x: shootingToRight ? 550 : 250,
                y: 225,
                ease: "power2.inOut"
            }, "-=0.5");
        }
    }

    private animateMissedShot(event: GameEvent) {
        const isHome = event.team === 'home';
        // 修改进攻方向：主队在右侧时向左进攻，在左侧时向右进攻
        const shootingToRight = (isHome !== this.isHomeOnRight);
        const endX = shootingToRight ? 750 : 50;
        const startX = shootingToRight ? 550 : 250;
        const isThree = event.type === GameEventType.THREE_POINTS_MISSED;
        
        gsap.killTweensOf(this.ball);
        const player = this.players.get(`${event.team}_0`);
        if (player) {
            gsap.killTweensOf(player);
        }
        
        // 设置球的起始位置
        gsap.set(this.ball, {
            x: startX,
            y: 225
        });

        const tl = gsap.timeline();
        
        if (player && player instanceof PIXI.Container) {
            // 第一步：球员移动到球的位置
            tl.to(player, {
                duration: 0.3,
                x: startX - (shootingToRight ? -20 : 20),
                y: 225,
                ease: "power2.out"
            });

            // 第二步：球员和球一起移动到投篮点
            let shootingSpotX, shootingSpotY;
            if (isThree) {
                // 三分球时，站在对方三分线上
                const oppositeThreePointX = shootingToRight ? 440 : 360;
                shootingSpotX = oppositeThreePointX;
                shootingSpotY = 225;

                // 球员和球一起移动到三分线
                tl.to([this.ball, player], {
                    duration: 0.4,
                    x: shootingSpotX,
                    y: shootingSpotY,
                    ease: "power1.inOut"
                });

                // 球独自飞向篮筐并弹出
                tl.to(this.ball, {
                    duration: 1,
                    motionPath: {
                        path: [
                            { x: shootingSpotX, y: shootingSpotY },
                            { x: (shootingSpotX + endX) / 2, y: 100 },
                            { x: endX, y: 225 }
                        ],
                        curviness: 1.5,
                        autoRotate: true
                    },
                    ease: "power2.inOut",
                    onComplete: () => {
                        if (isThree) {
                            this.showActionText('三分不中！', '#FF6347');
                        }
                    }
                })
                .to(this.ball, {
                    duration: 0.3,
                    x: shootingToRight ? endX - 30 : endX + 30,
                    y: 205,
                    ease: "power1.out"
                });
            } else {
                // 二分球时的位置和动作
                shootingSpotX = shootingToRight ? 550 : 250;
                shootingSpotY = 225;

                // 球员和球一起移动到投篮点并完成投篮
                tl.to([this.ball, player], {
                    duration: 0.4,
                    x: shootingSpotX,
                    y: shootingSpotY,
                    ease: "power1.inOut"
                })
                .to(this.ball, {
                    duration: 1,
                    motionPath: {
                        path: [
                            { x: shootingSpotX, y: shootingSpotY },
                            { x: (shootingSpotX + endX) / 2, y: 150 },
                            { x: endX, y: 225 }
                        ],
                        curviness: 1.5,
                        autoRotate: true
                    },
                    ease: "power2.inOut"
                })
                .to(this.ball, {
                    duration: 0.3,
                    x: shootingToRight ? endX - 30 : endX + 30,
                    y: 205,
                    ease: "power1.out"
                });
            }

            // 最后：球和球员回到原位
            tl.to(this.ball, {
                duration: 0.5,
                x: 400,
                y: 225,
                ease: "power2.inOut"
            })
            .to(player, {
                duration: 0.5,
                x: shootingToRight ? 550 : 250,
                y: 225,
                ease: "power2.inOut"
            }, "-=0.5");
        }
    }

    private animateFreeThrow(event: GameEvent) {
        const isHome = event.team === 'home';
        const endX = isHome ? 750 : 50;
        
        gsap.killTweensOf(this.ball);
        
        gsap.to(this.ball, {
            duration: 0.8,
            x: endX,
            y: 225,
            ease: "power2.inOut"
        });
    }

    private animateMissedFreeThrow(event: GameEvent) {
        const isHome = event.team === 'home';
        const endX = isHome ? 750 : 50;
        
        gsap.killTweensOf(this.ball);
        
        const tl = gsap.timeline();
        
        tl.to(this.ball, {
            duration: 0.8,
            x: endX,
            y: 225,
            ease: "power2.inOut"
        })
        .to(this.ball, {
            duration: 0.3,
            x: isHome ? "-=20" : "+=20",
            y: "+=15",
            ease: "power1.out"
        });
    }

    private animateSteal(event: GameEvent) {
        const isHome = event.team === 'home';
        
        gsap.killTweensOf(this.ball);
        const player = this.getRandomPlayer(event.team);
        const opponent = this.getRandomOpponentPlayer(event.team);
        
        if (player) {
            gsap.killTweensOf(player);
        }
        if (opponent) {
            gsap.killTweensOf(opponent);
        }
        
        const tl = gsap.timeline();
        
        if (player && opponent) {
            // 第一步：对方球员移动到球附近的随机位置准备抢断
            tl.to(opponent, {
                duration: 0.3,
                ...this.getRandomPositionAroundBall(25),
                ease: "power2.out"
            });

            // 第二步：��球球员移动，对手跟随
            tl.to([this.ball, player], {
                duration: 0.4,
                x: isHome ? "+=30" : "-=30",
                ease: "power1.inOut"
            })
            .to(opponent, {
                duration: 0.4,
                ...this.getRandomPositionAroundBall(20), // 更近的距离
                ease: "power1.inOut"
            }, "-=0.4");

            // 第三步：抢断瞬间
            const stealPos = this.getRandomPositionAroundBall(15); // 更近的距离
            tl.to(opponent, {
                duration: 0.2,
                ...stealPos,
                ease: "power3.in",
                onStart: () => {
                    this.showActionText('抢断！', '#4169E1', 1.2);
                }
            })
            .to(this.ball, {
                duration: 0.3,
                x: stealPos.x + (isHome ? -20 : 20),
                y: stealPos.y,
                rotation: isHome ? -Math.PI : Math.PI,
                ease: "power3.out"
            }, "-=0.1");

            // 第四步：持球球员失去平衡后退
            tl.to(player, {
                duration: 0.3,
                x: isHome ? "-=30" : "+=30",
                rotation: isHome ? -0.2 : 0.2,
                ease: "power2.out"
            }, "-=0.2");

            // 第五步：对手带球快速移动
            tl.to([this.ball, opponent], {
                duration: 0.4,
                x: isHome ? "-=50" : "+=50",
                ease: "power2.in"
            });

            // 最后：所有球员回到原位
            tl.to(this.ball, {
                duration: 0.5,
                x: 400,
                y: 225,
                rotation: 0,
                ease: "power2.inOut",
                onComplete: () => {
                    this.resetPlayers();
                }
            }, "-=0.5");
        }
    }

    private animateTurnover(event: GameEvent) {
        const isHome = event.team === 'home';
        
        gsap.killTweensOf(this.ball);
        const player = this.getRandomPlayer(event.team);
        const opponent = this.getRandomOpponentPlayer(event.team);
        
        if (player) {
            gsap.killTweensOf(player);
        }
        if (opponent) {
            gsap.killTweensOf(opponent);
        }
        
        const tl = gsap.timeline();
        
        if (player && opponent) {
            // 第一步：对方球员移动到球附近的随机位置
            tl.to(opponent, {
                duration: 0.3,
                ...this.getRandomPositionAroundBall(25),
                ease: "power2.out"
            });

            // 第二步：球员带球遇到防守，对手继续移动
            tl.to([this.ball, player], {
                duration: 0.4,
                x: isHome ? "+=30" : "-=30",
                ease: "power1.inOut"
            })
            .to(opponent, {
                duration: 0.4,
                ...this.getRandomPositionAroundBall(25),
                ease: "power1.inOut"
            }, "-=0.4");

            // 第三步：失误发生时对手再次移动
            const turnoverPos = this.getRandomPositionAroundBall(25);
            tl.to(opponent, {
                duration: 0.3,
                ...turnoverPos,
                ease: "power2.out"
            })
            .to(this.ball, {
                duration: 0.6,
                x: isHome ? "+=150" : "-=150",
                rotation: isHome ? Math.PI * 3 : -Math.PI * 3,
                ease: "power3.in",
                onStart: () => {
                    this.showActionText('失误！', '#FF4500');
                }
            }, "-=0.2");

            // 第四步：对方球员追球（稍微提前预判球的位置）
            tl.to(opponent, {
                duration: 0.4,
                x: this.ball.x + (isHome ? -15 : 15),
                y: this.ball.y,
                ease: "power2.out"
            }, "-=0.3");

            // 最后：所有球员回到原位
            tl.to(this.ball, {
                duration: 0.5,
                x: 400,
                y: 225,
                ease: "power2.inOut",
                onComplete: () => {
                    this.resetPlayers();
                }
            }, "-=0.5");
        }
    }

    private animateFoul(event: GameEvent) {
        const isHome = event.team === 'home';
        // 修改进攻方向：主队在右侧时向左进攻，在左侧时向右进攻
        const shootingToRight = (isHome !== this.isHomeOnRight);
        
        gsap.killTweensOf(this.ball);
        const player = this.getRandomPlayer(event.team);
        if (player) {
            gsap.killTweensOf(player);
        }
        
        const tl = gsap.timeline();
        
        if (player && player instanceof PIXI.Container) {
            // 第一步：球员移动到球的位置
            tl.to(player, {
                duration: 0.3,
                x: this.ball.x - (shootingToRight ? -20 : 20),
                y: this.ball.y,
                ease: "power2.out"
            });

            // 第二步：球员和球一起抖动，模拟犯规动作
            tl.to([this.ball, player], {
                duration: 0.1,
                x: "+=5",
                yoyo: true,
                repeat: 2,
                ease: "none",
                onStart: () => {
                    this.showActionText('犯规！', '#FF4500', 1.2);
                }
            });

            // 第三步：球和球员分开
            tl.to(this.ball, {
                duration: 0.2,
                x: isHome ? "+=30" : "-=30",
                y: "-=10",
                ease: "power1.out"
            })
            .to(player, {
                duration: 0.2,
                x: isHome ? "-=20" : "+=20",
                ease: "power1.out"
            }, "-=0.2");

            // 第四步：球轻微弹跳
            tl.to(this.ball, {
                duration: 0.3,
                y: "+=10",
                ease: "bounce.out"
            });

            // 最后：球员和球回到原位
            tl.to(this.ball, {
                duration: 0.5,
                x: 400,
                y: 225,
                ease: "power2.inOut"
            })
            .to(player, {
                duration: 0.5,
                x: isHome ? 250 : 550,
                y: 225,
                ease: "power2.inOut",
                onComplete: () => {
                    this.resetPlayers();
                }
            }, "-=0.5");
        } else {
            // 如果没有球员，只让球抖动
            tl.to(this.ball, {
                duration: 0.1,
                x: "+=5",
                yoyo: true,
                repeat: 3,
                ease: "none",
                onStart: () => {
                    this.showActionText('犯规！', '#FF4500', 1.2);
                }
            })
            .to(this.ball, {
                duration: 0.1,
                y: "+=5",
                yoyo: true,
                repeat: 3,
                ease: "none"
            }, "-=0.4");
        }
    }

    private animateRebound(event: GameEvent) {
        const isHome = event.team === 'home';
        const ballX = this.ball.x;
        
        // 修改进攻方向：主队在右侧时向左进攻，在左侧时向右进攻
        const shootingToRight = (isHome !== this.isHomeOnRight);
        const targetBasketX = shootingToRight ? 750 : 50;
        
        // 判断球是否在正确的篮筐附近
        const isNearTargetBasket = Math.abs(ballX - targetBasketX) < 50;
        
        // 如果球不在正确的篮筐位置，移动到正确位置
        if (!isNearTargetBasket) {
            this.ball.x = shootingToRight ? targetBasketX - 30 : targetBasketX + 30;
            this.ball.y = 225; // 确保在篮筐高度
        }
        
        gsap.killTweensOf(this.ball);
        const player = this.getRandomPlayer(event.team);
        if (player) {
            gsap.killTweensOf(player);
        }
        
        const tl = gsap.timeline();
        
        if (player && player instanceof PIXI.Container) {
            // 第一步：球弹起（根据在哪个篮筐调整方向）
            const reboundDirection = shootingToRight ? -1 : 1;
            
            tl.to(this.ball, {
                duration: 0.4,
                y: "-=40",
                x: `+=${20 * reboundDirection}`, // 球的横向弹动
                ease: "power2.out"
            });

            // 第二步：球员快速移动到球的位置准备抢板
            tl.to(player, {
                duration: 0.3,
                x: this.ball.x - (shootingToRight ? -20 : 20),
                y: this.ball.y + 40,
                ease: "power2.out"
            }, "-=0.2");

            // 第三步：球员跳起抢到篮板
            tl.to([this.ball, player], {
                duration: 0.3,
                y: "-=30",
                x: `+=${10 * reboundDirection}`, // 抢板时略微向外移动
                ease: "power2.out",
                onStart: () => {
                    this.showActionText('篮板球！', '#4169E1');
                }
            })
            .to([this.ball, player], {
                duration: 0.3,
                y: "+=30",
                ease: "bounce.out"
            });

            // 第四步：球员带球后撤
            tl.to([this.ball, player], {
                duration: 0.4,
                x: `+=${30 * reboundDirection}`, // 后撤方向与球队相关
                ease: "power1.out"
            });

            // 最后：球和球员回到原位
            tl.to(this.ball, {
                duration: 0.5,
                x: 400,
                y: 225,
                ease: "power2.inOut"
            })
            .to(player, {
                duration: 0.5,
                x: isHome ? 250 : 550,
                y: 225,
                ease: "power2.inOut",
                onComplete: () => {
                    this.resetPlayers();
                }
            }, "-=0.5");
        }
    }

    private animateBlock(event: GameEvent) {
        const isHome = event.team === 'home';
        const ballX = this.ball.x;
        
        // 修改进攻方向：主队在右侧时向左进攻，在左侧时向右进攻
        const shootingToRight = (isHome !== this.isHomeOnRight);
        const targetBasketX = shootingToRight ? 750 : 50;
        
        // 判断球是否在正确的篮筐附近
        const isNearTargetBasket = Math.abs(ballX - targetBasketX) < 50;  // 使用 targetBasketX 来判断
        
        // 如果球不在正确的篮筐位置，移动到正确位置
        if (!isNearTargetBasket) {
            this.ball.x = shootingToRight ? targetBasketX - 30 : targetBasketX + 30;  // 使用 targetBasketX 来设置位置
            this.ball.y = 225; // 确保在篮筐高度
        }
        
        gsap.killTweensOf(this.ball);
        const player = this.getRandomPlayer(event.team);
        const opponent = this.getRandomOpponentPlayer(event.team);
        
        if (player) {
            gsap.killTweensOf(player);
        }
        if (opponent) {
            gsap.killTweensOf(opponent);
        }
        
        const tl = gsap.timeline();
        
        if (player && player instanceof PIXI.Container && opponent) {
            // 第一步：双方球员移动到位，防守者在球附近随机位置
            tl.to(player, {
                duration: 0.3,
                x: this.ball.x - (shootingToRight ? -20 : 20),
                y: this.ball.y,
                ease: "power2.out"
            })
            .to(opponent, {
                duration: 0.3,
                ...this.getRandomPositionAroundBall(25),
                ease: "power2.out"
            }, "-=0.3");

            // 第二步：双方球员跳起
            tl.to([player, opponent], {
                duration: 0.2,
                y: "-=50",
                ease: "power1.out",
                onStart: () => {
                    this.showActionText('盖帽！', '#4169E1', 1.2);
                }
            });

            // 第三步：球被盖出去（方向与投篮方向相反）
            const blockDirection = shootingToRight ? -1 : 1;
            tl.to(this.ball, {
                duration: 0.3,
                y: "-=20",
                x: `+=${60 * blockDirection}`,
                rotation: blockDirection * Math.PI * 2,
                ease: "power3.out"
            }, "-=0.1");

            // 第四步：双方球员落地
            tl.to([player, opponent], {
                duration: 0.2,
                y: "+=50",
                ease: "bounce.out"
            });

            // 最后：所有球员回到原位
            tl.to(this.ball, {
                duration: 0.5,
                x: 400,
                y: 225,
                rotation: 0,
                ease: "power2.inOut",
                onComplete: () => {
                    this.resetPlayers();
                }
            }, "-=0.5");
        }
    }

    public updateGameState(state: GameState) {
        // 检查节数是否变化
        if (state.quarter !== this.currentQuarter) {
            this.currentQuarter = state.quarter;
            this.switchSides();
        }
    }

    private switchSides() {
        this.isHomeOnRight = !this.isHomeOnRight;
        
        // 创建半透明黑色背景
        const overlay = new PIXI.Graphics();
        overlay.beginFill(0x000000, 0.5);
        overlay.drawRect(0, 0, this.app.screen.width, this.app.screen.height);
        overlay.endFill();
        overlay.alpha = 0;
        this.court.addChild(overlay);

        // 创建换场文字样式
        const style = new PIXI.TextStyle({
            fontFamily: 'STKaiti, Kaiti, cursive',
            fontSize: 36,
            fontWeight: 'bold',
            fill: '#FF0000',
            stroke: '#FFD700',
            strokeThickness: 4,
            dropShadow: true,
            dropShadowColor: '#000000',
            dropShadowBlur: 4,
            dropShadowAngle: Math.PI / 6,
            dropShadowDistance: 4,
            align: 'center'
        });

        // 分别创建两行文字
        const quarterEndText = new PIXI.Text(`第${this.currentQuarter-1}节结束`, style);
        const switchSidesText = new PIXI.Text('现中场换场', style);

        // 设置文字锚点和位置
        quarterEndText.anchor.set(0.5);
        switchSidesText.anchor.set(0.5);

        // 将两行文字放在一个容器中
        const textContainer = new PIXI.Container();
        textContainer.addChild(quarterEndText);
        textContainer.addChild(switchSidesText);

        // 设置两行文字的相对位置
        quarterEndText.position.set(0, -25);
        switchSidesText.position.set(0, 25);

        // 设置容器的位置和初始状态
        textContainer.position.set(
            this.app.screen.width / 2,
            this.app.screen.height / 2
        );
        textContainer.alpha = 0;
        textContainer.scale.set(0.3);
        this.court.addChild(textContainer);

        // 定义场地两侧的位置
        const leftPositions = [
            { x: 150, y: 125 },
            { x: 150, y: 225 },
            { x: 150, y: 325 },
            { x: 250, y: 175 },
            { x: 250, y: 275 }
        ];

        const rightPositions = [
            { x: 650, y: 125 },
            { x: 650, y: 225 },
            { x: 650, y: 325 },
            { x: 550, y: 175 },
            { x: 550, y: 275 }
        ];

        // 创建动画时间轴
        const tl = gsap.timeline();

        // 背景渐入和文字动画
        tl.to(overlay, {
            alpha: 0.5,
            duration: 0.4,
            ease: "power2.inOut"
        })
        .to(textContainer, {
            alpha: 1,
            duration: 0.3,
            ease: "power2.in"
        }, "-=0.2")
        .to(textContainer.scale, {
            x: 1.2,
            y: 1.2,
            duration: 0.7,
            ease: "back.out(1.7)"
        }, "-=0.3")
        .to(textContainer.scale, {
            x: 1,
            y: 1,
            duration: 0.4,
            ease: "power2.out"
        });

        // 球员移动动画
        const playerMoveDuration = 1.2;
        
        // 主队球员移动
        for (let i = 0; i < 5; i++) {
            const player = this.players.get(`home_${i}`);
            if (player) {
                const targetPos = this.isHomeOnRight ? rightPositions[i] : leftPositions[i];
                tl.to(player, {
                    duration: playerMoveDuration,
                    x: targetPos.x,
                    y: targetPos.y,
                    ease: "power2.inOut"
                }, "-=1.1");
            }
        }

        // 客队球员移动
        for (let i = 0; i < 5; i++) {
            const player = this.players.get(`away_${i}`);
            if (player) {
                const targetPos = this.isHomeOnRight ? leftPositions[i] : rightPositions[i];
                tl.to(player, {
                    duration: playerMoveDuration,
                    x: targetPos.x,
                    y: targetPos.y,
                    ease: "power2.inOut"
                }, "-=1.1");
            }
        }

        // 球的移动
        tl.to(this.ball, {
            duration: 0.5,
            x: 400,
            y: 225,
            ease: "power2.inOut"
        }, "-=0.5");

        // 文字和背景淡出
        tl.to([textContainer, overlay], {
            alpha: 0,
            duration: 0.4,
            ease: "power2.inOut",
            delay: 0.5,
            onComplete: () => {
                if (textContainer.parent) {
                    textContainer.parent.removeChild(textContainer);
                }
                if (overlay.parent) {
                    overlay.parent.removeChild(overlay);
                }
            }
        });
    }

    public playEvent(event: GameEvent) {
        console.log('Playing animation for event:', event);
        
        // 使用 resetBall 方法替代直接设置位置
        this.resetBall();
        
        const animation = this.animations.get(event.type);
        if (animation) {
            animation(event);
        } else {
            console.log('No animation found for event type:', event.type);
        }
    }

    public resize(width: number, height: number) {
        this.app.renderer.resize(width, height);
        // 调整场景比例和位置
    }

    public destroy() {
        // Kill all animations before destroying
        gsap.killTweensOf(this.ball);
        this.app.destroy(true);
    }

    private createPlayers() {
        // 定义初始位置
        const leftPositions = [
            { x: 150, y: 125 },
            { x: 150, y: 225 },
            { x: 150, y: 325 },
            { x: 250, y: 175 },
            { x: 250, y: 275 }
        ];

        const rightPositions = [
            { x: 650, y: 125 },
            { x: 650, y: 225 },
            { x: 650, y: 325 },
            { x: 550, y: 175 },
            { x: 550, y: 275 }
        ];

        // 根据初始方向确定主客队位置
        const homePositions = this.isHomeOnRight ? rightPositions : leftPositions;
        const awayPositions = this.isHomeOnRight ? leftPositions : rightPositions;

        // 创建主队球员
        homePositions.forEach((pos, index) => {
            const player = this.createPlayer('home', (index + 1).toString());
            player.position.set(pos.x, pos.y);
            this.court.addChild(player);
            this.players.set(`home_${index}`, player);
        });

        // 创建客队球员
        awayPositions.forEach((pos, index) => {
            const player = this.createPlayer('away', (index + 1).toString());
            player.position.set(pos.x, pos.y);
            this.court.addChild(player);
            this.players.set(`away_${index}`, player);
        });
    }

    private createPlayer(team: string, number: string): PIXI.Container {
        const player = new PIXI.Container();

        // 球员图标（圆形）
        const icon = new PIXI.Graphics();
        icon.beginFill(team === 'home' ? 0xFF0000 : 0x0000FF);
        icon.drawCircle(0, 0, 15);  // 增大圆形尺寸
        icon.endFill();

        // 球员号码
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

    // 添加一个方法更新球员位置
    public updatePlayerPositions(positions: { [key: string]: { x: number, y: number } }) {
        Object.entries(positions).forEach(([playerId, position]) => {
            const player = this.players.get(playerId);
            if (player) {
                gsap.to(player, {
                    duration: 0.5,
                    x: position.x,
                    y: position.y,
                    ease: "power1.out"
                });
            }
        });
    }

    public showGameStartText() {
        // 如果已经有文字在显示，则返回
        if (this.gameStartText) {
            return;
        }

        // 创建半透明黑色背景
        const overlay = new PIXI.Graphics();
        overlay.beginFill(0x000000, 0.5);
        overlay.drawRect(0, 0, this.app.screen.width, this.app.screen.height);
        overlay.endFill();
        overlay.alpha = 0;
        this.court.addChild(overlay);

        // 创建艺术字体的文本样式
        const style = new PIXI.TextStyle({
            fontFamily: 'Arial',
            fontSize: 48,
            fontWeight: 'bold',
            fill: ['#FF0000', '#FF6347'], // 渐变色
            stroke: '#FFFFFF',
            strokeThickness: 5,
            dropShadow: true,
            dropShadowColor: '#000000',
            dropShadowBlur: 4,
            dropShadowAngle: Math.PI / 6,
            dropShadowDistance: 6,
        });

        this.gameStartText = new PIXI.Text('比赛开始!', style);
        this.gameStartText.anchor.set(0.5);
        this.gameStartText.position.set(
            this.app.screen.width / 2,
            this.app.screen.height / 2
        );
        this.gameStartText.alpha = 0;
        this.gameStartText.scale.set(0.3); // 起始比例更小
        this.court.addChild(this.gameStartText);

        // 创建动画时间轴
        const tl = gsap.timeline();

        // 背景渐入
        tl.to(overlay, {
            alpha: 1,
            duration: 0.4,
            ease: "power2.inOut"
        })
        // 文字渐入并放大
        .to(this.gameStartText, {
            alpha: 1,
            duration: 0.3,
            ease: "power2.in"
        }, "-=0.2") // 与背景动重叠
        .to(this.gameStartText.scale, {
            x: 1.2,
            y: 1.2,
            duration: 0.7,
            ease: "back.out(1.7)"
        }, "-=0.3")
        // 轻微弹性收缩
        .to(this.gameStartText.scale, {
            x: 1,
            y: 1,
            duration: 0.4,
            ease: "power2.out"
        })
        // 保持显示
        .to({}, {
            duration: 0.9
        })
        // 文字和背景淡出
        .to([this.gameStartText, overlay], {
            alpha: 0,
            duration: 0.4,
            ease: "power2.inOut",
            onComplete: () => {
                if (this.gameStartText && this.gameStartText.parent) {
                    this.gameStartText.parent.removeChild(this.gameStartText);
                    this.gameStartText = null;
                }
                if (overlay.parent) {
                    overlay.parent.removeChild(overlay);
                }
            }
        });
    }

    // 添加一个通用的重置法
    private resetBall() {
        gsap.to(this.ball, {
            duration: 0.5,
            x: 400,
            y: 225,
            rotation: 0,
            ease: "power2.inOut"
        });
    }

    // 添加显示字动画的方法
    private showActionText(text: string, color: string = '#FF0000', scale: number = 1) {
        const style = new PIXI.TextStyle({
            fontFamily: 'Arial',
            fontSize: 20 * scale, // 修改为 20
            fontWeight: 'bold',
            fill: color,
            stroke: '#FFFFFF',
            strokeThickness: 2,
            dropShadow: true,
            dropShadowColor: '#000000',
            dropShadowBlur: 1,
            dropShadowAngle: Math.PI / 6,
            dropShadowDistance: 1,
        });

        // 创建文本
        const actionText = new PIXI.Text(text, style);
        actionText.anchor.set(0.5);
        actionText.position.set(
            this.ball.x,
            this.ball.y - 15  // 减文字与球的距离
        );
        actionText.alpha = 0;
        this.court.addChild(actionText);

        // 创建动画
        const tl = gsap.timeline({
            onComplete: () => {
                if (actionText.parent) {
                    actionText.parent.removeChild(actionText);
                }
            }
        });

        tl.to(actionText, {
            alpha: 1,
            duration: 0.2,
            y: actionText.y - 10, // 减小上升距离
            ease: "power2.out"
        })
        .to(actionText, {
            alpha: 0,
            duration: 0.3,
            y: actionText.y - 15, // 减小上升距离
            ease: "power2.in",
            delay: 0.5
        });
    }

    // 添加获取随机球员的辅助方法
    private getRandomPlayer(team: string): PIXI.Container | undefined {
        // 收集指定队伍的所有球员
        const teamPlayers: PIXI.Container[] = [];
        for (let i = 0; i < 5; i++) {
            const player = this.players.get(`${team}_${i}`);
            if (player) {
                teamPlayers.push(player);
            }
        }
        
        // 随机选择一个球员
        if (teamPlayers.length > 0) {
            const randomIndex = Math.floor(Math.random() * teamPlayers.length);
            return teamPlayers[randomIndex];
        }
        return undefined;
    }

    // 添加一个球员复位的方法
    private resetPlayers() {
        const leftPositions = [
            { x: 150, y: 125 },
            { x: 150, y: 225 },
            { x: 150, y: 325 },
            { x: 250, y: 175 },
            { x: 250, y: 275 }
        ];

        const rightPositions = [
            { x: 650, y: 125 },
            { x: 650, y: 225 },
            { x: 650, y: 325 },
            { x: 550, y: 175 },
            { x: 550, y: 275 }
        ];

        // 根据当前方向确定主客队目标位置
        const homeTargetPositions = this.isHomeOnRight ? rightPositions : leftPositions;
        const awayTargetPositions = this.isHomeOnRight ? leftPositions : rightPositions;

        // 重置主队球员
        for (let i = 0; i < 5; i++) {
            const player = this.players.get(`home_${i}`);
            if (player) {
                const targetPos = homeTargetPositions[i];
                gsap.to(player, {
                    duration: 0.5,
                    x: targetPos.x,
                    y: targetPos.y,
                    ease: "power2.inOut"
                });
            }
        }

        // 重置客队球员
        for (let i = 0; i < 5; i++) {
            const player = this.players.get(`away_${i}`);
            if (player) {
                const targetPos = awayTargetPositions[i];
                gsap.to(player, {
                    duration: 0.5,
                    x: targetPos.x,
                    y: targetPos.y,
                    ease: "power2.inOut"
                });
            }
        }
    }

    // 添加获取对方随机球员的方法
    private getRandomOpponentPlayer(team: string): PIXI.Container | undefined {
        // 获取对方队伍的标识
        const opponentTeam = team === 'home' ? 'away' : 'home';
        return this.getRandomPlayer(opponentTeam);
    }

    // 添加一个获取圆形范围内随机位置的辅助方法
    private getRandomPositionAroundBall(radius: number): { x: number, y: number } {
        const angle = Math.random() * Math.PI * 2; // 随机角度
        const r = Math.sqrt(Math.random()) * radius; // 随机半径（使用平方根使分布更均匀）
        
        return {
            x: this.ball.x + r * Math.cos(angle),
            y: this.ball.y + r * Math.sin(angle)
        };
    }
} 