import { useLayoutEffect, useRef, useState, type RefObject } from "react";
import type { Project } from "../../data/projects";
import {
    fitProjectAngleToViewport,
    narrowProjectLayout,
    projectOrbitAngle,
    type ProjectPlanetStyle,
} from "./projectGeometry";

const PROJECT_RING_COUNT = 3;

export type ProjectOrbitTransitionState = "idle" | "visible" | "exiting";

type WideProjectOrbitProps = {
    activeProjectId: string;
    projects: readonly Project[];
    transitionState: ProjectOrbitTransitionState;
    onProjectSelect: (project: Project) => void;
};

type NarrowProjectOrbitProps = {
    circleAnchorRef: RefObject<HTMLDivElement | null>;
    projects: readonly Project[];
    activeProjectId: string;
    interactive: boolean;
    onProjectSelect: (project: Project) => void;
};

type ProjectOrbitProps =
    | (WideProjectOrbitProps & { narrowLayout?: false })
    | (NarrowProjectOrbitProps & { narrowLayout: true });

// Selects the wide or narrow ring composition while keeping layout-specific measurements local.
export function ProjectOrbit(props: ProjectOrbitProps) {
    return props.narrowLayout ? <NarrowProjectOrbit {...props} /> : <WideProjectOrbit {...props} />;
}

// Renders project controls across three rings and keeps them inside the viewport.
function WideProjectOrbit({
    activeProjectId,
    projects,
    transitionState,
    onProjectSelect,
}: WideProjectOrbitProps) {
    const orbitRef = useRef<HTMLDivElement>(null);
    const ringRefs = useRef<Array<HTMLSpanElement | null>>([]);
    const planetRefs = useRef<Array<HTMLLIElement | null>>([]);
    const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

    useLayoutEffect(() => {
        const orbit = orbitRef.current;
        if (!orbit) return;

        // Recalculates safe planet angles after the orbit changes size.
        const positionPlanets = () => {
            projects.forEach((project, index) => {
                const ringIndex = index % PROJECT_RING_COUNT;
                const ring = ringRefs.current[ringIndex];
                const planet = planetRefs.current[index];
                const button = buttonRefs.current[index];
                if (!ring || !planet || !button) return;

                const angle = fitProjectAngleToViewport(
                    projectOrbitAngle(project.id, index, projects.length),
                    ring.offsetWidth / 2,
                    button.offsetWidth / 2,
                    orbit.offsetWidth,
                    window.innerHeight,
                );
                planet.style.setProperty("--project-angle", `${angle}deg`);
                planet.style.setProperty("--project-angle-inverse", `${-angle}deg`);
            });
        };

        const resizeObserver = new ResizeObserver(positionPlanets);
        resizeObserver.observe(orbit);
        positionPlanets();
        return () => resizeObserver.disconnect();
    }, [projects]);

    return (
        <div
            ref={orbitRef}
            className={`project-orbit${transitionState === "idle" ? "" : ` project-content-${transitionState}`}`}
        >
            <div aria-hidden="true">
                {Array.from({ length: PROJECT_RING_COUNT }, (_, index) => (
                    <span
                        ref={(element) => { ringRefs.current[index] = element; }}
                        className="project-ring"
                        data-ring-index={index + 1}
                        key={index}
                    />
                ))}
            </div>
            <ul className="project-list">
                {projects.map((project, index) => {
                    const ringIndex = index % PROJECT_RING_COUNT;
                    const angle = projectOrbitAngle(project.id, index, projects.length);
                    const style: ProjectPlanetStyle = {
                        "--project-angle": `${angle}deg`,
                        "--project-angle-inverse": `${-angle}deg`,
                    };

                    return (
                        <li
                            ref={(element) => { planetRefs.current[index] = element; }}
                            className="project-item"
                            data-ring-index={ringIndex + 1}
                            key={project.id}
                            style={style}
                        >
                            <button
                                ref={(element) => { buttonRefs.current[index] = element; }}
                                className="project-link"
                                type="button"
                                aria-pressed={activeProjectId === project.id}
                                onClick={() => onProjectSelect(project)}
                            >
                                <img className="project-image" src={`/projects/${project.id}.png`} alt="" />
                                <h3 className="visually-hidden">{project.name}</h3>
                                <p className="visually-hidden">{project.summary}</p>
                            </button>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

// Measures the main-image anchor and places a complete selector around that exact center.
function NarrowProjectOrbit({ circleAnchorRef, projects, activeProjectId, interactive, onProjectSelect }: NarrowProjectOrbitProps) {
    const compositionRef = useRef<HTMLDivElement>(null);
    const sizingRef = useRef<HTMLDivElement>(null);
    const [layout, setLayout] = useState<ReturnType<typeof narrowProjectLayout> | null>(null);

    useLayoutEffect(() => {
        const composition = compositionRef.current;
        const anchor = circleAnchorRef.current;
        const sizing = sizingRef.current;
        if (!composition || !anchor || !sizing) return;
        const measure = () => {
            const size = sizing.getBoundingClientRect();
            const next = narrowProjectLayout(projects.length, composition.getBoundingClientRect().width,
                anchor.getBoundingClientRect().width, size.width, size.height);
            setLayout(current => JSON.stringify(current) === JSON.stringify(next) ? current : next);
        };
        const observer = new ResizeObserver(measure);
        observer.observe(composition);
        observer.observe(anchor);
        observer.observe(sizing);
        measure();
        return () => observer.disconnect();
    }, [circleAnchorRef, projects.length]);

    return (
        <div className="project-composition" ref={compositionRef} style={{ height: layout?.height }}>
            <div ref={circleAnchorRef} className="project-circle-anchor" aria-hidden="true" />
            <div className="project-selector-sizing" ref={sizingRef} aria-hidden="true" />
            {layout && <div className="project-selector" role="group" aria-label="Project selection"
                style={{ transformOrigin: `${layout.center.x}px ${layout.center.y}px` }}>
                <svg aria-hidden="true">
                    {layout.radii.map(radius => <circle key={radius} cx={layout.center.x} cy={layout.center.y} r={radius} />)}
                </svg>
                {projects.map((project, index) => {
                    const planet = layout.planets[index];
                    return <button className="project-link" key={project.id} type="button"
                        style={{ left: planet.x, top: planet.y, width: layout.planetSize,
                            outlineWidth: Math.min(3, layout.planetSize / 20), outlineOffset: Math.min(3, layout.planetSize / 20) }}
                        aria-label={project.name} aria-pressed={project.id === activeProjectId}
                        disabled={!interactive} onClick={() => onProjectSelect(project)}>
                        <img className="project-image" src={`/projects/${project.id}.png`} alt="" />
                    </button>;
                })}
            </div>}
        </div>
    );
}
