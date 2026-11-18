import { useCallback, useEffect, useReducer, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { IconArrowUpRight, IconCheck, IconLoader2 } from "@tabler/icons-react";
import { ContactVerification } from "./ContactVerification";
import { ScenePanelOverlay } from "../../components/scene-panel/ScenePanel";
import { contactVerificationGate, emptyVerificationGate } from "./contactVerificationModel";

// Upper bounds for each field; 254 is the longest valid email address.
const nameMaxLength = 100;
const emailMaxLength = 254;
const commentsMaxLength = 2000;

type ContactFormValues = { name: string; email: string; comments: string };
type ContactFormField = keyof ContactFormValues;
type ContactFormProps = { active: boolean };

const emptyValues: ContactFormValues = { name: "", email: "", comments: "" };

// Verifies each submission and clears the draft only after the Worker confirms delivery.
export function ContactForm({ active }: ContactFormProps) {
    const [values, setValues] = useState(emptyValues);
    const [invalidField, setInvalidField] = useState<ContactFormField | null>(null);
    const [sent, setSent] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [deliveryError, setDeliveryError] = useState("");
    const submissionRef = useRef(false);
    const [verification, dispatchVerification] = useReducer(contactVerificationGate, emptyVerificationGate);
    const sendButtonRef = useRef<HTMLButtonElement>(null);
    const [verificationAttempt, setVerificationAttempt] = useState(0);
    const pending = verification.requested || submitting;
    const canSend = active && !pending && Object.values(values).every((value) => value.trim() !== "");
    const sendLabel = pending ? "Sending..." : sent ? "Sent!" : "Send";
    const SendIcon = pending ? IconLoader2 : sent ? IconCheck : IconArrowUpRight;

    const receiveToken = useCallback((token: string | null) => dispatchVerification({ type: "token", token }), []);

    // Leaving cancels verification intent. An already dispatched write continues to its outcome.
    // The ref guards repeat effects and submissions while React commits the pending state.
    useEffect(() => {
        if (!active) {
            dispatchVerification({ type: "cancel" });
            return;
        }
        if (!verification.requested || !verification.token || submissionRef.current) return;
        submissionRef.current = true;
        setSubmitting(true);
        dispatchVerification({ type: "cancel" });
        const body = JSON.stringify({
            name: values.name.trim(), email: values.email.trim(), comments: values.comments.trim(),
            turnstileToken: verification.token,
        });
        // Never retry automatically: a lost response may follow a successfully stored message.
        void (async () => {
            try {
                const response = await fetch("https://portfolio-contact-api.lingsong-c4.workers.dev/contact", {
                    method: "POST", headers: { "Content-Type": "application/json" }, body,
                    signal: AbortSignal.timeout(20000),
                });
                const result: unknown = await response.json();
                if (!response.ok || !result || typeof result !== "object" || !("success" in result) || result.success !== true) {
                    throw new Error("Message not sent");
                }
                setValues(emptyValues);
                setInvalidField(null);
                setSent(true);
            } catch {
                setDeliveryError("Couldn't send your message. Please try again.");
            } finally {
                submissionRef.current = false;
                setSubmitting(false);
                // Turnstile tokens are single use, including after an unsuccessful request.
                setVerificationAttempt((current) => current + 1);
            }
        })();
    }, [active, verification.requested, verification.token, values]);

    // Later background results may be cached, but cancellation always clears Send intent.
    const cancelVerification = () => {
        dispatchVerification({ type: "cancel" });
    };

    // Clears stale feedback when the visitor edits an available field.
    const updateField = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const field = event.currentTarget.name as ContactFormField;
        const value = event.currentTarget.value;
        setValues((current) => ({ ...current, [field]: value }));
        if (invalidField === field) setInvalidField(null);
        setSent(false);
        setDeliveryError("");
        if (verification.requested) dispatchVerification({ type: "cancel" });
    };

    // Records Send intent after validation; verification then releases exactly one request.
    const sendMessage = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!canSend || submissionRef.current) return;
        const email = event.currentTarget.elements.namedItem("email");
        if (email instanceof HTMLInputElement && !email.validity.valid) {
            setInvalidField("email");
            email.focus();
            return;
        }
        setDeliveryError("");
        dispatchVerification({ type: "request" });
    };

    return (
        <>
        <div className="contact-content">
            <h2 id="contact-title" tabIndex={-1}>Contact</h2>
            <form className="contact-form" onSubmit={sendMessage} aria-labelledby="contact-title" noValidate data-scene-scroll-owner>
                <div className="contact-form-row">
                    <label className="visually-hidden" htmlFor="contact-name">Name</label>
                    <input className="contact-form-field" id="contact-name" name="name" placeholder="Your name" autoComplete="name"
                        maxLength={nameMaxLength} required value={values.name} readOnly={submitting} onChange={updateField} />
                    <label className="visually-hidden" htmlFor="contact-email">Email</label>
                    <input className="contact-form-field" id="contact-email" name="email" type="email" placeholder="Your email" autoComplete="email"
                        maxLength={emailMaxLength} required value={values.email} readOnly={submitting} onChange={updateField}
                        aria-invalid={invalidField === "email" || undefined}
                        aria-describedby={invalidField === "email" ? "contact-form-error" : undefined} />
                </div>
                <label className="visually-hidden" htmlFor="contact-comments">Comments</label>
                <textarea className="contact-form-field" id="contact-comments" name="comments" placeholder="What would you like to talk about?"
                    maxLength={commentsMaxLength} required value={values.comments} readOnly={submitting} onChange={updateField}
                    aria-describedby="contact-comments-count" data-scene-scroll-owner />

                <div className="contact-form-message">
                    <p className="contact-form-error" id="contact-form-error" aria-live="polite">
                        {invalidField === "email" ? "Enter a valid email." : deliveryError}
                    </p>
                    <span className="contact-form-count" id="contact-comments-count">
                        {values.comments.length}/{commentsMaxLength}
                    </span>
                </div>
                <button ref={sendButtonRef} className="action-button action-button-pill contact-form-send" type="submit" disabled={!canSend} aria-busy={pending}>
                    <span>{sendLabel}</span>
                    <SendIcon className={pending ? "contact-form-spinner" : undefined} aria-hidden="true" />
                </button>
                <p className="visually-hidden" role="status">
                    {sent ? "Message sent." : ""}
                </p>
            </form>
        </div>
        <ScenePanelOverlay>
            {active && <ContactVerification key={verificationAttempt} requested={verification.requested && !verification.token}
                onTokenChange={receiveToken} onCancel={cancelVerification} returnFocusRef={sendButtonRef} />}
        </ScenePanelOverlay>
        </>
    );
}
