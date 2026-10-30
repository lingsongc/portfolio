import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { ScenePanelOverlay } from "../../components/scene-panel/ScenePanel";
import { IconArrowUpRight } from "@tabler/icons-react";
import { projects, type Project } from "../../data/projects";
import type { ImageDescriptor, MainCircleImagePublisher } from "../../types/images";
import type { SceneLifecycleControl } from "../../types/scene";
import { ProjectOrbit, type ProjectOrbitTransitionState } from "./ProjectOrbit";

type ProjectsProps = {
    circleAnchorRef: RefObject<HTMLDivElement | null>;
    narrowLayout: boolean;
    lifecycle: SceneLifecycleControl;
    onMainCircleImageChange: MainCircleImagePublisher;
};

// Coordinates project selection, orbit visibility, and the main-circle image.
export function Projects({ circleAnchorRef, narrowLayout, lifecycle, onMainCircleImageChange }: ProjectsProps) {
    const [summaryContainer, setSummaryContainer] = useState<HTMLDivElement | null>(null);
    const summaryTextRef = useRef<HTMLParagraphElement>(null);
    const [activeProjectId, setActiveProjectId] = useState(projects[0].id);
    const activeProject = projects.find(({ id }) => id === activeProjectId) ?? projects[0];
    const transitionState: ProjectOrbitTransitionState = lifecycle.active === true
        && (lifecycle.phase === "opening" || lifecycle.phase === "idle")
        ? "visible"
        : lifecycle?.active === true && lifecycle.phase === "closing"
            ? "exiting"
            : "idle";
    useEffect(() => {
        onMainCircleImageChange(projectImage(activeProject));
    }, [activeProject, onMainCircleImageChange]);

    // The overlay host mounts after the section, so wait for its actual DOM node.
    useLayoutEffect(() => {
        const container = summaryContainer;
        const paragraph = summaryTextRef.current;
        if (!container || !paragraph) return;
        let lastLayout = "";
        let frame = 0;
        const centerText = () => {
            const containerStyle = getComputedStyle(container);
            const textStyle = getComputedStyle(paragraph);
            // Ignore the paragraph height changed by our own padding search.
            const layout = [container.clientWidth, container.clientHeight, containerStyle.padding,
                textStyle.font, textStyle.lineHeight, textStyle.letterSpacing].join(":");
            if (layout === lastLayout) return;
            lastLayout = layout;
            centerProjectSummary(container, paragraph);
        };
        const schedule = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(centerText);
        };
        const fontsChanged = () => { lastLayout = ""; schedule(); };
        const observer = new ResizeObserver(schedule);
        observer.observe(container);
        observer.observe(paragraph);
        // Font metrics can change without changing the computed font declaration.
        document.fonts.addEventListener("loadingdone", fontsChanged);
        centerText();
        return () => {
            observer.disconnect();
            cancelAnimationFrame(frame);
            document.fonts.removeEventListener("loadingdone", fontsChanged);
        };
    }, [activeProject.summary, summaryContainer]);

    // Selects a project and updates the image when the section is visible.
    const selectProject = (project: Project) => {
        setActiveProjectId(project.id);
    };

    return (
        <section
            className={`project-container${transitionState === "visible" ? " project-copy-visible" : ""}`}
            aria-labelledby="project-title"
        >
            <h2 id="project-title" className="project-title" tabIndex={-1}>Projects</h2>
            {narrowLayout ? (
                <>
                    <div ref={circleAnchorRef} className="project-circle-anchor" aria-hidden="true" />
                    <div className="project-selector" role="group" aria-label="Project selection">
                        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                            <path d="M 0 15 Q 50 115 100 15" />
                        </svg>
                        {projects.map((project, index) => {
                            const position = (index + 1) / (projects.length + 1);
                            return (
                                <button
                                    className="project-link"
                                    style={{ left: `${position * 100}%`, top: `${15 + 200 * position * (1 - position)}%` }}
                                    key={project.id}
                                    type="button"
                                    aria-label={project.name}
                                    aria-pressed={project.id === activeProjectId}
                                    disabled={lifecycle.phase !== "idle"}
                                    onClick={() => selectProject(project)}
                                >
                                    <img className="project-image" src={`/projects/${project.id}.png`} alt="" />
                                </button>
                            );
                        })}
                    </div>
                    <div className="project-description" aria-live="polite">
                        <h3>{activeProject.name}</h3>
                        <p>{activeProject.summary}</p>
                    </div>
                </>
            ) : <ProjectOrbit
                activeProjectId={activeProjectId}
                projects={projects}
                transitionState={transitionState}
                onProjectSelect={selectProject}
            />}
            {!narrowLayout && <ScenePanelOverlay>
                <div
                    className={`project-selected-content${transitionState === "idle" ? "" : ` project-selected-content-${transitionState}`}`}
                    aria-live="polite"
                >
                    <div className="project-selected-summary" ref={setSummaryContainer}>
                        <span className="project-summary-edge project-summary-edge-left" aria-hidden="true" />
                        <span className="project-summary-edge project-summary-edge-right" aria-hidden="true" />
                        <p ref={summaryTextRef}>{activeProject.summary}</p>
                    </div>
                </div>
            </ScenePanelOverlay>}
            <a
                className="action-button project-detail-link"
                href={activeProject.href}
                aria-label={`View ${activeProject.name} project details`}
            >
                <span className="project-detail-label">View project</span>
                <IconArrowUpRight aria-hidden="true" />
            </a>
        </section>
    );
}

// Reflows around the sloping edges while centering the final wrapped text vertically.
function centerProjectSummary(container: HTMLElement, paragraph: HTMLElement) {
    const style = getComputedStyle(container);
    const availableHeight = container.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
    let lower = 0;
    let upper = Math.max(0, availableHeight / 2);
    let bestOffset = 0;
    let bestError = Infinity;
    // Wrapping changes in whole lines, so search rather than oscillating between line counts.
    for (let pass = 0; pass < 10; pass++) {
        const offset = (lower + upper) / 2;
        container.style.setProperty("--project-summary-offset", `${offset}px`);
        const textHeight = paragraph.getBoundingClientRect().height - offset;
        const error = offset + textHeight / 2 - availableHeight / 2;
        if (Math.abs(error) < bestError) {
            bestError = Math.abs(error);
            bestOffset = offset;
        }
        if (Math.abs(error) < 0.5) break;
        if (error < 0) lower = offset;
        else upper = offset;
    }
    container.style.setProperty("--project-summary-offset", `${bestOffset}px`);
}

// Creates the image data published for a selected project.
function projectImage(project: Project): ImageDescriptor {
    return {
        src: `/projects/${project.id}.png`,
        alt: "",
        objectPosition: "center",
        presentation: { shade: "cap" },
    };
}
