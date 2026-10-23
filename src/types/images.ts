import type { CSSProperties } from "react";

// Describes optional image lighting without exposing the publishing scene.
export type ImageRim = { colour: string; bloomColour: string };

// Defines the shared image data passed into the persistent main circle.
export type ImageDescriptor = {
    src: string;
    alt: string;
    objectPosition?: CSSProperties["objectPosition"];
    transform?: CSSProperties["transform"];
    presentation?: { rim?: ImageRim };
};

export type MainCircleImagePublisher = (image: ImageDescriptor | null) => void;
