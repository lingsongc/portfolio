import { describe, expect, it } from "vitest";
import { createGridTear, deformTearPoint } from "./backgroundGridTearGeometry";

// Verifies preview continuity, direction, locality, and the committed tear lifecycle.
describe("grid tear geometry", () => {
    it("continues the visible preview exactly at commitment", () => {
        const preview = createGridTear(1440, 900, 2 / 3);
        const committed = createGridTear(1440, 900, 2 / 3, 0, 1);
        expect(committed.span).toBe(preview.span);
        expect(deformTearPoint(720, 890, -1, committed))
            .toEqual(deformTearPoint(720, 890, -1, preview));
    });

    it("mirrors the complete tear for backward navigation without reversing its clock", () => {
        for (const progress of [0, 0.2, 0.5, 0.8, 1]) {
            const forward = createGridTear(1440, 900, 0.5, progress, 1);
            const backward = createGridTear(1440, 900, -0.5, progress, -1);
            const [x, y] = deformTearPoint(700, 850, -1, forward);
            const [mirroredX, mirroredY] = deformTearPoint(700, 50, -1, backward);
            expect(mirroredX).toBeCloseTo(x);
            expect(mirroredY).toBeCloseTo(900 - y);
            expect(backward.newOpacity).toBe(forward.newOpacity);
        }
    });

    it("keeps distant points static and has no initial upward tug", () => {
        const tear = createGridTear(1440, 900, 0.5);
        expect(deformTearPoint(0, 900, -1, tear)).toEqual([0, 900]);
        expect(deformTearPoint(720, 0, -1, tear)).toEqual([720, 0]);
        const tinyTear = createGridTear(1440, 900, 0, 0.001, 1);
        expect(deformTearPoint(720, 900, -1, tinyTear)[1]).toBeCloseTo(900, 4);
    });

    it("never pulls offscreen rows back into view while an incomplete tear returns", () => {
        for (const preview of [0.6, 0.2, 0.05, 0.001]) {
            for (const direction of [-1, 1] as const) {
                const tear = createGridTear(1440, 900, preview * direction);
                for (const y of [-48, -24, 912, 936]) {
                    expect(deformTearPoint(720, y, -1, tear)).toEqual([720, y]);
                }
                const edgeY = direction === 1 ? 900 : 0;
                expect(deformTearPoint(720, edgeY, -1, tear)[1]).toBe(edgeY);
            }
        }
    });

    it("accelerates upward and finishes with only the fresh grid", () => {
        const start = createGridTear(1440, 900, 0);
        const half = createGridTear(1440, 900, 0, 0.5, 1);
        const end = createGridTear(1440, 900, 0, 1, 1);
        expect(start.span).toBe(0);
        expect(half.span / end.span).toBeCloseTo(0.25 / 0.88);
        expect(end.oldOpacity).toBe(0);
        expect(end.newOpacity).toBe(1);
        expect(end.edgeOpacity).toBe(0);
        expect(createGridTear(1440, 900, 0).edgeOpacity).toBe(0);
    });
});
