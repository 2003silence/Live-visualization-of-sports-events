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
        // ... 添加更多动画
    }

    private animateShot(event: GameEvent) {
        const isHome = event.team === 'home';
        const startX = isHome ? 200 : 600;
        const endX = isHome ? 750 : 50;

        gsap.to(this.ball, {
            duration: 1,
            x: endX,
            y: 200,
            ease: "power2.out",
            onComplete: () => {
                // 重置球的位置
                this.ball.position.set(400, 200);
            }
        });
    }

    private animateRebound(event: GameEvent) {
        gsap.to(this.ball, {
            duration: 0.5,
            y: "-=50",
            yoyo: true,
            repeat: 1,
            ease: "power1.inOut"
        });
    }

    private animateBlock(event: GameEvent) {
        gsap.to(this.ball, {
            duration: 0.3,
            y: "+=30",
            x: event.team === 'home' ? "-=50" : "+=50",
            ease: "power3.out"
        });
    }

    public updateGameState(state: GameState) {
        // 清除现有球员
        this.players.forEach(player => {
            this.court.removeChild(player);
        });
        this.players.clear();

        // 初始化主队球员
        for (let i = 0; i < 5; i++) {
            const player = this.createPlayer('home', String(i + 1));
            player.position.set(
                this.INITIAL_POSITIONS.home[i].x,
                this.INITIAL_POSITIONS.home[i].y
            );
            this.players.set(`home_${i}`, player);
            this.court.addChild(player);
        }

        // 初始化客队球员
        for (let i = 0; i < 5; i++) {
            const player = this.createPlayer('away', String(i + 1));
            player.position.set(
                this.INITIAL_POSITIONS.away[i].x,
                this.INITIAL_POSITIONS.away[i].y
            );
            this.players.set(`away_${i}`, player);
            this.court.addChild(player);
        }

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
        this.app.destroy(true);
    }
} 