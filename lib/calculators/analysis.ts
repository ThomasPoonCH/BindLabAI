export type LcmsDilutionMode = "factor" | "aliquot" | "final_concentration";

export function calculateLcmsDilution({ mode, finalVialVolumeUl, dilutionFactor, aliquotVolumeUl, diluentVolumeUl, initialConcentration, finalConcentration }: {
  mode: LcmsDilutionMode;
  finalVialVolumeUl: number;
  dilutionFactor?: number;
  aliquotVolumeUl?: number;
  diluentVolumeUl?: number;
  initialConcentration?: number;
  finalConcentration?: number;
}) {
  if (mode === "factor") {
    if (!(finalVialVolumeUl > 0)) throw new Error("Final vial volume must be positive.");
    if (!(dilutionFactor && dilutionFactor > 1)) throw new Error("Dilution factor must be greater than 1.");
    const sampleVolumeUl = finalVialVolumeUl / dilutionFactor;
    return { sampleVolumeUl, diluentVolumeUl: finalVialVolumeUl - sampleVolumeUl, foldDilution: dilutionFactor, formula: "sample volume = final vial volume / dilution factor" };
  }
  if (mode === "aliquot") {
    if (!(aliquotVolumeUl && aliquotVolumeUl > 0) || !(diluentVolumeUl !== undefined && diluentVolumeUl >= 0)) throw new Error("Enter a positive aliquot and a non-negative diluent volume.");
    const finalVolume = aliquotVolumeUl + diluentVolumeUl;
    return { sampleVolumeUl: aliquotVolumeUl, diluentVolumeUl, foldDilution: finalVolume / aliquotVolumeUl, formula: "fold dilution = (sample aliquot + diluent volume) / sample aliquot" };
  }
  if (!(finalVialVolumeUl > 0)) throw new Error("Final vial volume must be positive.");
  if (!(initialConcentration && initialConcentration > 0) || !(finalConcentration && finalConcentration > 0) || finalConcentration >= initialConcentration) throw new Error("Final concentration must be positive and below initial concentration.");
  const factor = initialConcentration / finalConcentration;
  const sampleVolumeUl = finalVialVolumeUl / factor;
  return { sampleVolumeUl, diluentVolumeUl: finalVialVolumeUl - sampleVolumeUl, foldDilution: factor, formula: "C1 x V1 = C2 x V2" };
}

export function calculateMixedDiluent(finalDiluentVolumeUl: number, ratioA: number, ratioB: number) {
  if (!(finalDiluentVolumeUl >= 0) || !(ratioA > 0) || !(ratioB > 0)) throw new Error("Diluent volume and both ratio parts must be positive.");
  const total = ratioA + ratioB;
  return { volumeA: finalDiluentVolumeUl * ratioA / total, volumeB: finalDiluentVolumeUl * ratioB / total, formula: "component volume = total diluent volume x component ratio / total ratio" };
}
