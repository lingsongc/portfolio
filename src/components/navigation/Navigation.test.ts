import { describe, expect, it } from "vitest";
import { transientRailMarkerProgress } from "./Navigation";

// Verifies Navigation's visual-only origin and intermediate rail markers.
describe("transient rail markers", () => {
    it("crossfades adjacent endpoints and omits equal endpoints", () => {
        expect(transientRailMarkerProgress("about", "experience", 0)).toEqual([
            { sceneId: "about", progress: 1 },
            { sceneId: "experience", progress: 0 },
        ]);
        const midpoint = transientRailMarkerProgress("about", "experience", 0.5);
        expect(midpoint[0]?.progress).toBeCloseTo(0.5);
        expect(midpoint[1]?.progress).toBeCloseTo(0.5);
        expect(transientRailMarkerProgress("home", "home", 0.5)).toEqual([]);
    });

    it("fills the destination only as the circle arrives", () => {
        expect(transientRailMarkerProgress("about", "skills", 0).at(-1)).toEqual({ sceneId: "skills", progress: 0 });
        expect(transientRailMarkerProgress("about", "skills", 1).at(-1)).toEqual({ sceneId: "skills", progress: 1 });
    });

    it("orders and crossfades distant forward markers", () => {
        expect(transientRailMarkerProgress("about", "skills", 1 / 3)).toEqual([
            { sceneId: "about", progress: 0 },
            { sceneId: "experience", progress: 1 },
            { sceneId: "projects", progress: 0 },
            { sceneId: "skills", progress: 0 },
        ]);
        const midpoint = transientRailMarkerProgress("about", "skills", 0.5);
        expect(midpoint.map(({ sceneId }) => sceneId)).toEqual(["about", "experience", "projects", "skills"]);
        expect(midpoint[1]?.progress).toBeCloseTo(0.5);
    });

    it("mirrors marker order and clamps progress", () => {
        expect(transientRailMarkerProgress("contact", "home", 0.2).map(({ sceneId }) => sceneId))
            .toEqual(["contact", "skills", "projects", "experience", "about", "home"]);
        const clamped = transientRailMarkerProgress("about", "skills", -1);
        expect(clamped[0]?.progress).toBe(1);
        expect(clamped.slice(1).every(({ progress }) => progress === 0)).toBe(true);
    });
});
