import { useLayoutEffect, useRef, useState } from "react";
import type { ImageDescriptor } from "../../types/images";
import type { MainCircleEndpoint } from "../../types/mainCircle";
import { CircleShade } from "./CirclePresentation";

type MainCircleProps = {
    geometry: MainCircleEndpoint | null;
    image: ImageDescriptor | null;
    imageVisible?: boolean;
};

// Displays the current image and moves its circular frame between sections.
export function MainCircle({
    geometry,
    image,
    imageVisible = true,
}: MainCircleProps) {
    const imageRef = useRef<HTMLImageElement>(null);
    const [readySource, setReadySource] = useState<string | null>(null);
    const contentReady = image !== null && readySource === image.src;

    // A failed or late image leaves the opaque void visible underneath.
    useLayoutEffect(() => {
        const element = imageRef.current;
        if (!element || !image) return;
        let cancelled = false;
        setReadySource(null);
        element.decode().then(() => {
            if (!cancelled) setReadySource(image.src);
        }).catch(() => {
            if (!cancelled) setReadySource(null);
        });
        return () => { cancelled = true; };
    }, [image?.src]);

    return (
        <div className="main-circle-container" style={geometry ?? undefined}>
            <div className="main-circle-mask">
                {image && (
                    <div className={`main-circle-image${imageVisible && contentReady ? " main-circle-image-visible" : ""}`}>
                        <img
                            ref={imageRef}
                            className="main-circle-photo"
                            src={image.src}
                            alt={image.alt}
                            onError={() => setReadySource(null)}
                            style={{
                                objectPosition: image.objectPosition,
                                transform: image.transform,
                            }}
                        />
                        <CircleShade variant={image.presentation?.shade} opacity={image.presentation?.shadeOpacity} />
                    </div>
                )}
            </div>
        </div>
    );
}
