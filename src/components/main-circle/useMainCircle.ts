import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
};

type EndpointSnapshot = { from: MainCircleEndpoint; key: string; to: MainCircleEndpoint };
type SceneImageRegistry = Partial<Record<SceneId, ImageDescriptor>>;

// Owns the persistent circle's endpoint snapshot, shared geometry, and image registry.
export function useMainCircle({
    currentSceneId,
    requestedSceneId,
    phase,
    travelProgress,
    layoutVersion,
    resolveEndpoint,
}: MainCircleOptions) {
    const endpointSnapshotRef = useRef<EndpointSnapshot | null>(null);
    const [geometry, setGeometry] = useState<MainCircleEndpoint | null>(null);
    const [easedTravelProgress, setEasedTravelProgress] = useState(0);
    const [images, setImages] = useState<SceneImageRegistry>({});

    useLayoutEffect(() => {
        void layoutVersion;
        if (phase !== "moving" || !requestedSceneId) {
            endpointSnapshotRef.current = null;
            setGeometry(resolveEndpoint(currentSceneId));
            setEasedTravelProgress(phase === "opening" ? 1 : 0);
            return;
        }

        const key = `${currentSceneId}:${requestedSceneId}`;
        if (endpointSnapshotRef.current?.key !== key) {
            endpointSnapshotRef.current = {
                from: resolveEndpoint(currentSceneId),
                key,
                to: resolveEndpoint(requestedSceneId),
            };
        }
        const endpoints = endpointSnapshotRef.current;
        const snapshot = mainCircleTravelAtTime(
            endpoints.from,
            endpoints.to,
            travelProgress * MAIN_CIRCLE_TRAVEL_DURATION_MS,
            smoothDirectTravelEase,
        );
        setGeometry(snapshot.endpoint);
        setEasedTravelProgress(snapshot.easedProgress);
    }, [currentSceneId, layoutVersion, phase, requestedSceneId, resolveEndpoint, travelProgress]);

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

    return { geometry, easedTravelProgress, ...imageState, publishSceneImage };
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

// Uses a smooth direct ease without overshooting either scene endpoint.
function smoothDirectTravelEase(progress: number) {
    return progress * progress * (3 - 2 * progress);
}
