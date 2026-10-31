export type ContactOffset = readonly [number, number];

// Spaces equal-size profile balls across the full row, with half-sized outer gaps like space-around.
export function contactRowOffset(index: number, count: number, orbitSize: number, diameter: number, rowWidth: number, clearance: number): ContactOffset {
    return [(index - (count - 1) / 2) * rowWidth / count, orbitSize / 2 + clearance + diameter / 2];
}

// Keeps desktop balls at their original scale while the main form grows independently.
export function contactProfileDiameter(diameterRatio: number, viewportWidth: number, viewportHeight: number) {
    const baseSize = Math.min(viewportWidth, viewportHeight) * 0.56;
    return diameterRatio * baseSize;
}

// Calculates a Contact profile's final offset from the orbit center.
export function contactFinalOffset(offset: ContactOffset, orbitSize: number, axis: 0 | 1) {
    return offset[axis] * orbitSize;
}

// Keeps each complete profile within the viewport without reserving an edge gap.
export function contactFittedFinalOffset(
    offset: ContactOffset,
    diameterRatio: number,
    orbitSize: number,
    viewportWidth: number,
    viewportHeight: number,
    axis: 0 | 1,
) {
    const requestedOffset = contactFinalOffset(offset, orbitSize, axis);
    const viewportSize = axis === 0 ? viewportWidth : viewportHeight;
    const availableOffset = Math.max(0, viewportSize / 2 - diameterRatio * orbitSize / 2);
    return Math.min(Math.max(requestedOffset, -availableOffset), availableOffset);
}

// Places a profile circle inside the main circle along its movement direction.
export function contactInitialOffset(
    offset: ContactOffset,
    diameterRatio: number,
    orbitSize: number,
    axis: 0 | 1,
) {
    const directionLength = Math.hypot(...offset) || 1;
    const insetRadius = 0.5 - diameterRatio / 2 - 0.02;
    return offset[axis] / directionLength * insetRadius * orbitSize;
}
