import { useId } from "react";

type CircleLightingProps = { subtle?: boolean };

// Gives circular images a soft lower-right crescent using one blurred flat shape.
export function CircleLighting({ subtle = false }: CircleLightingProps) {
    const filterId = useId();
    return (
        <svg className={`circle-lighting${subtle ? " circle-lighting-subtle" : ""}`} viewBox="0 0 100 100" aria-hidden="true">
            <defs>
                <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="5" />
                </filter>
            </defs>
            <path
                d="M 76 2 C 66 16 90 31 76 56 C 64 80 42 88 23 94 C 52 117 112 91 108 48 C 105 24 91 9 76 2 Z"
                fill="#09050d"
                filter={`url(#${filterId})`}
            />
        </svg>
    );
}
