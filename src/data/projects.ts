// Stores verified project copy and editable case-study fields, with unknown facts left empty.
export type ProjectCaseStudy = {
    overview: string;
    problem: string;
    role: string;
    approach: string[];
    implementation: string[];
    results: string[];
    technologies: string[];
    screenshots: { src: string; alt: string; caption: string }[];
    links: { label: string; href: string }[];
};

export type Project = {
    id: string;
    name: string;
    summary: string;
    href: string;
    caseStudy: ProjectCaseStudy;
};

export const projects: Project[] = [
    {
        id: "modulo",
        name: "Modulo",
        summary: "A cross-platform academic companion for students in Singapore, combining timetable parsing, task management, Google Drive sync, and gamified study sessions.",
        href: "/projects/modulo/",
        caseStudy: {
            overview: "Modulo is a cross-platform academic companion for students in Singapore. It brings timetable parsing, task management, Google Drive sync, and gamified study sessions together in one app.",
            // Fill these fields with your role, decisions, and measured outcomes. Empty sections stay hidden.
            problem: "",
            role: "",
            approach: [],
            implementation: [],
            results: [],
            technologies: [],
            screenshots: [],
            links: [],
        },
    },
    {
        id: "pneurelief",
        name: "PneuRelief",
        summary: "A smart under-cast sock and alternating bubble patch that detect and prevent pressure ulcers before they become dangerous, while providing control via an app",
        href: "/projects/pneurelief/",
        caseStudy: {
            overview: "PneuRelief combines a smart under-cast sock with an alternating bubble patch to detect and prevent pressure ulcers. An app provides control of the system.",
            problem: "",
            role: "",
            approach: [],
            implementation: [],
            results: [],
            technologies: [],
            screenshots: [],
            links: [],
        },
    }
];

// Returns the project with the requested ID or reports missing content.
export function projectById(id: string) {
    const project = projects.find((candidate) => candidate.id === id);
    if (!project) throw new Error(`Project data was not found for ${id}.`);
    return project;
}
