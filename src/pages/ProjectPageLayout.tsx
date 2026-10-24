import { IconArrowLeft } from "@tabler/icons-react";
import { BackgroundGrid } from "../components/background-grid/BackgroundGrid";
import type { Project } from "../data/projects";

type ProjectPageLayoutProps = {
    project: Project;
};

// Renders the shared reading layout used by every project detail page.
export function ProjectPageLayout({ project }: ProjectPageLayoutProps) {
    const study = project.caseStudy;
    const textSections = [
        { title: "Problem", text: study.problem },
        { title: "My role", text: study.role },
    ];
    const listSections = [
        { title: "Approach", items: study.approach },
        { title: "Implementation", items: study.implementation },
        { title: "Results", items: study.results },
        { title: "Technologies", items: study.technologies },
    ];
    return (
        <>
            <BackgroundGrid />
            <main className="project-detail-page">
                <a className="project-detail-back" href="../../#projects">
                    <IconArrowLeft aria-hidden="true" />
                    Back to projects
                </a>
                <article className="project-detail-content">
                    <img className="project-detail-image" src={`/projects/${project.id}.png`} alt="" />
                    <p className="project-detail-label">Project</p>
                    <h1>{project.name}</h1>
                    <p>{study.overview || project.summary}</p>
                    {textSections.filter(({ text }) => text.trim()).map(({ title, text }) => (
                        <section key={title}>
                            <h2>{title}</h2>
                            <p>{text}</p>
                        </section>
                    ))}
                    {listSections.filter(({ items }) => items.length).map(({ title, items }) => (
                        <section key={title}>
                            <h2>{title}</h2>
                            <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
                        </section>
                    ))}
                    {study.screenshots.length > 0 && (
                        <section>
                            <h2>Project images</h2>
                            {study.screenshots.map((screenshot) => (
                                <figure className="project-detail-figure" key={screenshot.src}>
                                    <img src={screenshot.src} alt={screenshot.alt} loading="lazy" />
                                    {screenshot.caption && <figcaption>{screenshot.caption}</figcaption>}
                                </figure>
                            ))}
                        </section>
                    )}
                    {study.links.length > 0 && (
                        <section>
                            <h2>Links</h2>
                            <ul>{study.links.map((link) => <li key={link.href}><a href={link.href}>{link.label}</a></li>)}</ul>
                        </section>
                    )}
                </article>
            </main>
        </>
    );
}
