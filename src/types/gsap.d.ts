declare module 'gsap' {
    interface TweenVars {
        duration?: number;
        x?: number;
        y?: number;
        ease?: string;
        yoyo?: boolean;
        repeat?: number;
        alpha?: number;
        onComplete?: () => void;
    }

    class Tween {
        kill(): void;
    }

    function to(target: any, vars: TweenVars): Tween;
}

export { to }; 