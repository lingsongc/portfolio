import type { CSSProperties } from "react";

// Calculates project placement and viewport fitting for wide and narrow compositions.
export type ProjectPlanetStyle = CSSProperties & {
    "--project-angle": string;
    "--project-angle-inverse": string;
};

type ProjectPlanet = { x: number; y: number; ringIndex: number };

const thumbnailSpacingRatio = 1.8;

// Gives each project a stable angle with a small ID-based variation.
export function projectOrbitAngle(id: string, index: number, projectCount: number) {
    const separation = 360 / projectCount;
    const jitterLimit = Math.min(18, separation * 0.2);
    const hash = Array.from(id).reduce(
        (value, character) => (value * 31 + character.charCodeAt(0)) % 1000,
        0,
    );
    const jitter = (hash / 999 * 2 - 1) * jitterLimit;
    return 90 + index * separation + jitter;
}

// Adjusts an angle when its planet would extend beyond the viewport.
export function fitProjectAngleToViewport(
    angle: number,
    radius: number,
    planetRadius: number,
    viewportWidth: number,
    viewportHeight: number,
) {
    const horizontalLimit = Math.max(0, viewportWidth / 2 - planetRadius - 1);
    const verticalLimit = Math.max(0, viewportHeight / 2 - planetRadius - 1);
    const normalizedAngle = (angle % 360 + 360) % 360;
    const isSafe = (candidate: number) => {
        const radians = candidate * Math.PI / 180;
        return Math.abs(Math.sin(radians) * radius) <= horizontalLimit
            && Math.abs(Math.cos(radians) * radius) <= verticalLimit;
    };
    if (isSafe(normalizedAngle)) return normalizedAngle;

    // Searches outward from the requested angle, then refines only the first safe boundary.
    const coarseStep = 0.25;
    for (let distance = coarseStep; distance <= 180; distance += coarseStep) {
        for (const direction of [1, -1]) {
            const candidate = normalizeAngle(normalizedAngle + distance * direction);
            if (!isSafe(candidate)) continue;
            let unsafeDistance = Math.max(0, distance - coarseStep);
            let safeDistance = distance;
            for (let refinement = 0; refinement < 12; refinement += 1) {
                const midpoint = (unsafeDistance + safeDistance) / 2;
                if (isSafe(normalizeAngle(normalizedAngle + midpoint * direction))) safeDistance = midpoint;
                else unsafeDistance = midpoint;
            }
            return normalizeAngle(normalizedAngle + safeDistance * direction);
        }
    }
    return normalizedAngle;
}

// Packs the visible lower arcs of true concentric circles without hiding project buttons.
export function narrowProjectLayout(count: number, width: number, circleSize: number, preferredSize: number, ringGap: number) {
    const center = { x: width / 2, y: circleSize / 2 };
    const allRadii = Array.from({ length: 3 }, (_, index) => circleSize / 2 + ringGap + index * (preferredSize + 40));
    const capacityFor = (size: number) => allRadii.map(radius => ringCapacity(radius, width, size));
    let planetSize = preferredSize;
    let capacities = capacityFor(planetSize);
    if (capacities.reduce((sum, capacity) => sum + capacity, 0) < count) {
        let lower = 0;
        let upper = preferredSize;
        // Keep the largest size that fits all projects after the third ring is occupied.
        for (let pass = 0; pass < 40; pass++) {
            const candidate = (lower + upper) / 2;
            if (capacityFor(candidate).reduce((sum, capacity) => sum + capacity, 0) >= count) lower = candidate;
            else upper = candidate;
        }
        planetSize = lower;
        capacities = capacityFor(planetSize);
    }
    const planets: ProjectPlanet[] = [];
    const radii: number[] = [];
    for (const [ringIndex, radius] of allRadii.entries()) {
        const ringCount = Math.min(count - planets.length, capacities[ringIndex]);
        if (ringCount <= 0) break;
        radii.push(radius);
        // Match the capacity calculation's domain clamp during transient resize measurements.
        const step = 2 * Math.asin(Math.min(1, planetSize * thumbnailSpacingRatio / (2 * radius)));
        for (let index = 0; index < ringCount; index++) {
            const angle = (index - (ringCount - 1) / 2) * step;
            planets.push({ x: center.x + Math.sin(angle) * radius, y: center.y + Math.cos(angle) * radius, ringIndex });
        }
    }
    return {
        center, radii, planets, planetSize, capacities,
        height: radii.length ? center.y + radii[radii.length - 1] + planetSize * 0.6 + 2 : circleSize,
    };
}

// Limit the lower arc by the horizontal viewport and reserve room for the selection outline.
function ringCapacity(radius: number, width: number, size: number) {
    const halfSpan = Math.asin(Math.min(1, Math.max(0, width / 2 - size * 0.6 - 2) / radius));
    const step = 2 * Math.asin(Math.min(1, size * thumbnailSpacingRatio / (2 * radius)));
    return Math.max(1, Math.floor(2 * Math.min(Math.PI / 3, halfSpan) / step) + 1);
}

// Wraps angles while the outward search crosses zero degrees.
function normalizeAngle(angle: number) {
    return (angle % 360 + 360) % 360;
}
