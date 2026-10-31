import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import { preload } from "react-dom";
import type { ImageDescriptor } from "../../types/images";
import type { MainCircleEndpoint, MainCircleScrollPlacement } from "../../types/mainCircle";
import type { SceneId, ScenePhase } from "../../types/scene";
import { MAIN_CIRCLE_TRAVEL_DURATION_MS, mainCircleTravelAtTime, mainCircleInScrollContent } from "./mainCircleGeometry";

type MainCircleOptions = {
    currentSceneId: SceneId;
    requestedSceneId: SceneId | null;
    phase: ScenePhase;
    travelProgress: number;
    layoutVersion: number;
    resolveEndpoint: (sceneId: SceneId) => MainCircleEndpoint;
    activeScrollerRef?: RefObject<HTMLDivElement | null>;
    scrollWithContent?: boolean;
};

type EndpointSnapshot = { from: MainCircleEndpoint; to: MainCircleEndpoint; scrollPlacement: MainCircleScrollPlacement | null };
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
    scrollWithContent = false,
}: MainCircleOptions) {
    const [endpoints, setEndpoints] = useState<EndpointSnapshot | null>(null);
    const [images, setImages] = useState<SceneImageRegistry>({});
    const renderedEndpointRef = useRef<MainCircleEndpoint | null>(null);

    useLayoutEffect(() => {
        void layoutVersion;
        const from = phase === "moving" && renderedEndpointRef.current
            ? renderedEndpointRef.current : resolveEndpoint(currentSceneId);
        const to = phase === "moving" && requestedSceneId ? resolveEndpoint(requestedSceneId) : from;
        // Transfer the image only after opening finishes, so changing hosts cannot interrupt its fade.
        const scrollPlacement = scrollWithContent && (phase === "idle" || phase === "closing")
            ? measureScrollPlacement(from, activeScrollerRef?.current) : null;
        setEndpoints({ from, to, scrollPlacement });
    }, [activeScrollerRef, currentSceneId, layoutVersion, phase, requestedSceneId, resolveEndpoint, scrollWithContent]);

    // Derive every frame from the coordinator's clock without scheduling a second render.
    const snapshot = useMemo(() => endpoints ? mainCircleTravelAtTime(
        endpoints.from,
        endpoints.to,
        (phase === "moving" ? travelProgress : phase === "opening" ? 1 : 0) * MAIN_CIRCLE_TRAVEL_DURATION_MS,
        smoothDirectTravelEase,
    ) : null, [endpoints, phase, travelProgress]);
    renderedEndpointRef.current = snapshot?.endpoint ?? null;

    // Track only the explicit scene scroller; resize recovery can enable it after a wide layout.
    useLayoutEffect(() => {
        if (phase === "moving") return;
        const scroller = activeScrollerRef?.current;
        if (!scroller) return;
        const measure = () => {
            const endpoint = resolveEndpoint(currentSceneId);
            const scrollPlacement = scrollWithContent && (phase === "idle" || phase === "closing")
                ? measureScrollPlacement(endpoint, scroller) : null;
            setEndpoints({ from: endpoint, to: endpoint, scrollPlacement });
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
    }, [activeScrollerRef, currentSceneId, layoutVersion, phase, resolveEndpoint, scrollWithContent]);

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

    return { geometry: snapshot?.endpoint ?? null, scrollPlacement: endpoints?.scrollPlacement ?? null,
        easedTravelProgress: snapshot?.easedProgress ?? 0, ...imageState, publishSceneImage };
}

// Capture content placement with its matching viewport measurement, never with a later scroll offset.
function measureScrollPlacement(endpoint: MainCircleEndpoint, host: HTMLDivElement | null | undefined): MainCircleScrollPlacement | null {
    if (!host) return null;
    const bounds = host.getBoundingClientRect();
    return { host, geometry: mainCircleInScrollContent(endpoint, {
        top: bounds.top, left: bounds.left, scrollTop: host.scrollTop, scrollLeft: host.scrollLeft,
    }) };
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
