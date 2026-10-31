import { describe, expect, it } from "vitest";
import type { MainCircleEndpoint } from "../../types/mainCircle";
import { MAIN_CIRCLE_TRAVEL_DURATION_MS, mainCircleTravelAtTime, mainCircleInScrollContent } from "./mainCircleGeometry";
// Verifies generic interpolation independently of page layouts.
describe("main circle travel", () => {
    it("keeps a native scrolling circle at the same content position as its viewport endpoint moves", () => {
        const initial = { width: 320, top: 260, left: 195 };
        for (const scrollTop of [0, 12.5, 180, 458]) {
            expect(mainCircleInScrollContent({ ...initial, top: initial.top - scrollTop }, {
                top: 20, left: 5, scrollTop, scrollLeft: 0,
            })).toEqual({ width: 320, top: 240, left: 190 });
        }
    });

    it("preserves cropped circles and accounts for horizontal scroll without changing their size", () => {
        expect(mainCircleInScrollContent({ width: 624, top: -200, left: 180 }, {
            top: 10, left: 20, scrollTop: 80, scrollLeft: 15,
        })).toEqual({ width: 624, top: -130, left: 175 });
    });

    it("interpolates 1000ms travel with shared clamped easing", () => {
        const from: MainCircleEndpoint = { width: 1440, top: 450, left: -144 };
        const to: MainCircleEndpoint = { width: 621, top: 602, left: 1047 };
        expect(MAIN_CIRCLE_TRAVEL_DURATION_MS).toBe(1000);
        expect(mainCircleTravelAtTime(from, to, 500)).toEqual({
            endpoint: { width: 1030.5, top: 526, left: 451.5 }, easedProgress: 0.5,
        });
        expect(mainCircleTravelAtTime(from, to, 500, (progress) => progress * progress).easedProgress).toBe(0.25);
        expect(mainCircleTravelAtTime(from, to, -100).endpoint).toEqual(from);
        expect(mainCircleTravelAtTime(from, to, 1000).endpoint).toEqual(to);
        expect(mainCircleTravelAtTime(from, to, 1200).endpoint).toEqual(to);
    });
});
