// @vitest-environment jsdom

// Exercises the real form and scene overlay against controlled external verification events.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ScenePanel } from "../../components/scene-panel/ScenePanel";
import { ContactForm } from "./ContactForm";

type WidgetCallbacks = Parameters<NonNullable<Window["turnstile"]>["render"]>[1] & {
    "unsupported-callback"?: () => void;
};

let container: HTMLDivElement;
let root: Root;
let callbacks: WidgetCallbacks;

// Mount the actual form with controlled Cloudflare callbacks for each isolated interaction.
beforeEach(async () => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    // jsdom has no top layer; keep modal opening observable without mocking React components.
    Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
        configurable: true,
        value: function (this: HTMLDialogElement) { this.open = true; },
    });
    Object.defineProperty(HTMLDialogElement.prototype, "close", {
        configurable: true,
        value: function (this: HTMLDialogElement) { this.open = false; },
    });
    window.turnstile = {
        render: (_element, options) => { callbacks = options; return "verification-test"; },
        remove: () => {},
    };
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    await renderForm(true);
});

// Release the React root and test-only browser shims after every case.
afterEach(async () => {
    await act(async () => root?.unmount());
    container?.remove();
    Reflect.deleteProperty(HTMLDialogElement.prototype, "showModal");
    Reflect.deleteProperty(HTMLDialogElement.prototype, "close");
    delete window.turnstile;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

describe("contact verification interaction", () => {
    it("opens recovery after Send when the browser is unsupported", async () => {
        await act(async () => callbacks["unsupported-callback"]?.());
        expect(dialog().open).toBe(false);
        await fillForm();
        await clickButton("Send");
        expect(dialog().open).toBe(true);
        expect(container.querySelector("#contact-verification-description")?.textContent)
            .toContain("Verification unavailable");
        expect(button("Retry")).toBeDefined();
        expect(button("Cancel")).toBeDefined();
    });

    it("preserves the fields and cancels Send even when verification finishes later", async () => {
        await fillForm();
        await act(async () => callbacks["before-interactive-callback"]());
        await clickButton("Send");
        expect(dialog().open).toBe(true);
        await clickButton("Cancel");
        expect(dialog().open).toBe(false);
        expect(document.activeElement).toBe(button("Send"));

        await act(async () => callbacks.callback("late-token"));
        expect(field("name").value).toBe("Test visitor");
        expect(field("email").value).toBe("visitor@example.com");
        expect(field("comments").value).toBe("Keep this message after cancellation.");
        expect(container.textContent).not.toContain("Preview only. No message was sent.");
        expect(dialog().open).toBe(false);
        expect(button("Send").disabled).toBe(false);
    });

    it("shows Send, Sending..., and Sent!, then resets when the form is edited", async () => {
        await fillForm();
        expect(button("Send").disabled).toBe(false);
        await act(async () => callbacks["before-interactive-callback"]());
        await clickButton("Send");
        expect(button("Sending...").getAttribute("aria-busy")).toBe("true");
        expect(dialog().open).toBe(true);
        await act(async () => callbacks.callback("verified-token"));
        expect(field("name").value).toBe("");
        expect(field("email").value).toBe("");
        expect(field("comments").value).toBe("");
        expect(container.textContent).toContain("Preview only. No message was sent.");
        expect(dialog().open).toBe(false);
        expect(button("Sent!").disabled).toBe(true);
        expect(button("Sent!").getAttribute("aria-busy")).toBe("false");
        await fillForm();
        expect(button("Send").disabled).toBe(false);
    });

    it("removes an open dialog on scene departure without clearing the draft", async () => {
        await fillForm();
        await act(async () => callbacks["before-interactive-callback"]());
        await clickButton("Send");
        expect(dialog().open).toBe(true);
        const previousCallbacks = callbacks;
        await renderForm(false);
        expect(container.querySelector("dialog")).toBeNull();
        await act(async () => previousCallbacks.callback("late-token"));
        expect(field("comments").value).toBe("Keep this message after cancellation.");
        expect(container.textContent).not.toContain("Preview only. No message was sent.");
    });
});

// Preserve the form component while changing its scene's active boundary.
async function renderForm(active: boolean) {
    await act(async () => root.render(
        <ScenePanel active={active} headingFocusTargetId="contact-title">
            <ContactForm active={active} />
        </ScenePanel>,
    ));
}

// Dispatch native input events so React handles the edits through its real onChange callbacks.
async function fillForm() {
    const values = { name: "Test visitor", email: "visitor@example.com", comments: "Keep this message after cancellation." };
    await act(async () => {
        for (const [name, value] of Object.entries(values)) {
            const input = field(name);
            const prototype = input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
            Object.getOwnPropertyDescriptor(prototype, "value")!.set!.call(input, value);
            input.dispatchEvent(new Event("input", { bubbles: true }));
        }
    });
}

// Find form fields through their browser-facing names rather than component state.
function field(name: string) {
    return container.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${name}"]`)!;
}

// Read the real modal element so the tests cover form-to-dialog wiring.
function dialog() {
    return container.querySelector<HTMLDialogElement>("dialog")!;
}

// Resolve visible button labels while ignoring decorative SVG markup.
function button(label: string) {
    const match = Array.from(container.querySelectorAll("button")).find((element) => element.textContent?.trim() === label);
    if (!match) throw new Error(`Missing button: ${label}`);
    return match;
}

// Use the button's native activation path, including submission and disabled behavior.
async function clickButton(label: string) {
    await act(async () => button(label).click());
}
