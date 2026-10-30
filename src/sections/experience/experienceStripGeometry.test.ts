import { describe, expect, it } from "vitest";
import { snappedEntryIndex } from "./experienceStripGeometry";

// Protects snap selection against fractional scrolling, overscroll and empty collections.
describe("horizontal entry selection", () => {
    it("selects the nearest step and clamps native overscroll", () => {
        expect(snappedEntryIndex(79.8, 80, 4)).toBe(1);
        expect(snappedEntryIndex(121, 80, 4)).toBe(2);
        expect(snappedEntryIndex(-30, 80, 4)).toBe(0);
        expect(snappedEntryIndex(999, 80, 4)).toBe(3);
        expect(snappedEntryIndex(20, 0, 0)).toBe(0);
    });
});
