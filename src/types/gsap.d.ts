import { Tween, TweenVars } from 'gsap';

declare module 'gsap' {
    interface GSAPStatic {
        to(target: any, vars: TweenVars): Tween;
        from(target: any, vars: TweenVars): Tween;
        fromTo(target: any, fromVars: TweenVars, toVars: TweenVars): Tween;
        set(target: any, vars: TweenVars): Tween;
        timeline(vars?: {}): Timeline;
        killTweensOf(target: any): void;
        registerPlugin(...args: any[]): void;
    }

    interface Timeline {
        to(target: any, vars: TweenVars): Timeline;
    }

    const gsap: GSAPStatic;
    export { gsap };
}

declare module 'gsap/PixiPlugin' {
    const PixiPlugin: {
        registerPIXI(PIXI: any): void;
    };
    export { PixiPlugin };
} 