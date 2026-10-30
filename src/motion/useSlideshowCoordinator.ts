import { useCallback, useEffect, useRef, useState } from "react";
import { MAIN_CIRCLE_TRAVEL_DURATION_MS } from "../components/main-circle/mainCircleGeometry";
import { sceneOrder, type SceneDirection, type SceneId, type SceneLifecycleControl, type SceneRequest, type SceneRequestResult } from "../types/scene";

const SCENE_VISUAL_DURATION_MS = 500;

export type SceneTransitionState =
    | { currentSceneId: SceneId; direction: null; phase: "idle"; requestedSceneId: null }
    | { currentSceneId: SceneId; direction: SceneDirection; phase: "closing" | "moving" | "opening"; requestedSceneId: SceneId };
type CoordinatorState = SceneTransitionState & { settledVersion: number; travelProgress: number };

// Owns slideshow state, phase timing, URL behavior, recovery, and reduced motion.
export function useSlideshowCoordinator() {
    const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const [state, setState] = useState<CoordinatorState>(() => ({ ...createSceneTransitionState(initialSceneIdFromHash(window.location.hash)), settledVersion: 0, travelProgress: 0 }));
    const stateRef = useRef(state);
    const reducedMotionRef = useRef(reducedMotion);
    const lastHandledHashRef = useRef(window.location.hash);
    const historyDestinationRef = useRef<SceneId | null>(null);
    const lastSettledVersionRef = useRef(state.settledVersion);
    const phaseFrameRef = useRef(0);
    const travelFrameRef = useRef(0);

    const commit = useCallback((next: CoordinatorState) => { stateRef.current = next; setState(next); }, []);
    const settleRequestedScene = useCallback((refreshLayout = false) => {
        const current = stateRef.current;
        if (current.phase === "idle" && !refreshLayout) return false;
        cancelAnimationFrame(phaseFrameRef.current);
        cancelAnimationFrame(travelFrameRef.current);
        commit(settleSceneLayout(current));
        return true;
    }, [commit]);

    const requestScene = useCallback((request: SceneRequest): SceneRequestResult => {
        const current = stateRef.current;
        const update = requestSceneTransition(current, request);
        if (update.result.status !== "accepted") return update.result;
        if (request.source !== "history") historyDestinationRef.current = null;
        commit(reducedMotionRef.current
            ? { ...createSceneTransitionState(update.result.destinationSceneId), settledVersion: current.settledVersion + 1, travelProgress: 0 }
            : { ...update.state, settledVersion: current.settledVersion, travelProgress: 0 });
        return update.result;
    }, [commit]);

    // Runs paint-aligned close, travel, and open clocks for the current transition.
    useEffect(() => {
        cancelAnimationFrame(phaseFrameRef.current);
        cancelAnimationFrame(travelFrameRef.current);
        if (state.phase === "closing" || state.phase === "opening") {
            const visualPhase = state.phase;
            const startedAt = performance.now();
            // A paint-aligned clock keeps the CSS transition active without updating React on every frame.
            const tick = (now: number) => {
                const current = stateRef.current;
                if (current.phase !== visualPhase) return;
                if (now - startedAt >= SCENE_VISUAL_DURATION_MS) {
                    commit(visualPhase === "closing"
                        ? { ...advanceSceneTransition(current), settledVersion: current.settledVersion, travelProgress: 0 }
                        : { ...createSceneTransitionState(current.requestedSceneId), settledVersion: current.settledVersion, travelProgress: 0 });
                    return;
                }
                phaseFrameRef.current = requestAnimationFrame(tick);
            };
            phaseFrameRef.current = requestAnimationFrame(tick);
        } else if (state.phase === "moving") {
            const startedAt = performance.now();
            const tick = (now: number) => {
                const current = stateRef.current;
                if (current.phase !== "moving") return;
                const progress = clamp((now - startedAt) / MAIN_CIRCLE_TRAVEL_DURATION_MS, 0, 1);
                if (progress >= 1) {
                    commit({ ...advanceSceneTransition(current), settledVersion: current.settledVersion, travelProgress: 1 });
                    return;
                }
                commit({ ...current, travelProgress: progress });
                travelFrameRef.current = requestAnimationFrame(tick);
            };
            travelFrameRef.current = requestAnimationFrame(tick);
        }
        return () => { cancelAnimationFrame(phaseFrameRef.current); cancelAnimationFrame(travelFrameRef.current); };
    }, [commit, state.phase]);

    // Tracks reduced-motion changes and settles any active transition immediately.
    useEffect(() => {
        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        const updatePreference = () => {
            reducedMotionRef.current = mediaQuery.matches;
            setReducedMotion(mediaQuery.matches);
            if (mediaQuery.matches) settleRequestedScene();
        };
        mediaQuery.addEventListener("change", updatePreference);
        return () => mediaQuery.removeEventListener("change", updatePreference);
    }, [settleRequestedScene]);

    // Replaces an invalid initial hash with the canonical Home scene URL.
    useEffect(() => {
        if (!window.location.hash || sceneIdFromHash(window.location.hash)) return;
        lastHandledHashRef.current = "#home";
        window.history.replaceState({ sceneId: "home" }, "", sceneUrl("home", window.location));
    }, []);

    // Publishes the arrived scene to history when opening begins or recovery settles.
    useEffect(() => {
        const arrivedDuringOpening = state.phase === "opening" && state.requestedSceneId === state.currentSceneId;
        const arrivedImmediately = state.settledVersion !== lastSettledVersionRef.current;
        if (!arrivedDuringOpening && !arrivedImmediately) return;
        lastSettledVersionRef.current = state.settledVersion;
        // A browser-selected URL already owns its history entry, even during pending travel.
        if (historyDestinationRef.current !== null) return;
        if (sceneIdFromHash(window.location.hash) === state.currentSceneId) return;
        lastHandledHashRef.current = `#${state.currentSceneId}`;
        window.history.pushState({ sceneId: state.currentSceneId }, "", sceneUrl(state.currentSceneId, window.location));
    }, [state.currentSceneId, state.phase, state.requestedSceneId, state.settledVersion]);

    // Settles active transitions when layout or document visibility invalidates geometry.
    useEffect(() => {
        const recover = () => { settleRequestedScene(true); };
        const hide = () => { if (document.hidden) settleRequestedScene(); };
        window.addEventListener("resize", recover);
        window.addEventListener("orientationchange", recover);
        document.addEventListener("visibilitychange", hide);
        return () => {
            window.removeEventListener("resize", recover);
            window.removeEventListener("orientationchange", recover);
            document.removeEventListener("visibilitychange", hide);
        };
    }, [settleRequestedScene]);

    // Routes Back, Forward, and external hash changes through the same scene request path.
    useEffect(() => {
        const requestLocationScene = () => {
            const hash = window.location.hash;
            if (hash === lastHandledHashRef.current) return;
            lastHandledHashRef.current = hash;
            const destinationSceneId = sceneIdFromHash(hash);
            if (!destinationSceneId) {
                lastHandledHashRef.current = "#home";
                window.history.replaceState({ sceneId: "home" }, "", sceneUrl("home", window.location));
            }
            historyDestinationRef.current = destinationSceneId ?? "home";
            const result = requestScene({ kind: "direct", destinationSceneId: historyDestinationRef.current, source: "history" });
            if (result.status === "ignored" && result.reason === "same-scene") historyDestinationRef.current = null;
        };
        window.addEventListener("popstate", requestLocationScene);
        window.addEventListener("hashchange", requestLocationScene);
        return () => { window.removeEventListener("popstate", requestLocationScene); window.removeEventListener("hashchange", requestLocationScene); };
    }, [requestScene]);

    // Coalesces rapid history changes to the latest URL after the current transition finishes.
    useEffect(() => {
        const destinationSceneId = historyDestinationRef.current;
        if (state.phase !== "idle" || destinationSceneId === null) return;
        if (destinationSceneId === state.currentSceneId) {
            historyDestinationRef.current = null;
            return;
        }
        requestScene({ kind: "direct", destinationSceneId, source: "history" });
    }, [requestScene, state.currentSceneId, state.phase]);

    const lifecycleFor = useCallback((sceneId: SceneId): SceneLifecycleControl => ({
        active: state.phase !== "moving" && state.currentSceneId === sceneId,
        phase: state.phase,
        reducedMotion,
    }), [reducedMotion, state.currentSceneId, state.phase]);

    return { ...state, activeSceneId: state.phase === "moving" ? null : state.currentSceneId, busy: state.phase !== "idle", lifecycleFor, reducedMotion, requestScene };
}

// Creates the completed scene state used by initialization and recovery.
export function createSceneTransitionState(currentSceneId: SceneId): SceneTransitionState {
    return { currentSceneId, direction: null, phase: "idle", requestedSceneId: null };
}

// Invalidates endpoint measurements on resize, including when no transition is active.
export function settleSceneLayout(state: CoordinatorState): CoordinatorState {
    const destination = state.requestedSceneId ?? state.currentSceneId;
    return { ...createSceneTransitionState(destination), settledVersion: state.settledVersion + 1, travelProgress: 0 };
}

// Evaluates one request without queuing input while the coordinator is busy.
export function requestSceneTransition(state: SceneTransitionState, request: SceneRequest) {
    if (state.phase !== "idle") return { result: { status: "ignored", reason: "busy" } as const, state };
    const currentIndex = sceneOrder.indexOf(state.currentSceneId);
    const destinationSceneId = request.kind === "direct" ? request.destinationSceneId : sceneOrder[currentIndex + (request.direction === "forward" ? 1 : -1)] ?? null;
    if (!destinationSceneId) return { result: { status: "rejected", reason: "boundary" } as const, state };
    if (destinationSceneId === state.currentSceneId) return { result: { status: "ignored", reason: "same-scene" } as const, state };
    const direction = sceneOrder.indexOf(destinationSceneId) > currentIndex ? "forward" as const : "backward" as const;
    const result = { status: "accepted" as const, destinationSceneId, direction };
    return { result, state: { currentSceneId: state.currentSceneId, direction, phase: "closing" as const, requestedSceneId: destinationSceneId } };
}

// Advances one completed phase without activating intermediate scenes.
export function advanceSceneTransition(state: SceneTransitionState): SceneTransitionState {
    if (state.phase === "closing") return { ...state, phase: "moving" };
    if (state.phase === "moving") return { ...state, currentSceneId: state.requestedSceneId, phase: "opening" };
    if (state.phase === "opening") return createSceneTransitionState(state.requestedSceneId);
    return state;
}

// Accepts only known scene hashes so callers can recover invalid URLs safely.
export function sceneIdFromHash(hash: string): SceneId | null { const candidate = hash.replace(/^#/, ""); return sceneOrder.find((sceneId) => sceneId === candidate) ?? null; }
// Initializes missing or invalid hashes to the completed Home scene.
export function initialSceneIdFromHash(hash: string): SceneId { return sceneIdFromHash(hash) ?? "home"; }
// Changes the scene hash while preserving the current route and query string.
export function sceneUrl(sceneId: SceneId, location: Pick<Location, "pathname" | "search">) { return `${location.pathname}${location.search}#${sceneId}`; }
// Bounds clock progress so delayed frames cannot overshoot the destination.
function clamp(value: number, minimum: number, maximum: number) { return Math.min(Math.max(value, minimum), maximum); }
