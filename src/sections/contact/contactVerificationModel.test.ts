import { describe, expect, it } from "vitest";
import { contactVerificationGate, emptyVerificationGate } from "./contactVerificationModel";

// Protects pending Send intent against expiry and late verification after cancellation.
describe("contactVerificationGate", () => {
    it("stores background verification without requesting submission", () => {
        expect(contactVerificationGate(emptyVerificationGate, { type: "token", token: "verified" }))
            .toEqual({ token: "verified", requested: false });
    });

    it("waits for a token when Send requests verification", () => {
        const pending = contactVerificationGate(emptyVerificationGate, { type: "request" });
        expect(pending).toEqual({ token: null, requested: true });
        expect(contactVerificationGate(pending, { type: "token", token: "verified" }))
            .toEqual({ token: "verified", requested: true });
    });

    it("clears Send intent before accepting a late verification token", () => {
        const pending = contactVerificationGate(emptyVerificationGate, { type: "request" });
        const cancelled = contactVerificationGate(pending, { type: "cancel" });
        expect(contactVerificationGate(cancelled, { type: "token", token: "late" }))
            .toEqual({ token: "late", requested: false });
    });

    it("requires fresh verification after a stored token expires", () => {
        const verified = contactVerificationGate(emptyVerificationGate, { type: "token", token: "verified" });
        const expired = contactVerificationGate(verified, { type: "token", token: null });
        expect(contactVerificationGate(expired, { type: "request" }))
            .toEqual({ token: null, requested: true });
    });
});
