import { describe, expect, it } from "vitest";
import type { MainCircleEndpoint } from "../../types/mainCircle";
import { MAIN_CIRCLE_TRAVEL_DURATION_MS, mainCircleTravelAtTime } from "./mainCircleGeometry";
// Verifies generic interpolation independently of page layouts.
describe("main circle travel", () => {
    it("interpolates 800ms travel with shared clamped easing", () => {
        const from: MainCircleEndpoint = { width: 1440, top: 450, left: -144 };
        const to: MainCircleEndpoint = { width: 621, top: 602, left: 1047 };
        expect(MAIN_CIRCLE_TRAVEL_DURATION_MS).toBe(800);
        expect(mainCircleTravelAtTime(from, to, 400)).toEqual({
            endpoint: { width: 1030.5, top: 526, left: 451.5 }, easedProgress: 0.5,
        });
        expect(mainCircleTravelAtTime(from, to, 400, (progress) => progress * progress).easedProgress).toBe(0.25);
        expect(mainCircleTravelAtTime(from, to, -100).endpoint).toEqual(from);
        expect(mainCircleTravelAtTime(from, to, 800).endpoint).toEqual(to);
        expect(mainCircleTravelAtTime(from, to, 1000).endpoint).toEqual(to);
    });
});
