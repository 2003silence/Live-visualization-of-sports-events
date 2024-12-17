import * as PIXI from 'pixi.js';
import { GameEvent, GameState, GameEventType } from '../../types';
import { gsap } from 'gsap';
import { PixiPlugin } from 'gsap/PixiPlugin';

// Register GSAP plugins
gsap.registerPlugin(PixiPlugin);
// Initialize PixiPlugin
PixiPlugin.registerPIXI(PIXI);

export class GameRenderer {
    private app: PIXI.Application;
    private court: PIXI.Container;
    private ball: PIXI.Sprite;
    private players: Map<string, PIXI.Container>;
    private animations: Map<GameEventType, (event: GameEvent) => void>;
    private gameStartText: PIXI.Text | null = null;

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
        this.animations.set(GameEventType.TWO_POINTS_MADE, this.animateShot.bind(this));
        this.animations.set(GameEventType.THREE_POINTS_MADE, this.animateShot.bind(this));
        this.animations.set(GameEventType.FREE_THROW_MADE, this.animateShot.bind(this));
        this.animations.set(GameEventType.REBOUND, this.animateRebound.bind(this));
        this.animations.set(GameEventType.BLOCK, this.animateBlock.bind(this));
        // ... 添加更多动画
    }

    private animateShot(event: GameEvent) {
        const isHome = event.team === 'home';
        const endX = isHome ? 750 : 50;

        // Kill any existing animations
        gsap.killTweensOf(this.ball);

        // Create a timeline for the shot animation
        const tl = gsap.timeline();
        
        // Arc motion for the ball
        tl.to(this.ball, {
            duration: 1,
            x: endX,
            y: 200,
            ease: "power2.out",
            onComplete: () => {
                // Reset ball position
                gsap.set(this.ball, {
                    x: 400,
                    y: 200
                });
            }
        });
    }

    private animateRebound(_event: GameEvent) {
        // Kill any existing animations
        gsap.killTweensOf(this.ball);

        gsap.to(this.ball, {
            duration: 0.5,
            y: "-=50",
            yoyo: true,
            repeat: 1,
            ease: "power1.inOut"
        });
    }

    private animateBlock(event: GameEvent) {
        // Kill any existing animations
        gsap.killTweensOf(this.ball);

        gsap.to(this.ball, {
            duration: 0.3,
            y: "+=30",
            x: event.team === 'home' ? "-=50" : "+=50",
            ease: "power3.out"
        });
    }

    public updateGameState(_state: GameState) {
        // 更新球场状态
        // 可以根据需要添加更多状态更新逻辑
    }

    public playEvent(event: GameEvent) {
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
        // Kill all animations before destroying
        gsap.killTweensOf(this.ball);
        this.app.destroy(true);
    }

    private createPlayers() {
        // 创建主队球员
        const homePositions = [
            { x: 150, y: 125 },
            { x: 150, y: 225 },
            { x: 150, y: 325 },
            { x: 250, y: 175 },
            { x: 250, y: 275 }
        ];

        // 创建客队球员
        const awayPositions = [
            { x: 650, y: 125 },
            { x: 650, y: 225 },
            { x: 650, y: 325 },
            { x: 550, y: 175 },
            { x: 550, y: 275 }
        ];

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

    // 添加一个方法来更新球员位置
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
        overlay.alpha = 0; // 初始设置为透明
        this.court.addChild(overlay);

        // 创建艺术字体的文本样式
        const style = new PIXI.TextStyle({
            fontFamily: 'Arial',
            fontSize: 48,
            fontWeight: 'bold',
            fill: ['#FF0000'],
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
        this.gameStartText.scale.set(0.5); // 初始缩放
        this.court.addChild(this.gameStartText);

        // 创建动画时间轴
        const tl = gsap.timeline();

        // 背景淡入
        tl.to(overlay, {
            alpha: 1,
            duration: 0.3,
            ease: "power2.inOut"
        })
        // 文字弹出动画
        .to(this.gameStartText.scale, {
            x: 1,
            y: 1,
            duration: 1,
            ease: "elastic.out(1, 0.3)"
        })
        // 保持显示
        .to({}, {
            duration: 1.2 // 停留时间
        })
        // 同时淡出文字和背景
        .to([this.gameStartText, overlay], {
            alpha: 0,
            duration: 0.3,
            ease: "power2.in",
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
} 