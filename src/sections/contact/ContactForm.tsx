import { useState, type FormEvent } from "react";

// Previews the contact form locally without navigating or delivering a message.
export function ContactForm() {
    const [previewed, setPreviewed] = useState(false);

    // Native validation runs first; a valid preview clears the fields without delivery.
    const previewMessage = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        event.currentTarget.reset();
        setPreviewed(true);
    };

    return (
        <div className="contact-content">
            <h2 id="contact-title" tabIndex={-1}>Contact</h2>
            <form className="contact-form" onSubmit={previewMessage} aria-labelledby="contact-title" data-scene-scroll-owner>
                <div className="contact-form-row">
                    <label className="visually-hidden" htmlFor="contact-name">Name</label>
                    <input className="contact-form-field" id="contact-name" name="name" placeholder="Name" autoComplete="name" required />
                    <label className="visually-hidden" htmlFor="contact-email">Email</label>
                    <input className="contact-form-field" id="contact-email" name="email" type="email" placeholder="Email" autoComplete="email" required />
                </div>
                <label className="visually-hidden" htmlFor="contact-comments">Comments</label>
                <textarea className="contact-form-field" id="contact-comments" name="comments" placeholder="Comments" data-scene-scroll-owner required />
                <button className="contact-form-send" type="submit">
                    Send
                </button>
                <p className="visually-hidden" role="status">
                    {previewed ? "Preview only. No message was sent." : ""}
                </p>
            </form>
        </div>
    );
}
