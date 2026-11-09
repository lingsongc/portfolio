import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { themeTransitionGeometry } from "./themeTransitionGeometry";

// Reveals the destination palette from the toggle while keeping both snapshots on the same scene.
export function useThemeTransition(reducedMotion: boolean, sceneBusy: boolean) {
    const [lightMode, setLightMode] = useState(false);
    const [busy, setBusy] = useState(false);
    const transitionRef = useRef<ViewTransition | null>(null);
    const lockedRef = useRef(false);

    useLayoutEffect(() => {
        document.documentElement.dataset.theme = "dark";
    }, []);

    // Environmental changes finish the selected theme instead of leaving a stale viewport snapshot.
    useEffect(() => {
        const skip = () => transitionRef.current?.skipTransition();
        const handleVisibility = () => { if (document.hidden) skip(); };
        window.addEventListener("resize", skip);
        window.addEventListener("popstate", skip);
        window.addEventListener("hashchange", skip);
        document.addEventListener("visibilitychange", handleVisibility);
        return () => {
            skip();
            window.removeEventListener("resize", skip);
            window.removeEventListener("popstate", skip);
            window.removeEventListener("hashchange", skip);
            document.removeEventListener("visibilitychange", handleVisibility);
        };
    }, []);

    useEffect(() => {
        if (reducedMotion) transitionRef.current?.skipTransition();
    }, [reducedMotion]);

    // Measure the actual button, so keyboard, Home orbit, rail, and narrow positions share one origin.
    const toggleTheme = async (button: HTMLButtonElement) => {
        if (sceneBusy || lockedRef.current) return;
        const nextLightMode = !lightMode;
        const root = document.documentElement;
        const applyTheme = () => flushSync(() => {
            root.dataset.theme = nextLightMode ? "light" : "dark";
            setLightMode(nextLightMode);
        });
        if (reducedMotion || !document.startViewTransition || document.hidden) {
            applyTheme();
            return;
        }

        const { x, y, radius } = themeTransitionGeometry(button.getBoundingClientRect(), innerWidth, innerHeight);
        lockedRef.current = true;
        root.dataset.themeRevealing = "true";
        flushSync(() => setBusy(true));
        let transition: ViewTransition | null = null;
        try {
            transition = document.startViewTransition(applyTheme);
            transitionRef.current = transition;
            await transition.ready;
            const animation = root.animate({
                clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`],
            }, {
                duration: 500,
                easing: "ease-in-out",
                fill: "both",
                pseudoElement: "::view-transition-new(root)",
            });
            await animation.finished;
        } catch {
            // A skipped/unsupported capture must still commit the requested palette and release input.
            transition?.skipTransition();
            applyTheme();
        } finally {
            if (transition) await transition.finished.catch(() => {});
            transitionRef.current = null;
            delete root.dataset.themeRevealing;
            lockedRef.current = false;
            setBusy(false);
        }
    };

    return { lightMode, busy, toggleTheme };
}
