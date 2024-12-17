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

    private animateBlock(event: GameEvent) {
        gsap.to(this.ball, {
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
        // Kill all animations before destroying
        gsap.killTweensOf(this.ball);
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