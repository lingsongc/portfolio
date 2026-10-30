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
        const positions = [0, 1, 2, 3].map((index) => contactRowOffset(index, 4, 350, 60, 12, 32));
        expect(positions).toEqual([[-108, 237], [-36, 237], [36, 237], [108, 237]]);
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
        expect(contactProfileDiameter(1 / 3, 720, 1440, 900, false)).toBeCloseTo(168);
        expect(contactProfileDiameter(7 / 15, 720, 1440, 900, false)).toBeCloseTo(235.2);
        expect(contactProfileDiameter(1 / 3, 335.4, 390, 844, true)).toBeCloseTo(111.8);
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

    it("keeps final profile circles inside narrow viewport edges", () => {
        expect(contactFittedFinalOffset([-0.78, 0.26], 0.36, 179, 320, 700, 0))
            .toBeCloseTo(-123.78);
        expect(contactFittedFinalOffset([0.78, -0.28], 0.31, 179, 320, 700, 0))
            .toBeCloseTo(128.255);
    });

    it("preserves the movement direction", () => {
        expect(contactInitialOffset([-0.78, 0.26], 0.36, 500, 0)).toBeLessThan(0);
        expect(contactInitialOffset([-0.78, 0.26], 0.36, 500, 1)).toBeGreaterThan(0);
    });

    it("reserves extra horizontal space for the narrow navigation rail", () => {
        expect(contactFittedFinalOffset([0.28, -0.84], 5 / 12, 275.2, 320, 568, 0, 48))
            .toBeCloseTo(54.6666667);
    });

    it("handles a zero-length direction safely", () => {
        expect(contactInitialOffset([0, 0], 0.3, 500, 0)).toBe(0);
        expect(contactInitialOffset([0, 0], 0.3, 500, 1)).toBe(0);
    });
});
// Checks satellite clearance using representative CSS-measured compact orbit sizes.
describe("compact Contact clearance", () => {
    it.each([[768, 1024], [768, 900], [768, 400], [390, 844], [320, 568]])(
        "keeps the largest mobile Contact ball detached at %i by %i",
        (width, height) => {
            const size = Math.min(width * 0.86, height * 0.52);
            const diameterRatio = 7 / 15;
            const offset = [-0.28, 0.84] as const;
            const x = contactFittedFinalOffset(offset, diameterRatio, size, width, height, 0, 48);
            const y = contactFittedFinalOffset(offset, diameterRatio, size, width, height, 1);
            expect(Math.hypot(x, y) - size * (1 + diameterRatio) / 2).toBeGreaterThan(4);
        },
    );

    it.each([[1024, 768], [1280, 1024], [900, 900], [769, 512]])(
        "keeps every Contact ball detached in a compact %i by %i window",
        (width, height) => {
            const size = Math.min(width * 0.86, height * 0.52);
            const profiles = [
                { offset: [-0.28, -0.84], ratio: 1 / 3 },
                { offset: [0.28, -0.84], ratio: 5 / 12 },
                { offset: [-0.28, 0.84], ratio: 7 / 15 },
                { offset: [0.28, 0.84], ratio: 0.3 },
            ] as const;
            for (const profile of profiles) {
                const diameter = contactProfileDiameter(profile.ratio, size, width, height, true);
                const x = contactFittedFinalOffset(profile.offset, diameter / size, size, width, height, 0, 48);
                const y = contactFittedFinalOffset(profile.offset, diameter / size, size, width, height, 1);
                expect(Math.hypot(x, y) - (size + diameter) / 2).toBeGreaterThan(4);
            }
        },
    );

});
