import type { MainCircleEndpoint } from "../../types/mainCircle";

export const MAIN_CIRCLE_TRAVEL_DURATION_MS = 1000;

// Converts a viewport endpoint into stable content coordinates for native scrolling.
export function mainCircleInScrollContent(endpoint: MainCircleEndpoint, frame: {
    top: number; left: number; scrollTop: number; scrollLeft: number;
}): MainCircleEndpoint {
    return {
        width: endpoint.width,
        top: endpoint.top - frame.top + frame.scrollTop,
        left: endpoint.left - frame.left + frame.scrollLeft,
    };
}

// Interpolates direct circle geometry and shared eased progress at one elapsed time.
export function mainCircleTravelAtTime(
    from: MainCircleEndpoint,
    to: MainCircleEndpoint,
    elapsedMs: number,
    ease: (progress: number) => number = linearEase,
) {
    const normalizedProgress = clamp(elapsedMs / MAIN_CIRCLE_TRAVEL_DURATION_MS, 0, 1);
    const easedProgress = clamp(ease(normalizedProgress), 0, 1);
    return {
        endpoint: {
            width: interpolateNumber(from.width, to.width, easedProgress),
            top: interpolateNumber(from.top, to.top, easedProgress),
            left: interpolateNumber(from.left, to.left, easedProgress),
        },
        easedProgress,
    };
}

// Leaves interpolation linear unless the controller supplies its travel easing.
function linearEase(progress: number) { return progress; }
// Blends one dimension between the two measured endpoints.
function interpolateNumber(from: number, to: number, progress: number) { return from + (to - from) * progress; }
// Keeps elapsed time and easing inside the direct travel interval.
function clamp(value: number, minimum: number, maximum: number) { return Math.min(Math.max(value, minimum), maximum); }
