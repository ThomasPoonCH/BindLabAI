import { it, expect } from "vitest";
import { feedbackSchema, feedbackEmail } from "./feedback";
const feedback = feedbackSchema.parse({ id: "11111111-1111-4111-8111-111111111111", category: "Bug", feature: "Calculators", description: "Synthetic feedback only." });
it("creates only an explicit user initiated email draft", () => { const link = feedbackEmail(feedback,"beta@example.org"); expect(link).toMatch(/^mailto:beta%40example.org\?subject=/); expect(decodeURIComponent(link!)).toContain("Synthetic feedback only."); expect(link).not.toContain("experimentalInput"); });
it("rejects an invalid destination", () => expect(feedbackEmail(feedback,"invalid\r\nBcc: x")).toBeNull());
