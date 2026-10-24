// Stores the editable labels, destinations, and icons for the Contact profile links.
export type ContactProfile = {
    id: "github" | "instagram" | "linkedin" | "email";
    label: string;
    href: string;
    image: string;
};

export const contactProfiles: readonly ContactProfile[] = [
    { id: "github", label: "GitHub", href: "https://github.com/lingsongc", image: "/contacts/github.svg" },
    { id: "instagram", label: "Instagram", href: "https://www.instagram.com/lingsongc/", image: "/contacts/instagram.svg" },
    { id: "linkedin", label: "LinkedIn", href: "https://www.linkedin.com/in/lingsongc/", image: "/contacts/linkedin.svg" },
    { id: "email", label: "Email", href: "mailto:lingsong.c4@gmail.com", image: "/contacts/email.svg" },
];
