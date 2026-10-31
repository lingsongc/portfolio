import type { ImageShade } from "../../types/images";

type CircleShadeProps = { variant?: ImageShade; opacity?: number };

// Close shadows outside the image bounds so only the shared mask draws the circle edge.
// Default shading keeps its original interior curves.
const shadeBands = [
    { path: "M 60 1.0102 C 78 4 86 24 78.5 46 C 72 64 55 78 34 79 C 15 80 1 68 0 50 L -10 50 L -10 110 L 110 110 L 110 -10 L 60 -10 Z", opacity: 0.36 },
    { path: "M 70 4.1742 C 88 13 98 31 95 50 C 94 73 78 91 56 95 C 39 99 25 95 14 84.6987 L 14 110 L 110 110 L 110 -10 L 70 -10 Z", opacity: 0.36 },
];

// About shading.
const horizonBands = [
    { path: "M 50 0 A 22 50 0 0 1 50 100 L 50 110 L -10 110 L -10 -10 L 50 -10 Z", opacity: 0.48 },
];

// A shallow bowl follows the lower circular edge while keeping the center of the photo lit.
const bottomHorizonBands = [
    { path: "M -10 67.5 Q 50 120.5 110 67.5 L 110 110 L -10 110 Z", opacity: 0.48 },
];

// Project shading.
const capBands = [
    { path: "M 6.699 25 C 6.699 54 93.301 54 93.301 25 L 110 25 L 110 110 L -10 110 L -10 25 Z", opacity: 0.8 },
];

const bandsByVariant = { sphere: shadeBands, horizon: horizonBands, "horizon-bottom": bottomHorizonBands, cap: capBands };

// Renders flat image shadows inside the fading image layer.
export function CircleShade({ variant = "sphere", opacity: opacityOverride }: CircleShadeProps) {
    const bands = bandsByVariant[variant];
    return (
        <svg className="main-circle-shade" viewBox="0 0 100 100" aria-hidden="true">
            {bands.map(({ path, opacity }) => (
                <path d={path} fill="var(--colour-background)" fillRule="evenodd" opacity={opacityOverride ?? opacity} key={path} />
            ))}
        </svg>
    );
}
