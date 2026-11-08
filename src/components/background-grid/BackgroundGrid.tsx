import { forwardRef, useCallback, useEffect, useId, useImperativeHandle, useLayoutEffect, useRef } from "react";
import type { MainCircleEndpoint } from "../../types/mainCircle";
import { createTearEdgePath, createWarpedGridPaths, type GridCircle } from "./backgroundGridGeometry";
import { createGridTear } from "./backgroundGridTearGeometry";

const GRID_SPACING = 48;
const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

type BackgroundGridProps = {
    circleGeometry?: MainCircleEndpoint | null;
    circleMaskId?: string;
    tearProgress?: number | null;
    tearDirection?: 1 | -1;
};

export type BackgroundGridHandle = {
    setScrollFeedback: (progress: number, durationMs: number) => void;
};

type FeedbackAnimation = { durationMs: number; from: number; startedAt: number; to: number };

// Renders circle lensing, partial wheel feedback, and the coordinator-driven tear on one grid.
export const BackgroundGrid = forwardRef<BackgroundGridHandle, BackgroundGridProps>(function BackgroundGrid(
    { circleGeometry = null, circleMaskId, tearProgress = null, tearDirection = 1 }, ref,
) {
    const linesRef = useRef<SVGGElement>(null);
    const freshLinesRef = useRef<SVGGElement>(null);
    const tearEdgeRef = useRef<SVGPathElement>(null);
    const fadeCircleRef = useRef<SVGCircleElement>(null);
    const feedbackAnimationRef = useRef<FeedbackAnimation | null>(null);
    const feedbackFrameRef = useRef(0);
    const feedbackProgressRef = useRef(0);
    const committedPreviewRef = useRef(0);
    const committedRef = useRef(false);
    const renderRef = useRef<(() => void) | null>(null);
    const freshGridRef = useRef<{ signature: string; paths: string[] } | null>(null);
    const filterId = useId();
    const generatedMaskId = useId();
    const maskId = circleMaskId ?? generatedMaskId;

    // Smooths discrete wheel targets only while idle; committed timing belongs to the coordinator.
    const animateScrollFeedback = useCallback((now: number) => {
        const animation = feedbackAnimationRef.current;
        if (!animation) return;
        const time = Math.min(1, (now - animation.startedAt) / animation.durationMs);
        feedbackProgressRef.current = animation.from + (animation.to - animation.from) * (1 - Math.pow(1 - time, 3));
        renderRef.current?.();
        if (time < 1) feedbackFrameRef.current = requestAnimationFrame(animateScrollFeedback);
        else feedbackAnimationRef.current = null;
    }, []);

    useImperativeHandle(ref, () => ({
        setScrollFeedback(progress, durationMs) {
            // Input cleanup must never reset a tear already owned by the coordinator.
            if (committedRef.current) return;
            const target = Math.min(1, Math.max(-1, progress));
            if (!feedbackAnimationRef.current && feedbackProgressRef.current === target) return;
            cancelAnimationFrame(feedbackFrameRef.current);
            if (durationMs <= 0) {
                feedbackAnimationRef.current = null;
                feedbackProgressRef.current = target;
                renderRef.current?.();
            } else {
                feedbackAnimationRef.current = {
                    durationMs, from: feedbackProgressRef.current, startedAt: performance.now(), to: target,
                };
                feedbackFrameRef.current = requestAnimationFrame(animateScrollFeedback);
            }
        },
    }), [animateScrollFeedback]);

    // Releases the temporary wheel animation when its owner unmounts.
    useEffect(() => () => cancelAnimationFrame(feedbackFrameRef.current), []);

    // Freeze the painted preview before input cleanup runs, then follow the coordinator across closing and movement.
    useLayoutEffect(() => {
        const committed = tearProgress !== null;
        if (committed !== committedRef.current) {
            cancelAnimationFrame(feedbackFrameRef.current);
            feedbackAnimationRef.current = null;
            if (committed) {
                const preview = feedbackProgressRef.current;
                committedPreviewRef.current = Math.sign(preview) === tearDirection ? preview : 0;
            } else feedbackProgressRef.current = 0;
            committedRef.current = committed;
        }
        const lines = linesRef.current;
        const freshLines = freshLinesRef.current;
        const edge = tearEdgeRef.current;
        const fadeCircle = fadeCircleRef.current;
        if (!lines || !freshLines || !edge || !fadeCircle) return;
        const circle: GridCircle | null = circleGeometry ? {
            x: circleGeometry.left, y: circleGeometry.top, radius: circleGeometry.width / 2,
        } : null;
        // Reuse the fresh grid throughout tearing, rewriting its paths only when geometry changes.
        const render = () => {
            if (document.hidden) return;
            const signature = `${innerWidth}:${innerHeight}:${circle?.x}:${circle?.y}:${circle?.radius}`;
            if (freshGridRef.current?.signature !== signature) {
                freshGridRef.current = { signature, paths: createWarpedGridPaths(innerWidth, innerHeight, circle, GRID_SPACING) };
            }
            const tear = createGridTear(innerWidth, innerHeight,
                committed ? committedPreviewRef.current : feedbackProgressRef.current,
                tearProgress, committed ? tearDirection : feedbackProgressRef.current < 0 ? -1 : 1);
            const freshPaths = freshGridRef.current.paths;
            syncPaths(lines, tear.span > 0 && tear.oldOpacity > 0
                ? createWarpedGridPaths(innerWidth, innerHeight, circle, GRID_SPACING, tear) : freshPaths);
            syncPaths(freshLines, freshPaths);
            lines.setAttribute("opacity", String(tear.oldOpacity));
            freshLines.setAttribute("opacity", String(tear.newOpacity));
            edge.setAttribute("d", tear.edgeOpacity > 0 ? createTearEdgePath(tear, circle) : "");
            edge.setAttribute("opacity", String(tear.edgeOpacity));
            fadeCircle.setAttribute("cx", String(circle?.x ?? 0));
            fadeCircle.setAttribute("cy", String(circle?.y ?? 0));
            fadeCircle.setAttribute("r", String(circle ? circle.radius + 24 : 0));
        };
        renderRef.current = render;
        render();
        window.addEventListener("resize", render);
        document.addEventListener("visibilitychange", render);
        return () => {
            window.removeEventListener("resize", render);
            document.removeEventListener("visibilitychange", render);
            if (renderRef.current === render) renderRef.current = null;
        };
    }, [circleGeometry, tearProgress, tearDirection]);

    return (
        <svg className="background-grid" aria-hidden="true">
            <defs>
                <filter id={filterId} x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="32" />
                </filter>
                <mask id={maskId} maskUnits="userSpaceOnUse">
                    <rect width="100%" height="100%" fill="white" />
                    <circle ref={fadeCircleRef} fill="black" filter={`url(#${filterId})`} />
                </mask>
            </defs>
            <g mask={`url(#${maskId})`}>
                <g ref={freshLinesRef} className="background-grid-lines" opacity="0" />
                <g ref={linesRef} className="background-grid-lines" />
                <path ref={tearEdgeRef} className="background-grid-tear-edge" opacity="0" />
            </g>
        </svg>
    );
});

// Reuses SVG nodes and skips unchanged path writes, including the static far field.
function syncPaths(group: SVGGElement, paths: string[]) {
    while (group.children.length < paths.length) group.append(document.createElementNS(SVG_NAMESPACE, "path"));
    while (group.children.length > paths.length) group.lastElementChild?.remove();
    paths.forEach((data, index) => {
        const path = group.children[index];
        if (path.getAttribute("d") !== data) path.setAttribute("d", data);
    });
}
