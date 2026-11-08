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
            problem: "Students juggle tasks, timetables, notes, and reminders across separate apps, and things slip through the gaps. Every switch between tools adds friction, and a missed deadline or lecture is easy to cause.",
            role: "Built the app version and design the workflow and architecture.",
            approach: [
                "One app covering tasks, timetables, notes, and reminders",
                "Mobile and web versions kept consistent through Material Design",
                "Built around 6 user stories",
            ],
            implementation: [
                "Android app with Jetpack Compose and Kotlin in Android Studio",
                "Web app with Vite and React",
                "Tested at four levels: 72 unit, 66 system, 33 integration, and 9 user tests",
            ],
            results: [],
            technologies: ["Kotlin", "Jetpack Compose", "React", "Vite", "Material Design"],
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
            problem: "Patients in casts, especially elderly patients, are at risk of developing pressure sores. Pressure can build up under a cast with no visible sign, and damage to the skin can start before anyone notices. Elderly patients may have reduced sensation or struggle to report discomfort, and caretakers have no way to check what's happening under the cast.",
            role: "UI/UX designer for the companion app.",
            approach: [
                "Pressure sensors inside the cast detect when pressure gets too high",
                "Pneumatic balloons relieve the pressure automatically",
                "A companion app lets patients and caretakers control the balloons, get notifications, and download pressure data",
                "Interface designed to be easy to use for elderly patients and caretakers",
            ],
            implementation: [
                "Designed the companion app's UI/UX around the needs of elderly patients and their caretakers",
                "App built in React and deployed to iOS and Android with Electron, backed by Supabase and FastAPI",
                "Connects to the electrical team's hardware over Bluetooth, with a Bluetooth simulator used for data during development",
            ],
            results: [],
            technologies: ["React", "Electron", "Supabase", "FastAPI", "Bluetooth"],
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
