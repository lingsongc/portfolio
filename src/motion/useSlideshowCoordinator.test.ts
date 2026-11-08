import { describe, expect, it } from "vitest";
import {
    scenePhaseDuration,
    sceneTearProgress,
    advanceSceneTransition,
    createSceneTransitionState,
    initialSceneIdFromHash,
    requestSceneTransition,
    sceneIdFromHash,
    sceneUrl,
    settleSceneLayout,
} from "./useSlideshowCoordinator";

// Verifies pure request, phase, and URL decisions used by the React-owned coordinator.
describe("slideshow coordinator model", () => {
    it("accepts adjacent and distant requests with direction", () => {
        expect(requestSceneTransition(createSceneTransitionState("about"), {
            kind: "adjacent", direction: "forward", source: "wheel",
        })).toMatchObject({ result: { status: "accepted", destinationSceneId: "experience", direction: "forward" } });
        expect(requestSceneTransition(createSceneTransitionState("skills"), {
            kind: "direct", destinationSceneId: "about", source: "navigation",
        })).toMatchObject({ result: { status: "accepted", destinationSceneId: "about", direction: "backward" } });
    });

    it("rejects terminal requests and ignores same or busy requests", () => {
        expect(requestSceneTransition(createSceneTransitionState("home"), {
            kind: "adjacent", direction: "backward", source: "keyboard",
        }).result).toEqual({ status: "rejected", reason: "boundary" });
        expect(requestSceneTransition(createSceneTransitionState("about"), {
            kind: "direct", destinationSceneId: "about", source: "history",
        }).result).toEqual({ status: "ignored", reason: "same-scene" });
        const busy = requestSceneTransition(createSceneTransitionState("about"), {
            kind: "direct", destinationSceneId: "contact", source: "navigation",
        }).state;
        expect(requestSceneTransition(busy, {
            kind: "direct", destinationSceneId: "home", source: "history",
        }).result).toEqual({ status: "ignored", reason: "busy" });
    });

    it("advances close, movement, opening, and idle deterministically", () => {
        let state = requestSceneTransition(createSceneTransitionState("about"), {
            kind: "direct", destinationSceneId: "projects", source: "navigation",
        }).state;
        expect(state.phase).toBe("closing");
        state = advanceSceneTransition(state);
        expect(state.phase).toBe("moving");
        state = advanceSceneTransition(state);
        expect(state).toMatchObject({ phase: "opening", currentSceneId: "projects" });
        state = advanceSceneTransition(state);
        expect(state).toEqual(createSceneTransitionState("projects"));
    });

    it("parses and formats scene hashes", () => {
        expect(sceneIdFromHash("#experience")).toBe("experience");
        expect(sceneIdFromHash("#unknown")).toBeNull();
        expect(initialSceneIdFromHash("")).toBe("home");
        expect(sceneUrl("projects", { pathname: "/portfolio/", search: "?preview=1" }))
            .toBe("/portfolio/?preview=1#projects");
    });
});
// Resizing must refresh completed geometry as well as interrupted travel.
describe("layout recovery", () => {
    it("invalidates an idle scene's endpoint measurement", () => {
        expect(settleSceneLayout({
            currentSceneId: "about", requestedSceneId: null, phase: "idle", direction: null, source: null,
            settledVersion: 2, travelProgress: 0,
        })).toMatchObject({ currentSceneId: "about", phase: "idle", settledVersion: 3, travelProgress: 0 });
    });

    it("settles interrupted movement at the requested destination", () => {
        expect(settleSceneLayout({
            currentSceneId: "about", requestedSceneId: "skills", phase: "moving", direction: "forward", source: "wheel",
            settledVersion: 2, travelProgress: 0.3,
        })).toMatchObject({ currentSceneId: "skills", requestedSceneId: null, phase: "idle", settledVersion: 3, travelProgress: 0 });
    });
});

// The wheel tear continues into movement without extending the section close.
describe("phase timing", () => {
    it("keeps non-wheel closing at 400ms", () => {
        for (const source of ["navigation", "keyboard", "touch", "history"] as const) {
            const request = source === "navigation" || source === "history"
                ? { kind: "direct" as const, destinationSceneId: "projects" as const, source }
                : { kind: "adjacent" as const, direction: "forward" as const, source };
            const transition = requestSceneTransition(createSceneTransitionState("about"), request).state;
            expect(transition).toMatchObject({ source });
            expect(scenePhaseDuration(transition.phase)).toBe(400);
        }
    });

    it("starts circle movement after the standard 400ms close even for wheel requests", () => {
        const transition = requestSceneTransition(createSceneTransitionState("about"), {
            kind: "adjacent", direction: "backward", source: "wheel",
        }).state;
        expect(transition).toMatchObject({ source: "wheel", phase: "closing" });
        expect(scenePhaseDuration(transition.phase)).toBe(400);
        expect(scenePhaseDuration("moving")).toBe(1000);
        expect(scenePhaseDuration("opening")).toBe(400);
    });
});

// Pins the overlap boundary so the tear neither restarts nor finishes early during movement.
describe("overlapping tear clock", () => {
    it("continues seamlessly for the first 200ms of circle movement", () => {
        expect(sceneTearProgress("closing", 400, "wheel")).toBeCloseTo(2 / 3);
        expect(sceneTearProgress("moving", 0, "wheel")).toBeCloseTo(2 / 3);
        expect(sceneTearProgress("moving", 100, "wheel")).toBeCloseTo(5 / 6);
        expect(sceneTearProgress("moving", 200, "wheel")).toBe(1);
        expect(sceneTearProgress("moving", 1000, "wheel")).toBe(1);
    });

    it("never starts a tear for non-wheel navigation or after opening", () => {
        expect(sceneTearProgress("closing", 200, "navigation")).toBe(0);
        expect(sceneTearProgress("moving", 100, "keyboard")).toBe(0);
        expect(sceneTearProgress("opening", 100, "wheel")).toBe(0);
        expect(sceneTearProgress("idle", 0, null)).toBe(0);
    });
});
