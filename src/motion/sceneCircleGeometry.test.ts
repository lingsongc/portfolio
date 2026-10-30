import { describe, expect, it } from "vitest";
import { resolveMainCircleSceneEndpoint, type MainCircleSceneLayout } from "./sceneCircleGeometry";

const layout: MainCircleSceneLayout = {
    viewportWidth: 1440, viewportHeight: 900, circleWidth: 720, narrowLayout: false,
    experienceCenter: { top: 602, left: 1047 },
};

// Verifies placement from CSS measurements rather than duplicating responsive size formulas.
describe("scene circle endpoints", () => {
    it("centers Home, Projects and Contact using their measured width", () => {
        for (const id of ["home", "projects", "contact"] as const) {
            expect(resolveMainCircleSceneEndpoint(id, layout)).toEqual({ width: 720, top: 450, left: 720 });
        }
    });

    it("places About using the CSS layout mode regardless of viewport width", () => {
        expect(resolveMainCircleSceneEndpoint("about", { ...layout, circleWidth: 1440 }).left).toBe(-144);
        expect(resolveMainCircleSceneEndpoint("about", { ...layout, viewportWidth: 850, circleWidth: 807.5, narrowLayout: true }).left).toBe(-161.5);
    });

    it("uses the measured Experience center", () => {
        expect(resolveMainCircleSceneEndpoint("experience", layout)).toEqual({ width: 720, top: 602, left: 1047 });
    });

    it("keeps the Skills left edge at forty percent of viewport width", () => {
        const endpoint = resolveMainCircleSceneEndpoint("skills", layout);
        expect(endpoint.left - endpoint.width / 2).toBe(576);
    });
});
