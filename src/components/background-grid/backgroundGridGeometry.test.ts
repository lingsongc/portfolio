import { describe, expect, it } from "vitest";
import {
    createTearEdgePath,
    createWarpedGridPaths,
    warpGridPoint,
    type GridCircle,
} from "./backgroundGridGeometry";

import { createGridTear } from "./backgroundGridTearGeometry";

const circle: GridCircle = { x: 0, y: 0, radius: 10 };

// Verifies grid path generation and the radial warp calculations.
describe("background grid geometry", () => {
    it("creates every horizontal and vertical grid line", () => {
        expect(createWarpedGridPaths(96, 48, null, 48)).toHaveLength(9);
    });

    it("keeps grid lines straight without a circle", () => {
        const [firstPath] = createWarpedGridPaths(96, 48, null, 48);
        const coordinates = pathCoordinates(firstPath);

        expect(coordinates.every(([x]) => x === -48)).toBe(true);
    });

    it("places exactly one vertical line at the center of every viewport", () => {
        for (const width of [390, 901, 1440, 1500]) {
            const paths = createWarpedGridPaths(width, 900, null);
            const verticals = paths.map(pathCoordinates).filter(points => points.every(([x]) => x === points[0][0]));
            expect(verticals.filter(points => points[0][0] === width / 2)).toHaveLength(1);
            const anchors = verticals.map(points => points[0][0]);
            expect(anchors.slice(1).every((x, index) => x - anchors[index] === 48)).toBe(true);
        }
    });

    it("leaves points outside the warp falloff unchanged", () => {
        expect(warpGridPoint(211, 0, circle)).toEqual([211, 0]);
    });

    it("applies the maximum displacement at the circle edge", () => {
        expect(warpGridPoint(10, 0, circle)).toEqual([62, 0]);
    });

    it("reduces displacement with distance", () => {
        const [warpedX] = warpGridPoint(100, 0, circle);

        expect(warpedX).toBeCloseTo(115.73);
    });

    it("does not move a point at the circle center", () => {
        expect(warpGridPoint(0, 0, circle)).toEqual([0, 0]);
    });

    it("produces finite SVG coordinates near viewport edges", () => {
        const paths = createWarpedGridPaths(320, 180, { x: 320, y: 180, radius: 80 });

        expect(paths.every((path) => !path.includes("NaN") && !path.includes("Infinity"))).toBe(true);
    });

    it("splits rows crossed by the tear instead of bridging the cavity", () => {
        const tear = createGridTear(1440, 900, 1);
        const resting = createWarpedGridPaths(1440, 900, null);
        const tearing = createWarpedGridPaths(1440, 900, null, 48, tear);
        expect(tearing.some((path) => (path.match(/M/g) ?? []).length === 2)).toBe(true);
        expect(tearing[0]).toBe(resting[0]);
        expect(createTearEdgePath(tear, null).match(/M/g)).toHaveLength(2);
        expect(createTearEdgePath(createGridTear(1440, 900, 0), null)).toBe("");
    });

    it("keeps both torn lips on the exact top or bottom boundary as a preview returns", () => {
        for (const height of [900, 901, 844]) {
            const resting = createWarpedGridPaths(1440, height, null);
            const centerIndex = resting.findIndex(path => pathCoordinates(path).every(([x]) => x === 720));
            for (const direction of [-1, 1] as const) {
                for (const preview of [0.6, 0.2, 0.001]) {
                    const tear = createGridTear(1440, height, preview * direction);
                    const paths = createWarpedGridPaths(1440, height, null, 48, tear);
                    const edgeY = direction === 1 ? height : 0;
                    const edgePoints = pathCoordinates(paths[centerIndex]).filter(([, y]) => y === edgeY);
                    expect(edgePoints).toHaveLength(2);
                    expect(edgePoints[0][0]).toBeLessThan(720);
                    expect(edgePoints[1][0]).toBeGreaterThan(720);
                }
            }
        }
    });

    it("keeps both directions finite across viewport sizes and the full tear", () => {
        for (const [width, height] of [[1440, 900], [390, 844], [900, 400]]) {
            for (const direction of [-1, 1] as const) {
                for (const progress of [0, 0.1, 0.5, 0.9, 1]) {
                    const tear = createGridTear(width, height, 0, progress, direction);
                    const paths = createWarpedGridPaths(width, height, null, 48, tear);
                    expect(paths.every((path) => !/NaN|Infinity/.test(path))).toBe(true);
                }
            }
        }
    });

});

// Extracts numeric points from one generated SVG path.
function pathCoordinates(path: string) {
    return [...path.matchAll(/[ML](-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g)]
        .map((match) => [Number(match[1]), Number(match[2])] as const);
}
