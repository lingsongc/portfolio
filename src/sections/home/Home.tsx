import { useEffect } from "react";
import { homeDetails } from "../../data/about";
import type { ImageDescriptor, MainCircleImagePublisher } from "../../types/images";
import type { SceneLifecycleControl } from "../../types/scene";

const homeImage: ImageDescriptor = {
    src: "/about/profile.jpeg",
    alt: "",
    objectPosition: "center 55%",
};

type HomeProps = {
    lifecycle: SceneLifecycleControl;
    onMainCircleImageChange: MainCircleImagePublisher;
};

// Renders the Home introduction and publishes its image at the top of the page.
export function Home({ lifecycle, onMainCircleImageChange }: HomeProps) {
    const leftName = homeDetails.name.isWestern
        ? homeDetails.name.firstName
        : homeDetails.name.lastName;
    const rightName = homeDetails.name.isWestern
        ? homeDetails.name.lastName
        : homeDetails.name.firstName;
    const contentVisible = lifecycle.active === true
        && (lifecycle.phase === "opening" || lifecycle.phase === "idle");
    const controlledExiting = !contentVisible;

    useEffect(() => {
        onMainCircleImageChange(homeImage);
    }, [onMainCircleImageChange]);

    return (
        <section
            id="home"
            className={`home-container${controlledExiting ? " home-exiting" : ""}`}
            aria-labelledby="home-title"
        >
            <div
                className="orbit-ring home-navigation-ring"
                aria-hidden="true"
            />
            <div className="home-text">
                <h1 id="home-title" className="home-title" aria-label={homeDetails.name.fullName} tabIndex={-1}>
                    <span className={`home-name-left ${homeDetails.name.isWestern ? "home-first-name" : ""}`} aria-hidden="true">
                        <span className="home-name-value">{leftName}</span>
                    </span>
                    <span className={`home-name-right ${homeDetails.name.isWestern ? "" : "home-first-name"}`} aria-hidden="true">
                        <span className="home-name-value">
                            {rightName.split(" ").map((name) => <span key={name}>{name}</span>)}
                        </span>
                    </span>
                </h1>
                <p className="home-description">{homeDetails.introduction}</p>
            </div>
        </section>
    );
}
