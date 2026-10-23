import { useId } from "react";
import type { ImageRim } from "../../types/images";

type CircleRimProps = { rim: ImageRim; visible: boolean };

// Layers tapered flat arcs and blurred bloom outside an image's right circumference.
export function CircleRim({ rim, visible }: CircleRimProps) {
    const bloomId = useId();
    const softId = useId();
    return (
        <svg className={`main-circle-rim${visible ? " main-circle-rim-visible" : ""}`} viewBox="0 0 100 100" aria-hidden="true">
            <defs>
                <filter id={bloomId} x="-100%" y="-100%" width="300%" height="300%">
                    <feGaussianBlur stdDeviation="0.85" />
                </filter>
                <filter id={softId} x="-100%" y="-100%" width="300%" height="300%">
                    <feGaussianBlur stdDeviation="0.16" />
                </filter>
            </defs>
            <g fill="none" strokeLinecap="round">
                <path d="M 75 6.7 A 50 50 0 0 1 75 93.3" stroke={rim.bloomColour} strokeWidth="1.1" opacity="0.65" filter={`url(#${bloomId})`} />
                <g stroke={rim.colour} filter={`url(#${softId})`}>
                    <path d="M 75 6.7 A 50 50 0 0 1 75 93.3" strokeWidth="0.12" opacity="0.45" />
                    <path d="M 85.36 14.64 A 50 50 0 0 1 85.36 85.36" strokeWidth="0.2" opacity="0.7" />
                    <path d="M 95.32 28.87 A 50 50 0 0 1 95.32 71.13" strokeWidth="0.3" />
                </g>
            </g>
        </svg>
    );
}
