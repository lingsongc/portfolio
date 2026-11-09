import { deformTearPoint, type GridTear } from "./backgroundGridTearGeometry";

// Builds sampled grid paths while keeping circle lensing separate from the directional tear.
export type GridCircle = { x: number; y: number; radius: number };
const SAMPLE_STEP = 24;
const WARP_FALLOFF = 200;
const WARP_STRENGTH = 52;

// Builds fixed grid anchors, splitting only lines crossed by the active tear.
export function createWarpedGridPaths(
    width: number, height: number, circle: GridCircle | null, spacing = 48, tear: GridTear | null = null,
) {
    const paths: string[] = [];
    // Translate all vertical anchors equally so one always lands exactly at the tear origin.
    const firstX = (width / 2) % spacing - spacing;
    for (let x = firstX; x <= width + spacing; x += spacing) {
        paths.push(createLinePath(x, height, true, circle, tear));
    }
    for (let y = -spacing; y <= height + spacing; y += spacing) {
        paths.push(createLinePath(y, width, false, circle, tear));
    }
    return paths;
}

// Applies only the persistent circle's radial lensing to one point.
export function warpGridPoint(x: number, y: number, circle: GridCircle | null): [number, number] {
    const [dx, dy] = circleWarpDisplacement(x, y, circle);
    return [x + dx, y + dy];
}

// Traces the two deformed lips for a transient opacity boost, without any filled reveal.
export function createTearEdgePath(tear: GridTear, circle: GridCircle | null) {
    if (tear.span <= 0) return "";
    const start = Math.max(0, tear.height - tear.span);
    const steps = Math.max(1, Math.ceil((tear.height - start) / SAMPLE_STEP));
    const points: string[] = [];
    for (const side of [-1, 1] as const) {
        for (let index = 0; index <= steps; index++) {
            const sourceY = start + (tear.height - start) * index / steps;
            const y = tear.direction === 1 ? sourceY : tear.height - sourceY;
            const point = deformTearPoint(tear.width / 2, y, side, tear);
            points.push(pathPoint(warpGridPoint(...point, circle), index === 0));
        }
    }
    return points.join(" ");
}

// Pushes one grid point away from the circle with a smooth distance falloff.
function circleWarpDisplacement(x: number, y: number, circle: GridCircle | null) {
    if (!circle) return [0, 0];

    const offsetX = x - circle.x;
    const offsetY = y - circle.y;
    const distance = Math.hypot(offsetX, offsetY);
    const influence = Math.min(1, Math.max(0, 1 - (distance - circle.radius) / WARP_FALLOFF));

    if (influence === 0 || distance === 0) return [0, 0];

    const displacement = WARP_STRENGTH * influence * influence;
    return [
        (offsetX / distance) * displacement,
        (offsetY / distance) * displacement,
    ];
}

// Samples one line and inserts independent left/right endpoints where it crosses the tear.
function createLinePath(
    position: number, length: number, vertical: boolean, circle: GridCircle | null, tear: GridTear | null,
) {
    const points: string[] = [];
    const centerX = tear ? tear.width / 2 : 0;
    // Deform first, then apply the same circle lensing used by the resting and fresh grids.
    const append = (x: number, y: number, side: -1 | 1, move = false) => {
        const point: [number, number] = tear ? deformTearPoint(x, y, side, tear) : [x, y];
        points.push(pathPoint(warpGridPoint(...point, circle), move || points.length === 0));
    };
    const samples: number[] = [];
    for (let offset = -SAMPLE_STEP; offset <= length + SAMPLE_STEP; offset += SAMPLE_STEP) {
        // Sample the bottom boundary explicitly before reconnecting to untouched overscan points.
        if (vertical && offset > length && offset - SAMPLE_STEP < length) samples.push(length);
        samples.push(offset);
    }
    for (const offset of samples) {
        if (!vertical && tear && tearReachesY(position, tear)
            && offset >= centerX && offset - SAMPLE_STEP < centerX) {
            append(centerX, position, -1);
            append(centerX, position, 1, true);
            if (offset === centerX) continue;
        }
        const x = vertical ? position : offset;
        append(x, vertical ? offset : position, x <= centerX ? -1 : 1);
    }
    // A center grid line is drawn once at rest; its other half exists only behind the tip.
    if (vertical && tear && position === centerX) {
        let started = false;
        for (const y of samples) {
            if (!tearReachesY(y, tear)) continue;
            append(position, y, 1, !started);
            started = true;
        }
    }
    return points.join(" ");
}

// Tests whether the tip has crossed a row in the requested navigation direction.
function tearReachesY(y: number, tear: GridTear) {
    return tear.span > 0 && (tear.direction === 1 ? tear.height - y : y) < tear.span;
}

// Serializes a point without adding redundant SVG precision.
function pathPoint([x, y]: [number, number], move: boolean) {
    return `${move ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
}
