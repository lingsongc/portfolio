type VerificationGate = { token: string | null; requested: boolean };
type VerificationEvent = { type: "request" } | { type: "cancel" } | { type: "token"; token: string | null };

export const emptyVerificationGate: VerificationGate = { token: null, requested: false };

// Keeps verification results separate from the visitor's current intent to send.
export function contactVerificationGate(state: VerificationGate, event: VerificationEvent): VerificationGate {
    switch (event.type) {
        case "request": return { ...state, requested: true };
        case "cancel": return emptyVerificationGate;
        case "token": return { ...state, token: event.token };
    }
}
