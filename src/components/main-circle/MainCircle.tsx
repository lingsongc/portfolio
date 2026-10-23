import { useLayoutEffect, useRef, useState } from "react";
import type { ImageDescriptor } from "../../types/images";
import type { MainCircleEndpoint } from "../../types/mainCircle";
import { CircleLighting } from "./CircleLighting";
import { CircleRim } from "./CircleRim";

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

    // A failed or late image leaves the already loaded moon visible underneath.
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
                <img className="main-circle-fallback" src="/shared/moon.jpg" alt="" fetchPriority="high" />
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
                    </div>
                )}
                <CircleLighting />
            </div>
            {image?.presentation?.rim && (
                <CircleRim rim={image.presentation.rim} visible={imageVisible && contentReady} />
            )}
        </div>
    );
}
