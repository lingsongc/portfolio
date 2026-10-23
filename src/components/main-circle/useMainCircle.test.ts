import { describe, expect, it } from "vitest";
import type { ImageDescriptor } from "../../types/images";
import { resolveImageState, updateSceneImage } from "./useMainCircle";

const about: ImageDescriptor = { src: "/about.jpg", alt: "" };
const experience: ImageDescriptor = { src: "/experience.jpg", alt: "" };

// Verifies the controller's pure image staging decisions.
describe("main circle controller", () => {
    it("hides the outgoing image while closing", () => {
        expect(resolveImageState({ about }, {
            currentSceneId: "about", requestedSceneId: "experience", phase: "closing",
        })).toEqual({ image: about, imageVisible: false });
    });

    it("retains the hidden outgoing image throughout movement", () => {
        expect(resolveImageState({ about, experience }, {
            currentSceneId: "about", requestedSceneId: "experience", phase: "moving",
        })).toEqual({ image: about, imageVisible: false });
    });

    it("leaves image-free scenes on the persistent moon", () => {
        for (const currentSceneId of ["skills", "contact"] as const) {
            for (const phase of ["opening", "idle"] as const) {
                expect(resolveImageState({ about }, {
                    currentSceneId, requestedSceneId: null, phase,
                })).toEqual({ image: null, imageVisible: false });
            }
        }
    });

    it("clears a withdrawn image without removing other scene images", () => {
        const registry = { about, experience };
        expect(updateSceneImage(registry, "about", null)).toEqual({ experience });
        expect(registry.about).toBe(about);
        expect(updateSceneImage(registry, "about", about)).toBe(registry);
    });

    it("reveals the current image while opening and idle", () => {
        expect(resolveImageState({ experience }, {
            currentSceneId: "experience", requestedSceneId: "experience", phase: "opening",
        })).toEqual({ image: experience, imageVisible: true });
        expect(resolveImageState({ experience }, {
            currentSceneId: "experience", requestedSceneId: null, phase: "idle",
        })).toEqual({ image: experience, imageVisible: true });
    });
});
