import type { AnalyticalScenario, BenchSession, NextAction } from "./types";

export function nextActionFor(scenario: AnalyticalScenario, session: BenchSession): NextAction {
  if (scenario === "product-dominant") {
    return {
      state: "Product-dominant result",
      recommendation: "Record the checkpoint and proceed only with the approved work-up plan.",
      reasons: ["The simulated product signal is dominant.", "No starting-material signal is selected.", "Execution deviations remain preserved for review."],
      alternative: "Request supervisor review before changing the approved workflow."
    };
  }
  if (scenario === "inconclusive") {
    return {
      state: "Analytical result inconclusive",
      recommendation: "Review sample preparation and request an approved repeat analysis.",
      reasons: ["The simulated result does not justify a conversion assessment.", "No chemical amendment is recommended from inconclusive evidence.", "The experiment timeline remains available for review."],
      alternative: "Prepare a new analytical sample under the approved method."
    };
  }
  return {
    state: "Partial conversion likely",
    recommendation: "Continue for one approved interval and repeat LCMS.",
    reasons: [
      "Product and starting material are both detected.",
      session.actuals.hatu ? "Recorded quantities remain visible against the calculated plan." : "No major blocking quantity deviation is recorded.",
      "No unexpected major peak is selected.",
      "The planned checkpoint has been reached."
    ],
    alternative: "Build a 0.5x amendment plan for supervisor approval."
  };
}
