import { describe, expect, it } from "vitest";
import { fitProjectAngleToViewport, projectOrbitAngle, narrowProjectLayout } from "./projectGeometry";

// Verifies deterministic project angles and viewport safety corrections.
describe("project orbit geometry", () => {
    it("returns the same angle for the same project", () => {
        expect(projectOrbitAngle("modulo", 0, 4)).toBe(projectOrbitAngle("modulo", 0, 4));
    });

    it("keeps ID-based variation within its allowed range", () => {
        const projectCount = 4;

        ["alpha", "beta", "gamma", "delta"].forEach((id, index) => {
            const baseAngle = 90 + index * 90;
            expect(Math.abs(projectOrbitAngle(id, index, projectCount) - baseAngle)).toBeLessThanOrEqual(18);
        });
    });

    it("distributes projects into separate orbit sectors", () => {
        const angles = ["alpha", "beta", "gamma", "delta"]
            .map((id, index) => projectOrbitAngle(id, index, 4));

        expect(new Set(angles).size).toBe(4);
    });

    it("normalizes angles outside one full rotation", () => {
        expect(fitProjectAngleToViewport(-90, 100, 10, 300, 300)).toBe(270);
        expect(fitProjectAngleToViewport(450, 100, 10, 300, 300)).toBe(90);
    });

    it("leaves vertically safe angles unchanged", () => {
        expect(fitProjectAngleToViewport(90, 500, 50, 1200, 600)).toBe(90);
        expect(fitProjectAngleToViewport(270, 500, 50, 1200, 600)).toBe(270);
    });

    it("moves an unsafe top angle to the visible boundary", () => {
        const safeOffset = Math.acos(249 / 500) * 180 / Math.PI;

        expect(fitProjectAngleToViewport(0, 500, 50, 1200, 600)).toBeCloseTo(safeOffset, 1);
    });

    it("increases the correction for larger planets", () => {
        const smallPlanetAngle = fitProjectAngleToViewport(0, 500, 20, 1200, 600);
        const largePlanetAngle = fitProjectAngleToViewport(0, 500, 80, 1200, 600);

        expect(largePlanetAngle).toBeGreaterThan(smallPlanetAngle);
    });

    it("moves a side planet inside a narrow viewport without shrinking its ring", () => {
        const angle = fitProjectAngleToViewport(90, 284, 30, 320, 700);
        const horizontalOffset = Math.sin(angle * Math.PI / 180) * 284;

        expect(Math.abs(horizontalOffset)).toBeLessThanOrEqual(129.5);
    });

    it("returns the nearest safe side across circular wraparound", () => {
        const angle = fitProjectAngleToViewport(359, 500, 50, 1200, 600);
        expect(angle).toBeGreaterThan(290);
        expect(angle).toBeLessThan(310);
    });
});

// Checks shared-center rings, safe thumbnail packing, and the three-ring overflow rule.
describe("narrow project rings", () => {
    const layoutFor = (count: number, width = 591) => narrowProjectLayout(count, width, Math.min(width * 0.91, 480), 72, 64);

    it("places every thumbnail on a ring centered on the main image", () => {
        const layout = layoutFor(12);
        for (const planet of layout.planets) {
            expect(Math.hypot(planet.x - layout.center.x, planet.y - layout.center.y))
                .toBeCloseTo(layout.radii[planet.ringIndex], 8);
        }
        expect(layout.center).toEqual({ x: 295.5, y: 240 });
        expect(layout.radii[0] - 240).toBe(64);
    });

    it("fills each ring before adding another and retains thumbnail size through three rings", () => {
        const first = layoutFor(2);
        expect(first.radii).toHaveLength(1);
        const second = layoutFor(first.capacities[0] + 1);
        expect(second.radii).toHaveLength(2);
        const third = layoutFor(second.capacities[0] + second.capacities[1] + 1);
        expect(third.radii).toHaveLength(3);
        expect(third.planetSize).toBe(72);
        expect(second.planets.filter(p => p.ringIndex === 0)).toHaveLength(first.capacities[0]);
    });

    it("shrinks only after all three rings fill", () => {
        const layout = layoutFor(60);
        expect(layout.radii).toHaveLength(3);
        expect(layout.planetSize).toBeLessThan(72);
        expect(layout.planets).toHaveLength(60);
    });

    it.each([280, 350, 591, 720])("keeps thumbnails, outlines, and neighbors apart at width %i", width => {
        const layout = layoutFor(40, width);
        const footprintRadius = layout.planetSize * 0.6;
        for (const [index, planet] of layout.planets.entries()) {
            expect(planet.x - footprintRadius).toBeGreaterThanOrEqual(0);
            expect(planet.x + footprintRadius).toBeLessThanOrEqual(width);
            expect(planet.y + footprintRadius).toBeLessThanOrEqual(layout.height);
            for (const other of layout.planets.slice(index + 1)) {
                expect(Math.hypot(planet.x - other.x, planet.y - other.y)).toBeGreaterThan(layout.planetSize * 1.2);
            }
        }
    });
});
