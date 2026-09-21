// Defines the categorized skills displayed in the Skills section.
export type Skill = {
    name: string;
    category: string;
    logoSrc?: string;
};

export const skills: Skill[] = [
    { name: "JavaScript", category: "Programming Languages", logoSrc: "/skills/logos/javascript.svg" },
    { name: "TypeScript", category: "Programming Languages", logoSrc: "/skills/logos/typescript.svg" },
    { name: "Java", category: "Programming Languages", logoSrc: "/skills/logos/java.svg" },
    { name: "C", category: "Programming Languages", logoSrc: "/skills/logos/c.svg" },
    { name: "C++", category: "Programming Languages", logoSrc: "/skills/logos/cpp.svg" },
    { name: "C#", category: "Programming Languages", logoSrc: "/skills/logos/c-sharp.svg" },
    { name: "Kotlin", category: "Programming Languages", logoSrc: "/skills/logos/kotlin.svg" },
    { name: "MATLAB", category: "Programming Languages", logoSrc: "/skills/logos/matlab.svg" },
    { name: "R", category: "Programming Languages", logoSrc: "/skills/logos/r.svg" },
    { name: "HTML", category: "Web Development", logoSrc: "/skills/logos/html.svg" },
    { name: "CSS", category: "Web Development", logoSrc: "/skills/logos/css.svg" },
    { name: "React", category: "Web Development", logoSrc: "/skills/logos/react.svg" },
    { name: "Jetpack Compose", category: "Application and Automation", logoSrc: "/skills/logos/jetpack-compose.svg" },
    { name: "Unity", category: "Application and Automation", logoSrc: "/skills/logos/unity.svg" },
    { name: "Google Apps Script", category: "Application and Automation", logoSrc: "/skills/logos/google-apps-script.svg" },
    { name: "Logo Design", category: "Design and Media" },
    { name: "Video Editing", category: "Design and Media", logoSrc: "/skills/logos/davinci-resolve.svg" },
];
