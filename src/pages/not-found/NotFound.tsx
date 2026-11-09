import { useLayoutEffect, useRef, useState } from "react";
import { IconArrowUpRight } from "@tabler/icons-react";
import { BackgroundGrid } from "../../components/background-grid/BackgroundGrid";
import type { MainCircleEndpoint } from "../../types/mainCircle";

// Owns the standalone 404 composition, its layered circle, and a direct route back Home.
export function NotFound() {
    const circleRef = useRef<HTMLSpanElement>(null);
    const [circleGeometry, setCircleGeometry] = useState<MainCircleEndpoint | null>(null);

    // Supply the decorative grid with the circle's real position after fonts and layout settle.
    useLayoutEffect(() => {
        const circle = circleRef.current;
        if (!circle) return;
        // Keep the grid's viewport-space lens aligned with the page-owned circle.
        const measure = () => {
            const bounds = circle.getBoundingClientRect();
            setCircleGeometry({ width: bounds.width, left: bounds.left + bounds.width / 2, top: bounds.top + bounds.height / 2 });
        };
        const observer = new ResizeObserver(measure);
        observer.observe(circle);
        window.addEventListener("resize", measure);
        window.addEventListener("scroll", measure, { passive: true });
        document.fonts.addEventListener("loadingdone", measure);
        measure();
        return () => {
            observer.disconnect();
            window.removeEventListener("resize", measure);
            window.removeEventListener("scroll", measure);
            document.fonts.removeEventListener("loadingdone", measure);
        };
    }, []);

    return (
        <>
            <BackgroundGrid circleGeometry={circleGeometry} />
            <a className="home-button" href="/#home" aria-label="Home">
                <img src="/shared/logo.svg" alt="" />
            </a>
            <main className="not-found-page">
                <h1 className="not-found-code" aria-label="404, page not found">
                    <span className="not-found-first" aria-hidden="true">4</span>
                    <span className="not-found-circle" ref={circleRef} aria-hidden="true" />
                    <span className="not-found-last" aria-hidden="true">4</span>
                </h1>
                <p className="not-found-message">This page seems to have drifted out of orbit.</p>
                <a className="action-button action-button-pill not-found-home" href="/#home">
                    Back to Home
                    <IconArrowUpRight aria-hidden="true" />
                </a>
            </main>
        </>
    );
}
