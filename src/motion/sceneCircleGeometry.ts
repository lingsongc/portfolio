import type { MainCircleEndpoint } from "../types/mainCircle";
import type { SceneId } from "../types/scene";

// Supplies CSS-measured sizes and page-owned placement to the generic circle controller.
export type MainCircleSceneLayout = {
    viewportWidth: number;
    viewportHeight: number;
    circleWidth: number;
    narrowLayout: boolean;
    narrowCenter?: { top: number; left: number };
    experienceCenter: { top: number; left: number };
};

// Resolves scene placement without duplicating CSS sizes or media-query calculations.
export function resolveMainCircleSceneEndpoint(sceneId: SceneId, layout: MainCircleSceneLayout): MainCircleEndpoint {
    const { viewportWidth, viewportHeight, circleWidth, narrowLayout } = layout;
    const center = { width: circleWidth, top: viewportHeight / 2, left: viewportWidth / 2 };
    if (narrowLayout && layout.narrowCenter) return { width: circleWidth, ...layout.narrowCenter };
    switch (sceneId) {
        case "home":
        case "projects":
        case "contact":
            return center;
        case "about":
            return { ...center, left: circleWidth * (narrowLayout ? -0.2 : -0.1) };
        case "experience":
            return { width: circleWidth, ...layout.experienceCenter };
        case "skills":
            return { ...center, left: viewportWidth * 0.4 + circleWidth / 2 };
        default:
            return assertNever(sceneId);
    }
}

// Reports an unhandled scene at the page-owned endpoint boundary.
function assertNever(value: never): never { throw new Error(`Unknown scene: ${String(value)}`); }
