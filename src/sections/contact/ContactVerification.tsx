import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { IconRotateClockwise, IconX } from "@tabler/icons-react";

type ContactVerificationProps = {
    requested: boolean;
    onTokenChange: (token: string | null) => void;
    onCancel: () => void;
    returnFocusRef: RefObject<HTMLButtonElement | null>;
};
type TurnstileApi = {
    render: (container: HTMLElement, options: {
        sitekey: string;
        size: "flexible";
        theme: "auto";
        appearance: "interaction-only";
        callback: (token: string) => void;
        "before-interactive-callback": () => void;
        "after-interactive-callback": () => void;
        "expired-callback": () => void;
        "error-callback": () => boolean;
        "unsupported-callback": () => void;
        "timeout-callback": () => void;
    }) => string;
    remove: (widgetId: string) => void;
};

declare global {
    interface Window { turnstile?: TurnstileApi }
}

// Local previews can force a prompt; production always uses the real site key.
const sitekey = import.meta.env.DEV
    ? new URLSearchParams(window.location.search).get("preview-verification") === "error"
        ? "2x00000000000000000000AB"
        : new URLSearchParams(window.location.search).has("preview-verification")
        ? "3x00000000000000000000FF"
        : "1x00000000000000000000AA"
    : "0x4AAAAAAGFHINJLbp3Wp3W1";
const scriptUrl = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

// Owns the external verification widget and clears tokens when it expires or unmounts.
// Native dialog removal also releases its top layer when the owning scene leaves.
export function ContactVerification({ requested, onTokenChange, onCancel, returnFocusRef }: ContactVerificationProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const dialogRef = useRef<HTMLDialogElement>(null);
    const headingRef = useRef<HTMLHeadingElement>(null);
    const [status, setStatus] = useState<"loading" | "widget" | "interactive" | "error">("loading");
    const [attempt, setAttempt] = useState(0);
    const [promptPresented, setPromptPresented] = useState(false);
    const showPrompt = requested && (promptPresented || status === "interactive" || status === "error");

    // Native modal behavior traps focus and makes every other page control inert.
    useLayoutEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        if (!requested) setPromptPresented(false);
        if (showPrompt && !dialog.open) {
            setPromptPresented(true);
            dialog.showModal();
            headingRef.current?.focus({ preventScroll: true });
        } else if (!showPrompt && dialog.open) {
            dialog.close();
            returnFocusRef.current?.focus({ preventScroll: true });
        }
    }, [showPrompt, requested, returnFocusRef]);

    // Connect the external script and widget callbacks to the section-owned status.
    useEffect(() => {
        let disposed = false;
        let widgetId: string | undefined;
        const previousScript = Array.from(document.scripts).find((element) => element.src === scriptUrl);
        // A script that already failed cannot restart by assigning its src again.
        const script = attempt > 0 && !window.turnstile ? document.createElement("script") : previousScript;
        onTokenChange(null);
        setStatus("loading");

        // Let the visitor retry when the script is blocked or verification fails.
        const fail = () => {
            if (disposed) return;
            onTokenChange(null);
            setStatus("error");
        };
        const loadTimeout = window.setTimeout(fail, 15000);

        // The script may finish before or after React mounts this component.
        const render = () => {
            if (disposed || widgetId !== undefined || !containerRef.current || !window.turnstile) return;
            window.clearTimeout(loadTimeout);
            try {
                widgetId = window.turnstile.render(containerRef.current, {
                    sitekey,
                    size: "flexible",
                    theme: "auto",
                    appearance: "interaction-only",
                    callback: (token) => {
                        if (disposed) return;
                        onTokenChange(token);
                        setStatus("widget");
                    },
                    // Remember extra verification without interrupting the visitor before Send.
                    "before-interactive-callback": () => {
                        if (disposed) return;
                        onTokenChange(null);
                        setStatus("interactive");
                    },
                    "after-interactive-callback": () => {
                        if (!disposed) setStatus((current) => current === "interactive" ? "widget" : current);
                    },
                    "expired-callback": () => { if (!disposed) onTokenChange(null); },
                    "error-callback": () => { fail(); return true; },
                    "unsupported-callback": fail,
                    "timeout-callback": fail,
                });
                setStatus((current) => current === "loading" ? "widget" : current);
            } catch {
                fail();
            }
        };

        script?.addEventListener("load", render);
        script?.addEventListener("error", fail);
        if (window.turnstile) render();
        else if (!script) fail();
        else if (attempt > 0) {
            script.src = scriptUrl;
            script.async = true;
            script.defer = true;
            // Attach listeners above before insertion, including for a cached response.
            if (previousScript) previousScript.replaceWith(script);
            else document.head.append(script);
        }

        return () => {
            disposed = true;
            window.clearTimeout(loadTimeout);
            script?.removeEventListener("load", render);
            script?.removeEventListener("error", fail);
            if (widgetId !== undefined) window.turnstile?.remove(widgetId);
            onTokenChange(null);
        };
    }, [onTokenChange, attempt]);

    return (
        <dialog ref={dialogRef} className="contact-verification" aria-hidden={!showPrompt}
            aria-labelledby="contact-verification-title" aria-describedby="contact-verification-description"
            inert={!showPrompt} data-scene-scroll-owner
            onCancel={(event) => { event.preventDefault(); onCancel(); }}
            onKeyDown={(event) => event.stopPropagation()}
            onWheel={(event) => event.stopPropagation()}
            onTouchStart={(event) => event.stopPropagation()}
            onTouchMove={(event) => event.stopPropagation()}>
            <h3 ref={headingRef} id="contact-verification-title" tabIndex={-1}>Complete verification to send</h3>
            <p className="contact-verification-description" id="contact-verification-description" role="status">
                {status === "error" ? "Verification unavailable. Please try again."
                    : status === "loading" ? "Checking verification..."
                    : "Please confirm you are human to continue."}
            </p>
            <div className="contact-verification-widget">
                <div ref={containerRef} hidden={status === "error"} />
            </div>
            <div className="contact-verification-actions">
                {status === "error" && (
                    <button className="action-button action-button-pill contact-verification-action" type="button" onClick={() => {
                        setAttempt((current) => current + 1);
                        headingRef.current?.focus({ preventScroll: true });
                    }}>
                        <span>Retry</span>
                        <IconRotateClockwise aria-hidden="true" />
                    </button>
                )}
                <button className="action-button action-button-pill contact-verification-action contact-verification-cancel" type="button" onClick={onCancel}>
                    <span>Cancel</span>
                    <IconX aria-hidden="true" />
                </button>
            </div>
        </dialog>
    );
}
