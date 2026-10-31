import { useLayoutEffect, useState } from "react";

// Reads the CSS-owned layout mode without duplicating its configurable breakpoint in JavaScript.
export function useNarrowLayout() {
    const [narrow, setNarrow] = useState(readNarrowLayout);
    useLayoutEffect(() => {
        const measure = () => setNarrow(readNarrowLayout());
        window.addEventListener("resize", measure);
        measure();
        return () => window.removeEventListener("resize", measure);
    }, []);
    return narrow;
}

// Uses the same media-query result as section sizing and circle endpoint measurements.
function readNarrowLayout() {
    return getComputedStyle(document.documentElement).getPropertyValue("--scene-layout-narrow").trim() === "1";
}
