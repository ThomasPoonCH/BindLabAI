import { describe, expect, it } from "vitest";
import { resolveVerifiedReagent } from "./verified-reagents";

describe("verified reagent resolution", () => {
  it("matches exact abbreviations and synonyms", () => {
    expect(resolveVerifiedReagent("DIPEA").record?.canonicalName).toBe("N,N-Diisopropylethylamine");
    expect(resolveVerifiedReagent("Hünig's base").record?.id).toBe("bindlab-dipea");
    expect(resolveVerifiedReagent("N,N-dimethylformamide").record?.id).toBe("bindlab-dmf");
  });
  it("keeps methylamine free base distinct from its hydrochloride salt", () => {
    expect(resolveVerifiedReagent("methylamine").record?.id).toBe("bindlab-methylamine-free-base");
    expect(resolveVerifiedReagent("methylamine hydrochloride").record?.id).toBe("bindlab-methylamine-hydrochloride");
    expect(resolveVerifiedReagent("MeNH2·HCl").record?.molecularWeight).toBe(67.52);
  });
  it("does not resolve a custom stereoisomer substrate by similarity", () => {
    const result = resolveVerifiedReagent("12-COOH stereoisomer substrate");
    expect(result.record).toBeNull();
    expect(result.requiresConfirmation).toBe(true);
  });
});
