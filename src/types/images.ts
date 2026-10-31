import type { CSSProperties } from "react";

// Selects an image's shadow geometry without exposing the publishing scene.
export type ImageShade = "sphere" | "horizon" | "horizon-bottom" | "cap";

// Defines the shared image data passed into the persistent main circle.
export type ImageDescriptor = {
    src: string;
    alt: string;
    objectPosition?: CSSProperties["objectPosition"];
    transform?: CSSProperties["transform"];
    presentation?: { shade?: ImageShade; shadeOpacity?: number };
};

export type MainCircleImagePublisher = (image: ImageDescriptor | null) => void;
