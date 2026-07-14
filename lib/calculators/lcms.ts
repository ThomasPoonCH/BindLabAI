import { assertNonNegative, assertPositive } from "./validation";

export function calculateAcnWaterVolumes(totalVolumeMl: number, acnPercent: number) {
  assertPositive(totalVolumeMl, "totalVolumeMl");
  validatePercent(acnPercent, "acnPercent");
  const acnMl = totalVolumeMl * (acnPercent / 100);
  return { acnMl, waterMl: totalVolumeMl - acnMl };
}

export function calculateAdditiveVolume(totalVolumeMl: number, additivePercentVv: number) {
  assertPositive(totalVolumeMl, "totalVolumeMl");
  validatePercent(additivePercentVv, "additivePercentVv");
  return totalVolumeMl * (additivePercentVv / 100);
}

export function calculateMobilePhaseConsumption(flowRateMlMin: number, runTimeMin: number, numberOfRuns: number, extraPercent = 10) {
  assertPositive(flowRateMlMin, "flowRateMlMin");
  assertPositive(runTimeMin, "runTimeMin");
  assertPositive(numberOfRuns, "numberOfRuns");
  assertNonNegative(extraPercent, "extraPercent");
  const baseMl = flowRateMlMin * runTimeMin * numberOfRuns;
  return {
    baseMl,
    totalWithExtraMl: baseMl * (1 + extraPercent / 100)
  };
}

export function calculateLcmsDilution(sampleVolumeUl: number, solventVolumeUl: number) {
  assertPositive(sampleVolumeUl, "sampleVolumeUl");
  assertNonNegative(solventVolumeUl, "solventVolumeUl");
  const finalVolumeUl = sampleVolumeUl + solventVolumeUl;
  return {
    finalVolumeUl,
    dilutionFactor: finalVolumeUl / sampleVolumeUl
  };
}

export function calculateFinalSampleConcentration(initialConcentration: number, sampleVolumeUl: number, finalVolumeUl: number) {
  assertPositive(initialConcentration, "initialConcentration");
  assertPositive(sampleVolumeUl, "sampleVolumeUl");
  assertPositive(finalVolumeUl, "finalVolumeUl");
  if (sampleVolumeUl > finalVolumeUl) throw new Error("sampleVolumeUl cannot be greater than finalVolumeUl");
  return initialConcentration * (sampleVolumeUl / finalVolumeUl);
}

export function calculatePeakResolution(rt1: number, rt2: number, width1: number, width2: number) {
  assertPositive(width1, "width1");
  assertPositive(width2, "width2");
  return (2 * Math.abs(rt2 - rt1)) / (width1 + width2);
}

export function calculateRetentionTimeDifference(rt1: number, rt2: number) {
  return Math.abs(rt2 - rt1);
}

export function generateGradientTable(startPercentB: number, endPercentB: number, gradientTimeMin: number, holdTimeMin: number, reequilibrationTimeMin: number) {
  validatePercent(startPercentB, "startPercentB");
  validatePercent(endPercentB, "endPercentB");
  assertPositive(gradientTimeMin, "gradientTimeMin");
  assertNonNegative(holdTimeMin, "holdTimeMin");
  assertNonNegative(reequilibrationTimeMin, "reequilibrationTimeMin");

  return [
    { timeMin: 0, percentB: startPercentB, note: "Initial condition" },
    { timeMin: gradientTimeMin, percentB: endPercentB, note: "End gradient" },
    { timeMin: gradientTimeMin + holdTimeMin, percentB: endPercentB, note: "End hold" },
    { timeMin: gradientTimeMin + holdTimeMin + 0.1, percentB: startPercentB, note: "Return to start" },
    { timeMin: gradientTimeMin + holdTimeMin + reequilibrationTimeMin, percentB: startPercentB, note: "Ready for next run" }
  ];
}

function validatePercent(value: number, name: string) {
  assertNonNegative(value, name);
  if (value > 100) throw new Error(`${name} cannot exceed 100`);
}
