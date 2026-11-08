// Owns the shared arrow deformation for partial wheel intent and the committed tear.
export type GridTear = {
    width: number;
    height: number;
    direction: 1 | -1;
    span: number;
    progress: number;
    oldOpacity: number;
    newOpacity: number;
    edgeOpacity: number;
};

const PHYSICS_SPACING = 34;
const CRUMPLE_INTENSITY = 0.5;

// Continues from the rendered preview and advances the same arrow with quadratic ease-in.
export function createGridTear(
    width: number,
    height: number,
    preview: number,
    transitionProgress: number | null = null,
    direction: 1 | -1 = preview < 0 ? -1 : 1,
): GridTear {
    const intent = Math.min(1, Math.abs(preview));
    const previewSpan = height * 0.15 * (1 - Math.pow(1 - intent, 2));
    const travel = height + Math.cbrt((width / 2 + PHYSICS_SPACING * 4) * Math.sqrt(3) * height * height);
    const p = transitionProgress === null ? 0 : Math.pow(Math.min(1, Math.max(0, transitionProgress)), 2);
    const span = transitionProgress === null ? previewSpan
        : previewSpan + (travel - previewSpan) * Math.min(1, p / 0.88);
    // Noise uses distance travelled, so it cannot jump when a partial preview commits.
    const progress = travel > 0 ? span / travel * 0.88 : 0;
    // Fade from 360ms to about 582ms without extending the 600ms tear clock.
    const fade = Math.min(1, Math.max(0, (p - 0.36) / 0.58));
    const oldOpacity = p > 0.80 ? Math.max(0, 1 - (p - 0.80) / 0.16) : 1;
    return {
        width, height, direction, span, progress, oldOpacity,
        newOpacity: fade * fade * (3 - 2 * fade),
        edgeOpacity: Math.min(1, progress / 0.12) * oldOpacity * 0.85,
    };
}

// Splits points around a moving concave arrow, leaving the far field exactly stationary.
export function deformTearPoint(x: number, y: number, side: -1 | 1, tear: GridTear): [number, number] {
    const sourceY = tear.direction === 1 ? y : tear.height - y;
    const depth = sourceY - (tear.height - tear.span);
    // Overscan rows must not fold back into view as a partial tear approaches zero height.
    if (y < 0 || y > tear.height || tear.span <= 0 || depth <= 0 || tear.height <= 0) return [x, y];
    const curveHeight = Math.min(tear.height, tear.span);
    const radius = Math.pow(depth, 3) / (Math.sqrt(3) * curveHeight * curveHeight);
    const distance = Math.abs(x - tear.width / 2);
    const support = radius + PHYSICS_SPACING * 4;
    if (distance >= support) return [x, y];
    const local = distance / support;
    const influence = Math.pow(1 - local, 3);
    const opening = Math.min(1.2, radius / Math.max(1, tear.width / 2));
    const gamma = 1 + Math.min(1, opening * 1.4);
    const displaced = radius + (support - radius) * (0.16 * local + 0.84 * Math.pow(local, gamma));
    const envelope = Math.sin(Math.min(1, opening) * Math.PI * 0.88)
        * influence * CRUMPLE_INTENSITY * (1 + 3 * Math.pow(1 - local, 8));
    const col = distance / PHYSICS_SPACING * 1.45;
    const row = sourceY / PHYSICS_SPACING * 1.15;
    const p = tear.progress;
    const foldX = 19 * Math.sin(row * 0.85 + col * 1.35 - p * 10)
        + 12 * Math.cos(row * 1.75 - col * 2.1 + p * 14)
        + 7 * Math.sin(row * 2.9 + col * 2.8)
        + 12 * Math.sin(row * 4.2 + side * 2.1 - p * 26);
    const foldY = 16.5 * Math.cos(row * 0.95 + col * 1.6 - p * 9)
        + 11 * Math.sin(row * 1.9 - col * 2.3 + p * 12)
        + 9 * Math.cos(row * 3.6 - col * 2.7 + side - p * 23);
    // Keep edge rows pinned vertically, fading into ordinary folds within one physics cell.
    const edgeInfluence = Math.min(1, Math.min(y, tear.height - y) / PHYSICS_SPACING);
    return [tear.width / 2 + side * displaced + side * envelope * foldX,
        y + tear.direction * envelope * foldY * edgeInfluence];
}
