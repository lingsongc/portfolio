import { describe, expect, it } from "vitest";
import { themeTransitionGeometry } from "./themeTransitionGeometry";

// Checks that the reveal starts at the control and fully covers every viewport corner.
describe("themeTransitionGeometry", () => {
    it("uses the button center rather than the pointer position", () => {
        expect(themeTransitionGeometry({ left: 276, top: 376, width: 48, height: 48 }, 600, 800))
            .toEqual({ x: 300, y: 400, radius: 501 });
    });

    it("covers the opposite corners from desktop rail and mobile placements", () => {
        for (const [width, height, left, top] of [[1440, 900, 1384, 8], [390, 844, 330, 12]]) {
            const result = themeTransitionGeometry({ left, top, width: 48, height: 48 }, width, height);
            for (const [x, y] of [[0, 0], [width, 0], [0, height], [width, height]]) {
                expect(result.radius).toBeGreaterThan(Math.hypot(x - result.x, y - result.y));
            }
        }
    });
});
