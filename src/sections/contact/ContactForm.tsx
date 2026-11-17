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

// Previews the contact form locally without navigating or delivering a message.
export function ContactForm({ active }: ContactFormProps) {
    const [values, setValues] = useState(emptyValues);
    const [invalidField, setInvalidField] = useState<ContactFormField | null>(null);
    const [previewed, setPreviewed] = useState(false);
    const [verification, dispatchVerification] = useReducer(contactVerificationGate, emptyVerificationGate);
    const sendButtonRef = useRef<HTMLButtonElement>(null);
    const [verificationAttempt, setVerificationAttempt] = useState(0);
    const canSend = active && !verification.requested && Object.values(values).every((value) => value.trim() !== "");
    const sendLabel = verification.requested ? "Sending..." : previewed ? "Sent!" : "Send";
    const SendIcon = verification.requested ? IconLoader2 : previewed ? IconCheck : IconArrowUpRight;

    const receiveToken = useCallback((token: string | null) => dispatchVerification({ type: "token", token }), []);

    // A background result can finish a preview only while this Send request is pending.
    useEffect(() => {
        if (!active) {
            dispatchVerification({ type: "cancel" });
            return;
        }
        if (!verification.requested || !verification.token) return;
        dispatchVerification({ type: "cancel" });
        setValues(emptyValues);
        setInvalidField(null);
        setPreviewed(true);
        setVerificationAttempt((current) => current + 1);
    }, [active, verification.requested, verification.token]);

    // Later background results may be cached, but cancellation always clears Send intent.
    const cancelVerification = () => {
        dispatchVerification({ type: "cancel" });
    };

    // Clears stale validation and preview feedback when its source field changes.
    const updateField = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const field = event.currentTarget.name as ContactFormField;
        const value = event.currentTarget.value;
        setValues((current) => ({ ...current, [field]: value }));
        if (invalidField === field) setInvalidField(null);
        setPreviewed(false);
        if (verification.requested) dispatchVerification({ type: "cancel" });
    };

    // Validates the local preview without delivering data or navigating away.
    const previewMessage = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!canSend) return;
        const email = event.currentTarget.elements.namedItem("email");
        if (email instanceof HTMLInputElement && !email.validity.valid) {
            setInvalidField("email");
            email.focus();
            return;
        }
        dispatchVerification({ type: "request" });
    };

    return (
        <>
        <div className="contact-content">
            <h2 id="contact-title" tabIndex={-1}>Contact</h2>
            <form className="contact-form" onSubmit={previewMessage} aria-labelledby="contact-title" noValidate data-scene-scroll-owner>
                <div className="contact-form-row">
                    <label className="visually-hidden" htmlFor="contact-name">Name</label>
                    <input className="contact-form-field" id="contact-name" name="name" placeholder="Your name" autoComplete="name"
                        maxLength={nameMaxLength} required value={values.name} onChange={updateField} />
                    <label className="visually-hidden" htmlFor="contact-email">Email</label>
                    <input className="contact-form-field" id="contact-email" name="email" type="email" placeholder="Your email" autoComplete="email"
                        maxLength={emailMaxLength} required value={values.email} onChange={updateField}
                        aria-invalid={invalidField === "email" || undefined}
                        aria-describedby={invalidField === "email" ? "contact-form-error" : undefined} />
                </div>
                <label className="visually-hidden" htmlFor="contact-comments">Comments</label>
                <textarea className="contact-form-field" id="contact-comments" name="comments" placeholder="What would you like to talk about?"
                    maxLength={commentsMaxLength} required value={values.comments} onChange={updateField}
                    aria-describedby="contact-comments-count" data-scene-scroll-owner />

                <div className="contact-form-message">
                    <p className="contact-form-error" id="contact-form-error" aria-live="polite">
                        {invalidField === "email" ? "Enter a valid email." : "Form not supported yet."}
                    </p>
                    <span className="contact-form-count" id="contact-comments-count">
                        {values.comments.length}/{commentsMaxLength}
                    </span>
                </div>
                <button ref={sendButtonRef} className="action-button action-button-pill contact-form-send" type="submit" disabled={!canSend} aria-busy={verification.requested}>
                    <span>{sendLabel}</span>
                    <SendIcon className={verification.requested ? "contact-form-spinner" : undefined} aria-hidden="true" />
                </button>
                <p className="visually-hidden" role="status">
                    {previewed ? "Preview only. No message was sent." : ""}
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
