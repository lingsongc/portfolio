import type { ImageShade } from "../../types/images";

type CircleShadeProps = { variant?: ImageShade };

// Offset circular cutouts match the reference's broad light face and two lower-right bands.
const shadeBands = [
    { path: "M 50 0 A 50 50 0 1 1 50 100 A 50 50 0 1 1 50 0 Z M 81 31 A 50 50 0 1 1 -19 31 A 50 50 0 1 1 81 31 Z", opacity: 0.28 },
    { path: "M 50 0 A 50 50 0 1 1 50 100 A 50 50 0 1 1 50 0 Z M 91.5 41.5 A 50 50 0 1 1 -8.5 41.5 A 50 50 0 1 1 91.5 41.5 Z", opacity: 0.28 },
];

// One restrained interior shadow leaves the exposed horizon edge unshaded.
const horizonBands = [
    { path: "M 50 0 A 22 50 0 0 1 50 100 A 50 50 0 0 1 50 0 Z", opacity: 0.25 },
];

// Renders flat spherical or horizon shadows inside the fading image layer.
export function CircleShade({ variant = "sphere" }: CircleShadeProps) {
    const bands = variant === "horizon" ? horizonBands : shadeBands;
    return (
        <svg className="main-circle-shade" viewBox="0 0 100 100" aria-hidden="true">
            {bands.map(({ path, opacity }) => (
                <path d={path} fill="black" fillRule="evenodd" opacity={opacity} key={path} />
            ))}
        </svg>
    );
}
