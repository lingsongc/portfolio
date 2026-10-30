export type ContactOffset = readonly [number, number];

// Centers equal-size profile balls in one row below the form using measured CSS spacing.
export function contactRowOffset(index: number, count: number, orbitSize: number, diameter: number, gap: number, clearance: number): ContactOffset {
    return [(index - (count - 1) / 2) * (diameter + gap), orbitSize / 2 + clearance + diameter / 2];
}

// Keeps desktop balls at their original scale while the main form grows independently.
export function contactProfileDiameter(diameterRatio: number, orbitSize: number, viewportWidth: number, viewportHeight: number, stacked: boolean) {
    const baseSize = stacked
        ? orbitSize
        : Math.min(viewportWidth, viewportHeight) * 0.56;
    return diameterRatio * baseSize;
}

// Calculates a Contact profile's final offset from the orbit center.
export function contactFinalOffset(offset: ContactOffset, orbitSize: number, axis: 0 | 1) {
    return offset[axis] * orbitSize;
}

// Fits a profile within viewport edges, including any reserved navigation space.
export function contactFittedFinalOffset(
    offset: ContactOffset,
    diameterRatio: number,
    orbitSize: number,
    viewportWidth: number,
    viewportHeight: number,
    axis: 0 | 1,
    edgeInset = 4,
) {
    const requestedOffset = contactFinalOffset(offset, orbitSize, axis);
    const viewportSize = axis === 0 ? viewportWidth : viewportHeight;
    const availableOffset = Math.max(0, viewportSize / 2 - diameterRatio * orbitSize / 2 - edgeInset);
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
