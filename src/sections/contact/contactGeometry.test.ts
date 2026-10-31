import { describe, expect, it } from "vitest";
import {
    contactFinalOffset,
    contactFittedFinalOffset,
    contactInitialOffset,
    contactProfileDiameter,
    contactRowOffset,
} from "./contactGeometry";

// Verifies the radial start and end positions of Contact profile circles.
describe("contact geometry", () => {
    it("places four row balls symmetrically below the form with a detached gap", () => {
        const positions = [0, 1, 2, 3].map((index) => contactRowOffset(index, 4, 350, 60, 390, 32));
        expect(positions).toEqual([[-146.25, 237], [-48.75, 237], [48.75, 237], [146.25, 237]]);
        for (const [x, y] of positions) {
            expect(Math.abs(x) + 30).toBeLessThan(195);
            expect(y - 30 - 175).toBe(32);
            expect(Math.hypot(
                contactInitialOffset([x / 350, y / 350], 60 / 350, 350, 0),
                contactInitialOffset([x / 350, y / 350], 60 / 350, 350, 1),
            ) + 30).toBeLessThan(175);
        }
    });
    it("preserves satellite sizes when the desktop form grows", () => {
        expect(contactProfileDiameter(1 / 3, 1440, 900)).toBeCloseTo(168);
        expect(contactProfileDiameter(7 / 15, 1440, 900)).toBeCloseTo(235.2);

    });

    it("scales final offsets with the orbit size", () => {
        expect(contactFinalOffset([-0.78, 0.26], 500, 0)).toBe(-390);
        expect(contactFinalOffset([-0.78, 0.26], 500, 1)).toBe(130);
    });

    it("keeps the initial circle inside the main circle", () => {
        const offset = [-0.78, 0.26] as const;
        const x = contactInitialOffset(offset, 0.36, 500, 0);
        const y = contactInitialOffset(offset, 0.36, 500, 1);

        expect(Math.hypot(x, y)).toBeCloseTo(150);
    });

    it("fits profiles flush to viewport edges without a reserved gap", () => {
        expect(contactFittedFinalOffset([-0.78, 0.26], 0.36, 179, 320, 700, 0))
            .toBeCloseTo(-127.78);
        expect(contactFittedFinalOffset([0.78, -0.28], 0.31, 179, 320, 700, 0))
            .toBeCloseTo(132.255);
    });

    it("preserves the movement direction", () => {
        expect(contactInitialOffset([-0.78, 0.26], 0.36, 500, 0)).toBeLessThan(0);
        expect(contactInitialOffset([-0.78, 0.26], 0.36, 500, 1)).toBeGreaterThan(0);
    });

    it("handles a zero-length direction safely", () => {
        expect(contactInitialOffset([0, 0], 0.3, 500, 0)).toBe(0);
        expect(contactInitialOffset([0, 0], 0.3, 500, 1)).toBe(0);
    });
});
