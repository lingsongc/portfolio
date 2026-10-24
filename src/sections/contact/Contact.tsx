import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import type { SceneLifecycleControl } from "../../types/scene";
import { contactProfiles, type ContactProfile } from "../../data/contact";
import { contactFittedFinalOffset, contactInitialOffset, contactProfileDiameter, contactUsesStackedLayout, type ContactOffset } from "./contactGeometry";
import { ContactForm } from "./ContactForm";

type ContactProps = { lifecycle: SceneLifecycleControl };
type ContactProfileLayout = {
    offset: ContactOffset;
    mobileOffset: ContactOffset;
    diameterRatio: number;
};
type ProfileStyle = CSSProperties & {
    "--contact-initial-x": string;
    "--contact-initial-y": string;
    "--contact-final-x": string;
    "--contact-final-y": string;
};

const contactProfileLayouts: Record<ContactProfile["id"], ContactProfileLayout> = {
    github: { offset: [-0.62, -0.54], mobileOffset: [-0.28, -0.84], diameterRatio: 1 / 3 },
    instagram: { offset: [-0.73, 0.12], mobileOffset: [0.28, -0.84], diameterRatio: 5 / 12 },
    linkedin: { offset: [0.68, 0.4], mobileOffset: [-0.28, 0.84], diameterRatio: 7 / 15 },
    email: { offset: [0.7, -0.32], mobileOffset: [0.28, 0.84], diameterRatio: 0.3 },
};

// Coordinates the circular prototype form and measured four-profile split.
export function Contact({ lifecycle }: ContactProps) {
    const orbitRef = useRef<HTMLDivElement>(null);
    const [layout, setLayout] = useState({ orbitSize: 0, viewportWidth: 0, viewportHeight: 0 });
    const visible = lifecycle.active && (lifecycle.phase === "opening" || lifecycle.phase === "idle");

    useLayoutEffect(() => {
        const orbit = orbitRef.current;
        if (!orbit) return;
        const measure = () => setLayout({
            orbitSize: orbit.offsetWidth,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
        });
        const observer = new ResizeObserver(measure);
        observer.observe(orbit);
        // Phone height changes can move the viewport bounds without resizing the orbit.
        window.addEventListener("resize", measure);
        measure();
        return () => {
            observer.disconnect();
            window.removeEventListener("resize", measure);
        };
    }, []);

    return (
        <section id="contact" className={`contact-container${visible ? " contact-content-visible" : ""}`} aria-labelledby="contact-title">
            <div ref={orbitRef} className={`contact-orbit${visible ? " contact-split-visible" : ""}`}>
                <svg width="0" height="0" aria-hidden="true">
                    <defs>
                        <filter id="contact-goo" x="-50%" y="-50%" width="200%" height="200%" colorInterpolationFilters="sRGB">
                            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="contact-blur" />
                            <feColorMatrix in="contact-blur" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -10" result="contact-goo-alpha" />
                            <feBlend in="SourceGraphic" in2="contact-goo-alpha" />
                        </filter>
                    </defs>
                </svg>
                <div className="contact-blob-layer" aria-hidden="true">
                    <span className="contact-blob-center" />
                    {contactProfiles.map((profile) => (
                        <span className="contact-satellite" data-profile={profile.id} style={profileStyle(profile, layout)} key={profile.id} />
                    ))}
                </div>
                <nav className="contact-link-layer" aria-label="Contact links">
                    {contactProfiles.map((profile) => (
                        <a className="contact-link" data-profile={profile.id} href={profile.href} target={profile.href.startsWith("mailto:") ? undefined : "_blank"} rel="noopener noreferrer" aria-label={profile.label} style={profileStyle(profile, layout)} key={profile.id}>
                            <img className="contact-social-icon" src={profile.image} alt="" />
                            <span className="contact-social-label">{profile.label}</span>
                        </a>
                    ))}
                </nav>
            </div>
            <ContactForm />
        </section>
    );
}

// Publishes the measured start and fitted endpoint as CSS variables.
function profileStyle(profile: ContactProfile, layout: { orbitSize: number; viewportWidth: number; viewportHeight: number }): ProfileStyle {
    const { orbitSize, viewportWidth, viewportHeight } = layout;
    const placement = contactProfileLayouts[profile.id];
    // Use two rows wherever the viewport has insufficient space beside the form.
    const stacked = contactUsesStackedLayout(viewportWidth, viewportHeight);
    const offset = stacked ? placement.mobileOffset : placement.offset;
    const diameter = contactProfileDiameter(placement.diameterRatio, orbitSize, viewportWidth, viewportHeight);
    const diameterRatio = orbitSize > 0 ? diameter / orbitSize : placement.diameterRatio;
    return {
        width: `${diameter}px`,
        "--contact-initial-x": `${contactInitialOffset(offset, diameterRatio, orbitSize, 0)}px`,
        "--contact-initial-y": `${contactInitialOffset(offset, diameterRatio, orbitSize, 1)}px`,
        "--contact-final-x": `${contactFittedFinalOffset(offset, diameterRatio, orbitSize, viewportWidth, viewportHeight, 0, stacked ? 48 : 64)}px`,
        "--contact-final-y": `${contactFittedFinalOffset(offset, diameterRatio, orbitSize, viewportWidth, viewportHeight, 1, stacked ? 4 : 24)}px`,
    };
}
