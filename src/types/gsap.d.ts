declare module 'gsap' {
    export interface TweenVars {
        duration?: number;
        x?: number | string;
        y?: number | string;
        ease?: string;
        yoyo?: boolean;
        repeat?: number;
        alpha?: number;
        onComplete?: () => void;
        [key: string]: any;
    }

    export class Tween {
        kill(): void;
        pause(): this;
        play(): this;
        progress(value?: number): number;
        restart(): this;
        resume(): this;
        reverse(): this;
        seek(position: number | string): this;
    }

    export const gsap: {
        to(target: any, vars: TweenVars): Tween;
        from(target: any, vars: TweenVars): Tween;
        fromTo(target: any, fromVars: TweenVars, toVars: TweenVars): Tween;
        set(target: any, vars: TweenVars): Tween;
        registerPlugin(...args: any[]): void;
    };
}

declare module 'gsap/PixiPlugin' {
    const PixiPlugin: {
        registerPIXI(PIXI: any): void;
    };
    export { PixiPlugin };
} 