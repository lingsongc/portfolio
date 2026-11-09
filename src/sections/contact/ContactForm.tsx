import { useState, type ChangeEvent, type FormEvent } from "react";
import { IconArrowUpRight } from "@tabler/icons-react";

// Upper bounds for each field; 254 is the longest valid email address.
const nameMaxLength = 100;
const emailMaxLength = 254;
const commentsMaxLength = 2000;

type ContactFormValues = { name: string; email: string; comments: string };
type ContactFormField = keyof ContactFormValues;

const emptyValues: ContactFormValues = { name: "", email: "", comments: "" };

// Previews the contact form locally without navigating or delivering a message.
export function ContactForm() {
    const [values, setValues] = useState(emptyValues);
    const [invalidField, setInvalidField] = useState<ContactFormField | null>(null);
    const [previewed, setPreviewed] = useState(false);
    const canSend = Object.values(values).every((value) => value.trim() !== "");

    // Clears stale validation and preview feedback when its source field changes.
    const updateField = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const field = event.currentTarget.name as ContactFormField;
        const value = event.currentTarget.value;
        setValues((current) => ({ ...current, [field]: value }));
        if (invalidField === field) setInvalidField(null);
        setPreviewed(false);
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
        setValues(emptyValues);
        setInvalidField(null);
        setPreviewed(true);
    };

    return (
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
                <button className="action-button action-button-pill contact-form-send" type="submit" disabled={!canSend}>
                    Send
                    <IconArrowUpRight aria-hidden="true" />
                </button>
                <p className="visually-hidden" role="status">
                    {previewed ? "Preview only. No message was sent." : ""}
                </p>
            </form>
        </div>
    );
}
