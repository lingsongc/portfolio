import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import { preload } from "react-dom";
import type { ImageDescriptor } from "../../types/images";
import type { MainCircleEndpoint } from "../../types/mainCircle";
import type { SceneId, ScenePhase } from "../../types/scene";
import { MAIN_CIRCLE_TRAVEL_DURATION_MS, mainCircleTravelAtTime } from "./mainCircleGeometry";

type MainCircleOptions = {
    currentSceneId: SceneId;
    requestedSceneId: SceneId | null;
    phase: ScenePhase;
    travelProgress: number;
    layoutVersion: number;
    resolveEndpoint: (sceneId: SceneId) => MainCircleEndpoint;
    activeScrollerRef?: RefObject<HTMLDivElement | null>;
};

type EndpointSnapshot = { from: MainCircleEndpoint; to: MainCircleEndpoint };
type SceneImageRegistry = Partial<Record<SceneId, ImageDescriptor>>;

// Owns the persistent circle's endpoint snapshot, shared geometry, and image registry.
export function useMainCircle({
    currentSceneId,
    requestedSceneId,
    phase,
    travelProgress,
    layoutVersion,
    resolveEndpoint,
    activeScrollerRef,
}: MainCircleOptions) {
    const [endpoints, setEndpoints] = useState<EndpointSnapshot | null>(null);
    const [images, setImages] = useState<SceneImageRegistry>({});
    const renderedEndpointRef = useRef<MainCircleEndpoint | null>(null);

    useLayoutEffect(() => {
        void layoutVersion;
        const from = phase === "moving" && renderedEndpointRef.current
            ? renderedEndpointRef.current : resolveEndpoint(currentSceneId);
        const to = phase === "moving" && requestedSceneId ? resolveEndpoint(requestedSceneId) : from;
        setEndpoints({ from, to });
    }, [currentSceneId, layoutVersion, phase, requestedSceneId, resolveEndpoint]);

    // Derive every frame from the coordinator's clock without scheduling a second render.
    const snapshot = useMemo(() => endpoints ? mainCircleTravelAtTime(
        endpoints.from,
        endpoints.to,
        (phase === "moving" ? travelProgress : phase === "opening" ? 1 : 0) * MAIN_CIRCLE_TRAVEL_DURATION_MS,
        smoothDirectTravelEase,
    ) : null, [endpoints, phase, travelProgress]);
    renderedEndpointRef.current = snapshot?.endpoint ?? null;

    // Track only the explicit scene scroller; local content flow never drives scene state.
    useLayoutEffect(() => {
        if (phase === "moving") return;
        const scroller = activeScrollerRef?.current;
        if (!scroller) return;
        const measure = () => {
            const endpoint = resolveEndpoint(currentSceneId);
            setEndpoints({ from: endpoint, to: endpoint });
        };
        const observer = new ResizeObserver(measure);
        if (scroller.firstElementChild) observer.observe(scroller.firstElementChild);
        scroller.addEventListener("scroll", measure, { passive: true });
        document.fonts.addEventListener("loadingdone", measure);
        return () => {
            observer.disconnect();
            scroller.removeEventListener("scroll", measure);
            document.fonts.removeEventListener("loadingdone", measure);
        };
    }, [activeScrollerRef, currentSceneId, phase, resolveEndpoint]);

    const publishSceneImage = useCallback((sceneId: SceneId, image: ImageDescriptor | null) => {
        setImages((current) => updateSceneImage(current, sceneId, image));
    }, []);

    // Starts the destination download during closing without exposing it over the void.
    useEffect(() => {
        const requestedImage = requestedSceneId ? images[requestedSceneId] : null;
        if (requestedImage) preload(requestedImage.src, { as: "image" });
    }, [images, requestedSceneId]);

    const imageState = useMemo(() => resolveImageState(images, {
        currentSceneId, phase,
    }), [currentSceneId, images, phase]);

    return { geometry: snapshot?.endpoint ?? null, easedTravelProgress: snapshot?.easedProgress ?? 0, ...imageState, publishSceneImage };
}

// Retains outgoing content invisibly over the void until the destination opens.
export function resolveImageState(
    images: SceneImageRegistry,
    state: Pick<MainCircleOptions, "currentSceneId" | "phase">,
) {
    const image = images[state.currentSceneId] ?? null;
    return { image, imageVisible: image !== null && (state.phase === "idle" || state.phase === "opening") };
}

// Removes withdrawn descriptors so image-free scenes cannot retain stale content.
export function updateSceneImage(images: SceneImageRegistry, sceneId: SceneId, image: ImageDescriptor | null): SceneImageRegistry {
    if ((images[sceneId] ?? null) === image) return images;
    const next = { ...images };
    if (image) next[sceneId] = image;
    else delete next[sceneId];
    return next;
}

// Uses ease-in-out quart for a pronounced departure and arrival without overshoot.
export function smoothDirectTravelEase(progress: number) {
    return progress < 0.5
        ? 8 * progress ** 4
        : 1 - (-2 * progress + 2) ** 4 / 2;
}
