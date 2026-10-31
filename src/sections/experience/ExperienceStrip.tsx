import { useLayoutEffect, useRef, type KeyboardEvent } from "react";
import type { ExperienceOrbitEntry } from "./ExperienceOrbit";
import { snappedEntryIndex } from "./experienceStripGeometry";
import { createExperienceWheelBoundaryState, updateExperienceWheelBoundary } from "./experienceOrbitInput";

type ExperienceStripProps = {
    activeEntryId: string;
    entries: readonly ExperienceOrbitEntry[];
    imagePath: (id: string) => string;
    interactive: boolean;
    label: string;
    onEntrySelect: (index: number) => void;
    reducedMotion: boolean;
};

// Snaps a horizontal thumbnail strip beside the main image and commits selection after settling.
export function ExperienceStrip({ activeEntryId, entries, imagePath, interactive, label, onEntrySelect, reducedMotion }: ExperienceStripProps) {
    const stripRef = useRef<HTMLDivElement>(null);
    const buttonsRef = useRef<(HTMLButtonElement | null)[]>([]);
    const latestRef = useRef({ interactive, onEntrySelect, reducedMotion });
    const selectedRef = useRef(activeEntryId);
    const scrollingRef = useRef(false);
    latestRef.current = { interactive, onEntrySelect, reducedMotion };
    selectedRef.current = activeEntryId;

    useLayoutEffect(() => {
        const strip = stripRef.current;
        if (!strip) return;
        let timer = 0;
        let targetIndex = 0;
        let wheelBoundary = createExperienceWheelBoundaryState();
        const step = () => (buttonsRef.current[1]?.offsetLeft ?? 0) - (buttonsRef.current[0]?.offsetLeft ?? 0);
        const alignSelection = () => {
            const index = Math.max(0, entries.findIndex(({ id }) => id === selectedRef.current));
            targetIndex = index;
            scrollingRef.current = false;
            strip.scrollTo({ left: index * step(), behavior: "instant" });
        };
        const settle = () => {
            window.clearTimeout(timer);
            if (!scrollingRef.current || !latestRef.current.interactive) return;
            scrollingRef.current = false;
            targetIndex = snappedEntryIndex(strip.scrollLeft, step(), entries.length);
            latestRef.current.onEntrySelect(targetIndex);
        };
        const scroll = () => {
            scrollingRef.current = true;
            window.clearTimeout(timer);
            timer = window.setTimeout(settle, 180);
        };
        // Reuse the desktop selector's boundary gate so momentum cannot escape into scene navigation.
        const handleWheel = (event: WheelEvent) => {
            if (!latestRef.current.interactive || event.ctrlKey || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
            const direction = event.deltaY < 0 ? -1 : 1;
            const atBoundary = direction < 0 ? targetIndex === 0 : targetIndex === entries.length - 1;
            const update = updateExperienceWheelBoundary(wheelBoundary, direction, atBoundary, performance.now());
            wheelBoundary = update.state;
            if (!update.consume) return;
            event.preventDefault();
            if (atBoundary) return;
            targetIndex += direction;
            strip.scrollTo({ left: targetIndex * step(), behavior: latestRef.current.reducedMotion ? "instant" : "smooth" });
        };
        const observer = new ResizeObserver(alignSelection);
        observer.observe(strip);
        strip.addEventListener("scroll", scroll, { passive: true });
        strip.addEventListener("scrollend", settle);
        strip.addEventListener("wheel", handleWheel, { passive: false });
        alignSelection();
        return () => {
            window.clearTimeout(timer);
            observer.disconnect();
            strip.removeEventListener("scroll", scroll);
            strip.removeEventListener("scrollend", settle);
            strip.removeEventListener("wheel", handleWheel);
        };
    }, [entries]);

    // Padding after the last item allows every entry to reach the same leading snap position.
    const select = (index: number) => {
        if (!interactive || !entries[index]) return;
        const strip = stripRef.current;
        const button = buttonsRef.current[index];
        if (!strip || !button) return;
        if (Math.abs(strip.scrollLeft - button.offsetLeft) < 1) onEntrySelect(index);
        else strip.scrollTo({ left: button.offsetLeft, behavior: reducedMotion ? "instant" : "smooth" });
    };

    const handleKeyDown = (event: KeyboardEvent, index: number) => {
        const next = event.key === "ArrowRight" ? index + 1 : event.key === "ArrowLeft" ? index - 1
            : event.key === "Home" ? 0 : event.key === "End" ? entries.length - 1 : null;
        if (next === null) return;
        event.preventDefault();
        if (!entries[next]) return;
        buttonsRef.current[next]?.focus({ preventScroll: true });
        select(next);
    };

    return (
        <div className="experience-strip-orbit">
            <div className="experience-strip" ref={stripRef} aria-label={`${label} entries`} role="group" inert={!interactive}>
                {entries.map((entry, index) => (
                    <button
                        ref={(element) => { buttonsRef.current[index] = element; }}
                        className="experience-strip-button"
                        type="button"
                        key={entry.id}
                        aria-label={entry.title}
                        aria-pressed={entry.id === activeEntryId}
                        onClick={() => select(index)}
                        onKeyDown={(event) => handleKeyDown(event, index)}
                    >
                        <img src={imagePath(entry.id)} alt="" />
                    </button>
                ))}
            </div>
        </div>
    );
}
