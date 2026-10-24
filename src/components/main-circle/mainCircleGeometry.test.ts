import { describe, expect, it } from "vitest";
import { sceneOrder } from "../../types/scene";
import type { MainCircleEndpoint } from "../../types/mainCircle";
import { contactFittedFinalOffset, contactProfileDiameter } from "../../sections/contact/contactGeometry";
import {
    aboutCircleLeft, aboutCircleSize, contactCircleSize, experienceCircleSize,
    homeCircleSize, MAIN_CIRCLE_TRAVEL_DURATION_MS, mainCircleTravelAtTime,
    projectCircleSize, resolveMainCircleSceneEndpoint, skillsCircleLeft,
    skillsCircleSize, type MainCircleSceneLayout,
} from "./mainCircleGeometry";

const layout: MainCircleSceneLayout = {
    viewportWidth: 1440, viewportHeight: 900, homeCircleWidth: 352,
    experienceCenter: { top: 602, left: 1047 },
};

// Verifies responsive endpoints and direct travel without rendering the page.
describe("main circle geometry", () => {
    it("matches responsive circle sizing and placement", () => {
        expect(homeCircleSize(320, 16)).toBe(128);
        expect(homeCircleSize(1440, 16)).toBe(352);
        expect(aboutCircleSize(768, 900)).toBeCloseTo(729.6);
        expect(aboutCircleSize(769, 900)).toBe(1440);
        expect(aboutCircleLeft(769, 900)).toBe(-144);
        expect(experienceCircleSize(1440, 900)).toBe(621);
        expect(experienceCircleSize(768, 900)).toBeCloseTo(599.04);
        expect(projectCircleSize(1440, 900)).toBeCloseTo(489.6);
        expect(projectCircleSize(768, 900)).toBeCloseTo(442.368);
        expect(skillsCircleSize(1440, 900)).toBe(810);
        expect(skillsCircleLeft(1440, 900)).toBe(981);
        expect(contactCircleSize(1440, 900)).toBeCloseTo(720);
    });

    it("resolves all six laptop endpoints", () => {
        const endpoints = Object.fromEntries(sceneOrder.map((id) => [id, resolveMainCircleSceneEndpoint(id, layout)]));
        expect(endpoints).toMatchObject({
            home: { width: 352, top: 450, left: 720 },
            about: { width: 1440, top: 450, left: -144 },
            experience: { width: 621, top: 602, left: 1047 },
            projects: { width: 489.6, top: 450, left: 720 },
            skills: { width: 810, top: 450, left: 981 },
            contact: { top: 450, left: 720 },
        });
        expect(endpoints.contact.width).toBeCloseTo(720);
    });

    it("gives the Contact form usable phone width and a larger laptop surface", () => {
        expect(contactCircleSize(390, 844)).toBeCloseTo(335.4);
        expect(contactCircleSize(320, 568)).toBeCloseTo(275.2);
        expect(contactCircleSize(1440, 900)).toBeCloseTo(720);
    });

    it.each([[768, 1024], [768, 900], [768, 400], [390, 844], [320, 568]])(
        "keeps the largest mobile Contact ball detached at %i by %i",
        (width, height) => {
            const size = contactCircleSize(width, height);
            const diameterRatio = 7 / 15;
            const offset = [-0.28, 0.84] as const;
            const x = contactFittedFinalOffset(offset, diameterRatio, size, width, height, 0, 48);
            const y = contactFittedFinalOffset(offset, diameterRatio, size, width, height, 1);
            expect(Math.hypot(x, y) - size * (1 + diameterRatio) / 2).toBeGreaterThan(4);
        },
    );

    it.each([[1024, 768], [1280, 1024], [900, 900], [769, 512]])(
        "keeps every Contact ball detached in a compact %i by %i window",
        (width, height) => {
            const size = contactCircleSize(width, height);
            const profiles = [
                { offset: [-0.28, -0.84], ratio: 1 / 3 },
                { offset: [0.28, -0.84], ratio: 5 / 12 },
                { offset: [-0.28, 0.84], ratio: 7 / 15 },
                { offset: [0.28, 0.84], ratio: 0.3 },
            ] as const;
            for (const profile of profiles) {
                const diameter = contactProfileDiameter(profile.ratio, size, width, height);
                const x = contactFittedFinalOffset(profile.offset, diameter / size, size, width, height, 0, 48);
                const y = contactFittedFinalOffset(profile.offset, diameter / size, size, width, height, 1);
                expect(Math.hypot(x, y) - (size + diameter) / 2).toBeGreaterThan(4);
            }
        },
    );

    it("uses current measured layout inputs", () => {
        const measured = { ...layout, homeCircleWidth: 300, experienceCenter: { top: 540, left: 980 } };
        expect(resolveMainCircleSceneEndpoint("home", measured).width).toBe(300);
        expect(resolveMainCircleSceneEndpoint("experience", measured)).toMatchObject({ top: 540, left: 980 });
        expect(resolveMainCircleSceneEndpoint("skills", measured).left).toBe(981);
    });

    it("interpolates one-second travel with shared clamped easing", () => {
        const from: MainCircleEndpoint = { width: 1440, top: 450, left: -144 };
        const to: MainCircleEndpoint = { width: 621, top: 602, left: 1047 };
        expect(MAIN_CIRCLE_TRAVEL_DURATION_MS).toBe(1000);
        expect(mainCircleTravelAtTime(from, to, 500)).toEqual({
            endpoint: { width: 1030.5, top: 526, left: 451.5 }, easedProgress: 0.5,
        });
        expect(mainCircleTravelAtTime(from, to, 500, (progress) => progress * progress).easedProgress).toBe(0.25);
        expect(mainCircleTravelAtTime(from, to, -100).endpoint).toEqual(from);
        expect(mainCircleTravelAtTime(from, to, 1200).endpoint).toEqual(to);
    });
});
