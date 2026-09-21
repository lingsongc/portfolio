import { IconVectorBezier } from "@tabler/icons-react";
import { useId, type CSSProperties } from "react";
import { skills } from "../../data/skills";
import type { MainCircleEndpoint } from "../../types/mainCircle";
import type { SceneLifecycleControl } from "../../types/scene";

type SkillsProps = {
    circleGeometry: MainCircleEndpoint | null;
    lifecycle: SceneLifecycleControl;
};

type SkillGroup = {
    category: string;
    skills: typeof skills;
};

type LogoTreatment = "alpha" | "dark-cutout" | "light-cutout";

const logoTreatments: Partial<Record<string, LogoTreatment>> = {
    "C": "light-cutout",
    "C#": "light-cutout",
    "C++": "light-cutout",
    "CSS": "light-cutout",
    "Video Editing": "light-cutout",
    "Google Apps Script": "light-cutout",
    "HTML": "light-cutout",
    "JavaScript": "dark-cutout",
    "TypeScript": "light-cutout",
};

const skillGroups = skills.reduce<SkillGroup[]>((groups, skill) => {
    let group = groups.find(({ category }) => category === skill.category);
    if (!group) {
        group = { category: skill.category, skills: [] };
        groups.push(group);
    }
    group.skills.push(skill);
    return groups;
}, []);

// Renders the accessible Skills content and its circle-aligned visual marquee.
export function Skills({ circleGeometry, lifecycle }: SkillsProps) {
    const contentVisible = lifecycle.active === true
        && (lifecycle.phase === "opening" || lifecycle.phase === "idle");
    const circleStyle = circleGeometry as CSSProperties | undefined;

    return (
        <section
            className={`skill-container${contentVisible ? " skill-content-visible" : ""}`}
            aria-labelledby="skill-title"
        >
            <div className="skill-introduction">
                <h2 id="skill-title" tabIndex={-1}>Skills</h2>
                <p className="skill-description">
                    I work across software development, interface design, and visual storytelling.
                </p>
                <ul className="skill-category-list" aria-label="Skill categories">
                    {skillGroups.map((group) => (
                        <li key={group.category}>{group.category}</li>
                    ))}
                </ul>
            </div>

            <div className="skill-circle" style={circleStyle}>
                <div className="skill-marquee-stack">
                    {skillGroups.map((group, groupIndex) => (
                        <SkillMarquee
                            direction={groupIndex % 2 === 0 ? "right" : "left"}
                            group={group}
                            index={groupIndex}
                            key={group.category}
                        />
                    ))}
                </div>
            </div>

            <div className="visually-hidden">
                {skillGroups.map((group) => {
                    const categoryId = skillCategoryId(group.category);
                    return (
                        <section aria-labelledby={categoryId} key={group.category}>
                            <h3 id={categoryId}>{group.category}</h3>
                            <ul>
                                {group.skills.map((skill) => (
                                    <li key={skill.name}>{skill.name}</li>
                                ))}
                            </ul>
                        </section>
                    );
                })}
            </div>
        </section>
    );
}

// Builds one seamless row from two equivalent, sufficiently wide skill sequences.
function SkillMarquee({
    direction,
    group,
    index,
}: {
    direction: "left" | "right";
    group: SkillGroup;
    index: number;
}) {
    const minimumItemsPerSequence = 8;
    const repeatCount = Math.max(2, Math.ceil(minimumItemsPerSequence / group.skills.length));
    const repeatedSkills = Array.from({ length: repeatCount }, () => group.skills).flat();
    const durationSeconds = skillMarqueeDuration(repeatedSkills, index === 0);

    return (
        <div
            className={`skill-marquee skill-marquee-${direction}`}
            style={{ "--skill-marquee-duration": `${durationSeconds}s` } as CSSProperties}
            role="group"
            aria-label={`${group.category} marquee`}
            tabIndex={0}
        >
            <div className="skill-marquee-track" aria-hidden="true">
                <SkillSequence skills={repeatedSkills} />
                <SkillSequence skills={repeatedSkills} />
            </div>
        </div>
    );
}

// Keeps differently sized sequences moving at a similar reading speed and slows the dense first row.
function skillMarqueeDuration(sequence: typeof skills, firstRow: boolean) {
    const sequenceWeight = sequence.reduce((weight, skill) => weight + skill.name.length + 10, 0);
    const normalizedDuration = Math.max(72, sequenceWeight * 0.52);
    return Math.round(normalizedDuration * (firstRow ? 1.15 : 1));
}

// Renders one repeated sequence whose duplicate completes the infinite loop.
function SkillSequence({ skills: sequence }: { skills: typeof skills }) {
    return (
        <ul className="skill-marquee-sequence">
            {sequence.map((skill, index) => (
                <li className="skill-marquee-item" key={`${skill.name}-${index}`}>
                    <SkillLogo skill={skill} />
                    <span>{skill.name}</span>
                </li>
            ))}
        </ul>
    );
}

// Converts each original logo into one current-colour mark while preserving intentional cutouts.
function SkillLogo({ skill }: { skill: (typeof skills)[number] }) {
    const generatedId = useId().replaceAll(":", "");

    if (!skill.logoSrc) {
        return <IconVectorBezier className="skill-marquee-logo" aria-hidden="true" stroke={1.8} />;
    }

    const treatment = logoTreatments[skill.name] ?? "alpha";
    const maskId = `skill-logo-mask-${generatedId}`;
    const filterId = `skill-logo-filter-${generatedId}`;
    const usesLuminance = treatment !== "alpha";

    return (
        <svg className="skill-marquee-logo" viewBox="0 0 100 100" aria-hidden="true">
            <defs>
                {usesLuminance && (
                    <filter id={filterId} colorInterpolationFilters="sRGB">
                        {treatment === "light-cutout" && (
                            <feColorMatrix
                                type="matrix"
                                values="-1 0 0 0 1  0 -1 0 0 1  0 0 -1 0 1  0 0 0 1 0"
                            />
                        )}
                        <feComponentTransfer>
                            <feFuncR type="linear" slope="4" intercept="0" />
                            <feFuncG type="linear" slope="4" intercept="0" />
                            <feFuncB type="linear" slope="4" intercept="0" />
                        </feComponentTransfer>
                    </filter>
                )}
                <mask
                    id={maskId}
                    maskUnits="userSpaceOnUse"
                    x="0"
                    y="0"
                    width="100"
                    height="100"
                    style={{ maskType: usesLuminance ? "luminance" : "alpha" }}
                >
                    <image
                        href={skill.logoSrc}
                        width="100"
                        height="100"
                        preserveAspectRatio="xMidYMid meet"
                        filter={usesLuminance ? `url(#${filterId})` : undefined}
                    />
                </mask>
            </defs>
            <rect width="100" height="100" fill="currentColor" mask={`url(#${maskId})`} />
        </svg>
    );
}

// Converts a category name into a stable heading ID.
function skillCategoryId(category: string) {
    return `skill-${category.toLowerCase().replaceAll(" ", "-")}`;
}
