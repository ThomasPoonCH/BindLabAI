"use client";

import { useMemo, useState } from "react";
import { CalculatorCard } from "@/components/calculators/CalculatorCard";
import { FormulaBox } from "@/components/calculators/FormulaBox";
import { InputWithUnit } from "@/components/calculators/InputWithUnit";
import { ResultBox } from "@/components/calculators/ResultBox";
import { UnitConversionLab } from "@/components/calculators/UnitConversionLab";
import { PartsInPartsCalculator } from "@/components/calculators/PartsInPartsCalculator";
import {
  calculateDilutionVolume,
  calculateFoldDilutionRecipe,
  calculateMolarity,
  calculateMultiSubstanceMixtureRecipe,
  calculateRatioDilutionRecipe,
  calculateVolumeFromMassAndDensity,
  calculateVolumeFromMolesAndConcentration,
  convertConcentrationToM,
  convertVolumeFromL,
  convertVolumeToL,
  type ConcentrationUnit,
  type RatioDilutionInterpretation,
  type VolumeUnit
} from "@/lib/calculators/chemistry";
import { calculateSolventVolumeForTargetConcentration, calculateTheoreticalYield } from "@/lib/calculators/synthesis";
import { calculateAcnWaterVolumes, calculateAdditiveVolume, calculateLcmsDilution, calculateMobilePhaseConsumption, calculatePeakResolution } from "@/lib/calculators/lcms";
import { convertMolToUmol, selectPipetteRange } from "@/lib/calculators/units";
import { pipetteWarning } from "@/lib/calculators/validation";

function fmt(value: number, digits = 4) {
  return Number.isFinite(value) ? Number(value.toPrecision(digits)).toString() : "Invalid";
}

function safe<T>(fn: () => T): { value?: T; error?: string } {
  try {
    return { value: fn() };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not calculate" };
  }
}

export function CalculatorWorkbench({ projectId }: { projectId: string | null }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <UnitConversionLab />
      <PartsInPartsCalculator />
      <MolarityCalculator projectId={projectId} />
      <DilutionCalculator projectId={projectId} />
      <DilutionRecipeCalculator projectId={projectId} />
      <MassDensityCalculator projectId={projectId} />
      <SolventVolumeCalculator projectId={projectId} />
      <TheoreticalYieldCalculator projectId={projectId} />
      <AcnWaterCalculator projectId={projectId} />
      <AdditiveCalculator projectId={projectId} />
      <LcmsDilutionCalculator projectId={projectId} />
      <HplcSolventCalculator projectId={projectId} />
      <PeakResolutionCalculator projectId={projectId} />
      <PipetteCalculator projectId={projectId} />
    </div>
  );
}

function DilutionRecipeCalculator({ projectId }: { projectId: string | null }) {
  const [mode, setMode] = useState<"fold" | "ratio" | "mixture">("fold");
  const [unit, setUnit] = useState<VolumeUnit>("uL");
  const [finalVolume, setFinalVolume] = useState(1000);
  const [foldFactor, setFoldFactor] = useState(10);
  const [ratioX, setRatioX] = useState(100);
  const [interpretation, setInterpretation] = useState<RatioDilutionInterpretation>("one_in_total");
  const [reagents, setReagents] = useState([
    { id: "a", name: "Substance A", stockConcentration: 10, targetConcentration: 1, concentrationUnit: "mM" as ConcentrationUnit },
    { id: "b", name: "Substance B", stockConcentration: 100, targetConcentration: 10, concentrationUnit: "uM" as ConcentrationUnit }
  ]);

  const result = useMemo(() => safe(() => {
    if (mode === "fold") return { kind: "fold" as const, ...calculateFoldDilutionRecipe(foldFactor, finalVolume, unit) };
    if (mode === "ratio") return { kind: "ratio" as const, ...calculateRatioDilutionRecipe(ratioX, finalVolume, unit, interpretation) };
    return { kind: "mixture" as const, ...calculateMultiSubstanceMixtureRecipe(finalVolume, unit, reagents) };
  }), [mode, foldFactor, finalVolume, unit, ratioX, interpretation, reagents]);

  const recipeText = useMemo(() => {
    if (!result.value) return result.error ?? "";
    const value = result.value;
    if (value.kind === "mixture") {
      return [
        ...value.rows.map((row) => `Add ${fmt(row.volumeToAdd)} ${value.unit} ${row.name}`),
        `Add ${fmt(value.diluentVolume)} ${value.unit} solvent/buffer`,
        `Final volume = ${fmt(value.finalVolume)} ${value.unit}`
      ].join("\n");
    }
    return `Add ${fmt(value.stockVolume)} ${value.unit} stock + ${fmt(value.diluentVolume)} ${value.unit} diluent to make ${fmt(value.finalVolume)} ${value.unit} final solution.`;
  }, [result]);
  const mixtureResult = result.value?.kind === "mixture" ? result.value : null;
  const ratioResult = result.value?.kind === "ratio" ? result.value : null;

  async function copyRecipe() {
    await navigator.clipboard.writeText(recipeText);
  }

  function updateReagent(id: string, key: "name" | "stockConcentration" | "targetConcentration" | "concentrationUnit", value: string | number) {
    setReagents((current) => current.map((reagent) => reagent.id === id ? { ...reagent, [key]: value } : reagent));
  }

  function addReagent() {
    setReagents((current) => [
      ...current,
      { id: crypto.randomUUID(), name: `Substance ${String.fromCharCode(65 + current.length)}`, stockConcentration: 10, targetConcentration: 1, concentrationUnit: "mM" as ConcentrationUnit }
    ]);
  }

  function removeReagent(id: string) {
    setReagents((current) => current.length > 1 ? current.filter((reagent) => reagent.id !== id) : current);
  }

  return (
    <section className="rounded-md border border-ink/10 bg-white p-5 shadow-sm lg:col-span-2">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Dilution Recipe Calculator</h2>
        <p className="mt-1 text-sm leading-6 text-ink/65">Turn dilution factors, ambiguous ratio notation, or multi-substance targets into exact pipetting recipes.</p>
      </div>

      <div className="grid gap-4">
        <div className="flex flex-wrap gap-2">
          {[
            ["fold", "Fold dilution"],
            ["ratio", "Ratio dilution"],
            ["mixture", "Multi-substance mixture"]
          ].map(([value, label]) => (
            <button key={value} type="button" onClick={() => setMode(value as typeof mode)} className={`rounded-md border px-3 py-2 text-sm font-semibold ${mode === value ? "border-ink bg-ink text-paper" : "border-ink/15 bg-white text-ink/70"}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_160px]">
          <InputWithUnit label="Final volume" value={finalVolume} onChange={setFinalVolume} unit={unit} min={0} />
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink/60">Volume unit</span>
            <select value={unit} onChange={(event) => setUnit(event.target.value as VolumeUnit)} className="rounded-md border border-ink/15 bg-white px-3 py-2 outline-none">
              <option value="uL">uL</option>
              <option value="mL">mL</option>
              <option value="L">L</option>
            </select>
          </label>
        </div>

        {mode === "fold" && (
          <InputWithUnit label="Fold dilution factor" value={foldFactor} onChange={setFoldFactor} unit="x" min={0} />
        )}

        {mode === "ratio" && (
          <div className="grid gap-3 md:grid-cols-2">
            <InputWithUnit label="Ratio 1:X" value={ratioX} onChange={setRatioX} unit="X" min={0} />
            <label className="grid gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-ink/60">Interpretation</span>
              <select value={interpretation} onChange={(event) => setInterpretation(event.target.value as RatioDilutionInterpretation)} className="rounded-md border border-ink/15 bg-white px-3 py-2 outline-none">
                <option value="one_in_total">1 in X total</option>
                <option value="one_part_plus_x">1 part stock + X parts diluent</option>
              </select>
            </label>
          </div>
        )}

        {mode === "mixture" && (
          <div className="grid gap-3">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-separate border-spacing-y-2 text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-ink/55">
                    <th className="px-2">Substance</th>
                    <th className="px-2">Stock concentration</th>
                    <th className="px-2">Target concentration</th>
                    <th className="px-2">Unit</th>
                    <th className="px-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reagents.map((reagent) => (
                    <tr key={reagent.id}>
                      <td className="px-2"><input value={reagent.name} onChange={(event) => updateReagent(reagent.id, "name", event.target.value)} className="w-full rounded-md border border-ink/15 px-3 py-2" /></td>
                      <td className="px-2"><input type="number" value={reagent.stockConcentration} onChange={(event) => updateReagent(reagent.id, "stockConcentration", Number(event.target.value))} className="w-full rounded-md border border-ink/15 px-3 py-2" /></td>
                      <td className="px-2"><input type="number" value={reagent.targetConcentration} onChange={(event) => updateReagent(reagent.id, "targetConcentration", Number(event.target.value))} className="w-full rounded-md border border-ink/15 px-3 py-2" /></td>
                      <td className="px-2">
                        <select value={reagent.concentrationUnit} onChange={(event) => updateReagent(reagent.id, "concentrationUnit", event.target.value as ConcentrationUnit)} className="w-full rounded-md border border-ink/15 px-3 py-2">
                          <option value="M">M</option>
                          <option value="mM">mM</option>
                          <option value="uM">uM</option>
                          <option value="nM">nM</option>
                        </select>
                      </td>
                      <td className="px-2"><button type="button" onClick={() => removeReagent(reagent.id)} className="rounded-md border border-ink/15 px-3 py-2">Remove</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" onClick={addReagent} className="w-fit rounded-md border border-ink/15 bg-white px-3 py-2 text-sm font-semibold">Add substance</button>
          </div>
        )}

        <FormulaBox
          formula={mode === "fold" ? "stockVolume = finalVolume / foldFactor; diluentVolume = finalVolume - stockVolume" : mode === "ratio" ? "1 in X: stock = finalVolume / X; parts: stock = finalVolume / (X + 1)" : "volumeToAdd = targetConcentration x finalVolume / stockConcentration"}
          explanation="All volumes are converted internally to L and displayed in the selected unit. Concentrations in mixture mode are converted internally to M before calculation."
        />

        {mixtureResult && (
          <div className="overflow-x-auto rounded-md border border-ink/10">
            <table className="w-full min-w-[620px] text-sm">
              <thead className="bg-paper text-left text-xs uppercase tracking-wide text-ink/55">
                <tr>
                  <th className="p-3">Substance</th>
                  <th className="p-3">Stock concentration</th>
                  <th className="p-3">Target concentration</th>
                  <th className="p-3">Volume to add</th>
                </tr>
              </thead>
              <tbody>
                {mixtureResult.rows.map((row, index) => (
                  <tr key={`${row.name}-${index}`} className="border-t border-ink/10">
                    <td className="p-3">{row.name}</td>
                    <td className="p-3">{row.stockConcentration} {row.concentrationUnit}</td>
                    <td className="p-3">{row.targetConcentration} {row.concentrationUnit}</td>
                    <td className="p-3 font-semibold">{fmt(row.volumeToAdd)} {mixtureResult.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="rounded-md border border-moss/20 bg-mint/40 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-moss">Recipe</p>
              <p className="mt-2 whitespace-pre-wrap text-base font-semibold leading-7 text-ink">{recipeText}</p>
            </div>
            <button type="button" onClick={copyRecipe} className="rounded-md border border-ink/10 bg-white px-3 py-2 text-sm font-semibold">Copy recipe</button>
          </div>
          {ratioResult && <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">{ratioResult.warning}</p>}
          {mixtureResult?.warning && <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">{mixtureResult.warning}</p>}
          {result.error && <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{result.error}</p>}
        </div>

        <ResultBox invalid={Boolean(result.error)}
          projectId={projectId}
          calculatorType="dilution_recipe"
          formula={mode === "fold" ? "stockVolume = finalVolume / foldFactor" : mode === "ratio" ? "ratio dilution recipe" : "volumeToAdd = target x final / stock"}
          explanation="Deterministic dilution recipe generated from the selected mode."
          inputs={{ mode, unit, finalVolume, foldFactor, ratioX, interpretation, reagents }}
          result={recipeText}
          warning={ratioResult?.warning ?? mixtureResult?.warning ?? result.error}
        />
      </div>
    </section>
  );
}

function MolarityCalculator({ projectId }: { projectId: string | null }) {
  const [moles, setMoles] = useState(0.001);
  const [volumeL, setVolumeL] = useState(0.01);
  const result = useMemo(() => safe(() => calculateMolarity(moles, volumeL)), [moles, volumeL]);
  return (
    <CalculatorCard title="Molarity calculator" description="Calculate concentration from moles and solution volume.">
      <div className="grid gap-3">
        <InputWithUnit label="Moles" value={moles} onChange={setMoles} unit="mol" min={0} />
        <InputWithUnit label="Volume" value={volumeL} onChange={setVolumeL} unit="L" min={0} />
        <FormulaBox formula="M = mol / L" explanation="Molarity is amount of substance divided by final solution volume." />
        <ResultBox invalid={Boolean(result.error)} projectId={projectId} calculatorType="molarity" formula="M = mol / L" inputs={{ moles, volumeL }} result={result.value !== undefined ? `${fmt(result.value)} M` : result.error ?? ""} warning={result.error} />
      </div>
    </CalculatorCard>
  );
}

function DilutionCalculator({ projectId }: { projectId: string | null }) {
  const [c1, setC1] = useState(10);
  const [c2, setC2] = useState(1);
  const [v2, setV2] = useState(100);
  const [c1Unit, setC1Unit] = useState<ConcentrationUnit>("mM");
  const [c2Unit, setC2Unit] = useState<ConcentrationUnit>("mM");
  const [volumeUnit, setVolumeUnit] = useState<VolumeUnit>("mL");
  const result = useMemo(() => safe(() => {
    const c1M = convertConcentrationToM(c1, c1Unit);
    const c2M = convertConcentrationToM(c2, c2Unit);
    const v2L = convertVolumeToL(v2, volumeUnit);
    const v1L = calculateDilutionVolume(c1M, c2M, v2L);
    return convertVolumeFromL(v1L, volumeUnit);
  }), [c1, c1Unit, c2, c2Unit, v2, volumeUnit]);
  return (
    <CalculatorCard title="Dilution calculator" description="Calculate stock volume needed for a target dilution.">
      <div className="grid gap-3">
        <NumberWithUnitSelect label="Stock concentration C1" value={c1} onChange={setC1} unit={c1Unit} onUnitChange={(unit) => setC1Unit(unit as ConcentrationUnit)} units={["M", "mM", "uM", "nM"]} />
        <NumberWithUnitSelect label="Target concentration C2" value={c2} onChange={setC2} unit={c2Unit} onUnitChange={(unit) => setC2Unit(unit as ConcentrationUnit)} units={["M", "mM", "uM", "nM"]} />
        <NumberWithUnitSelect label="Final volume V2" value={v2} onChange={setV2} unit={volumeUnit} onUnitChange={(unit) => setVolumeUnit(unit as VolumeUnit)} units={["uL", "mL", "L"]} />
        <FormulaBox formula="V1 = (C2 x V2) / C1" explanation="C1 and C2 are converted internally to M. V2 is converted internally to L, then the stock volume is displayed in your selected volume unit." />
        <ResultBox invalid={Boolean(result.error)} projectId={projectId} calculatorType="dilution" formula="V1 = (C2 x V2) / C1" inputs={{ C1: c1, C1Unit: c1Unit, C2: c2, C2Unit: c2Unit, V2: v2, volumeUnit }} result={result.value !== undefined ? `${fmt(result.value)} ${volumeUnit} stock` : result.error ?? ""} warning={result.error} />
      </div>
    </CalculatorCard>
  );
}

function NumberWithUnitSelect({
  label,
  value,
  onChange,
  unit,
  onUnitChange,
  units
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  unit: string;
  onUnitChange: (unit: string) => void;
  units: string[];
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-ink/60">{label}</span>
      <div className="flex overflow-hidden rounded-md border border-ink/15 bg-white">
        <input
          type="number"
          step="any"
          min={0}
          value={Number.isNaN(value) ? "" : value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="min-w-0 flex-1 px-3 py-2 outline-none"
        />
        <select
          value={unit}
          onChange={(event) => onUnitChange(event.target.value)}
          className="min-w-24 border-l border-ink/10 bg-paper px-3 py-2 text-sm font-semibold text-ink/65 outline-none"
        >
          {units.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      </div>
    </label>
  );
}

function MassDensityCalculator({ projectId }: { projectId: string | null }) {
  const [massG, setMassG] = useState(1);
  const [density, setDensity] = useState(0.95);
  const result = useMemo(() => safe(() => calculateVolumeFromMassAndDensity(massG, density)), [massG, density]);
  return (
    <CalculatorCard title="Density-to-volume calculator" description="Convert liquid reagent mass to volume when density is known.">
      <div className="grid gap-3">
        <InputWithUnit label="Mass" value={massG} onChange={setMassG} unit="g" min={0} />
        <InputWithUnit label="Density" value={density} onChange={setDensity} unit="g/mL" min={0} />
        <FormulaBox formula="volume = mass / density" explanation="If density is missing, do not calculate liquid volume. Confirm density and temperature/source." />
        <ResultBox invalid={Boolean(result.error)} projectId={projectId} calculatorType="volume_density" formula="volume = mass / density" inputs={{ massG, densityGPerMl: density }} result={result.value !== undefined ? `${fmt(result.value)} mL` : result.error ?? ""} warning={result.error} />
      </div>
    </CalculatorCard>
  );
}

function SolventVolumeCalculator({ projectId }: { projectId: string | null }) {
  const [moles, setMoles] = useState(0.000085);
  const [targetM, setTargetM] = useState(0.1333);
  const result = useMemo(() => safe(() => calculateSolventVolumeForTargetConcentration(moles, targetM)), [moles, targetM]);
  const volumeUl = result.value !== undefined ? result.value * 1_000_000 : 0;
  return (
    <CalculatorCard title="Solvent volume for target concentration" description="Calculate solvent volume from moles and target molarity.">
      <div className="grid gap-3">
        <InputWithUnit label="Amount" value={moles} onChange={setMoles} unit="mol" min={0} />
        <InputWithUnit label="Target concentration" value={targetM} onChange={setTargetM} unit="M" min={0} />
        <FormulaBox formula="volume L = moles / target M" explanation="Example: 85 umol / 0.1333 M = 0.6377 mL = 637.7 uL." />
        <ResultBox invalid={Boolean(result.error)} projectId={projectId} calculatorType="solvent_volume_for_target_concentration" formula="volume L = moles / target M" inputs={{ moles, targetConcentrationM: targetM }} result={result.value !== undefined ? `${fmt(result.value * 1000)} mL (${fmt(volumeUl)} uL)` : result.error ?? ""} warning={result.error ?? pipetteWarning(volumeUl)} />
      </div>
    </CalculatorCard>
  );
}

function TheoreticalYieldCalculator({ projectId }: { projectId: string | null }) {
  const [moles, setMoles] = useState(0.001);
  const [mw, setMw] = useState(250);
  const [stoichiometry, setStoichiometry] = useState<number | null>(null);
  const result = useMemo(() => safe(() => { if (stoichiometry === null || !Number.isFinite(stoichiometry) || stoichiometry <= 0) throw new Error("Enter the confirmed product moles per mole of limiting reagent."); return calculateTheoreticalYield(moles * stoichiometry, mw); }), [moles, mw, stoichiometry]);
  return (
    <CalculatorCard title="Theoretical yield calculator" description="Calculate expected product mass from limiting moles and product MW.">
      <div className="grid gap-3">
        <InputWithUnit label="Limiting reagent amount" value={moles} onChange={setMoles} unit="mol" min={0} />
        <InputWithUnit label="Product molecular weight" value={mw} onChange={setMw} unit="g/mol" min={0} />
        <label className="grid gap-1 text-sm">Confirmed product mol per limiting reagent mol<input type="number" min="0" step="any" value={stoichiometry ?? ""} onChange={event => setStoichiometry(event.target.value ? Number(event.target.value) : null)} className="rounded border border-ink/15 p-2" /></label><FormulaBox formula="theoretical mass = limiting mol x product stoichiometry x product MW" explanation="Stoichiometry must be supplied; no 1:1 relationship is assumed." />
        <ResultBox invalid={Boolean(result.error)} projectId={projectId} calculatorType="theoretical_yield" formula="theoretical mass = limiting mol x product stoichiometry x product MW" inputs={{ limitingMoles: moles, productMW: mw, stoichiometry }} result={result.value !== undefined ? `${fmt(result.value)} g (${fmt(convertMolToUmol(moles * (stoichiometry ?? 0)))} umol product)` : result.error ?? ""} warning={result.error} />
      </div>
    </CalculatorCard>
  );
}

function AcnWaterCalculator({ projectId }: { projectId: string | null }) {
  const [total, setTotal] = useState(1000);
  const [acn, setAcn] = useState(70);
  const result = useMemo(() => safe(() => calculateAcnWaterVolumes(total, acn)), [total, acn]);
  return (
    <CalculatorCard title="ACN:H2O mixture calculator" description="Prepare acetonitrile/water mobile phase by percent ACN.">
      <div className="grid gap-3">
        <InputWithUnit label="Total volume" value={total} onChange={setTotal} unit="mL" min={0} />
        <InputWithUnit label="ACN percentage" value={acn} onChange={setAcn} unit="%" min={0} />
        <FormulaBox formula="ACN mL = total mL x ACN%" explanation="Water is the remaining volume. Confirm whether additives are added before or after q.s. to final volume." />
        <ResultBox invalid={Boolean(result.error)} projectId={projectId} calculatorType="acn_water" formula="ACN mL = total mL x ACN%" inputs={{ totalVolumeMl: total, acnPercent: acn }} result={result.value !== undefined ? `${fmt(result.value.acnMl)} mL ACN + ${fmt(result.value.waterMl)} mL H2O` : result.error ?? ""} warning={result.error} />
      </div>
    </CalculatorCard>
  );
}

function AdditiveCalculator({ projectId }: { projectId: string | null }) {
  const [total, setTotal] = useState(1000);
  const [percent, setPercent] = useState(0.1);
  const result = useMemo(() => safe(() => calculateAdditiveVolume(total, percent)), [total, percent]);
  return (
    <CalculatorCard title="Mobile phase additive calculator" description="Calculate formic acid/TFA v/v additive volume.">
      <div className="grid gap-3">
        <InputWithUnit label="Total volume" value={total} onChange={setTotal} unit="mL" min={0} />
        <InputWithUnit label="Additive" value={percent} onChange={setPercent} unit="% v/v" min={0} />
        <FormulaBox formula="additive mL = total mL x (% / 100)" explanation="For 0.1% v/v in 1000 mL, add 1.0 mL additive. Confirm SOP and safety controls." />
        <ResultBox invalid={Boolean(result.error)} projectId={projectId} calculatorType="additive_vv" formula="additive mL = total mL x (% / 100)" inputs={{ totalVolumeMl: total, additivePercentVv: percent }} result={result.value !== undefined ? `${fmt(result.value)} mL additive` : result.error ?? ""} warning={result.error} />
      </div>
    </CalculatorCard>
  );
}

function LcmsDilutionCalculator({ projectId }: { projectId: string | null }) {
  const [sample, setSample] = useState(10);
  const [solvent, setSolvent] = useState(990);
  const result = useMemo(() => safe(() => calculateLcmsDilution(sample, solvent)), [sample, solvent]);
  return (
    <CalculatorCard title="LCMS sample dilution calculator" description="Calculate final volume and dilution factor.">
      <div className="grid gap-3">
        <InputWithUnit label="Sample volume" value={sample} onChange={setSample} unit="uL" min={0} />
        <InputWithUnit label="Solvent volume" value={solvent} onChange={setSolvent} unit="uL" min={0} />
        <FormulaBox formula="dilution factor = final volume / sample volume" explanation="Use LCMS-compatible solvent and confirm concentration range with the method." />
        <ResultBox invalid={Boolean(result.error)} projectId={projectId} calculatorType="lcms_dilution" formula="dilution factor = final volume / sample volume" inputs={{ sampleVolumeUl: sample, solventVolumeUl: solvent }} result={result.value !== undefined ? `${fmt(result.value.dilutionFactor)}x dilution, final ${fmt(result.value.finalVolumeUl)} uL` : result.error ?? ""} warning={result.error ?? pipetteWarning(sample)} />
      </div>
    </CalculatorCard>
  );
}

function HplcSolventCalculator({ projectId }: { projectId: string | null }) {
  const [flow, setFlow] = useState(0.4);
  const [time, setTime] = useState(15);
  const [runs, setRuns] = useState(20);
  const [extra, setExtra] = useState(20);
  const result = useMemo(() => safe(() => calculateMobilePhaseConsumption(flow, time, runs, extra)), [flow, time, runs, extra]);
  const warning = result.value && result.value.totalWithExtraMl > 1000 ? "High solvent consumption. Prepare extra solvent and confirm with instrument SOP." : result.error;
  return (
    <CalculatorCard title="HPLC run solvent consumption calculator" description="Estimate mobile phase volume needed for a sequence.">
      <div className="grid gap-3">
        <InputWithUnit label="Flow rate" value={flow} onChange={setFlow} unit="mL/min" min={0} />
        <InputWithUnit label="Run time" value={time} onChange={setTime} unit="min" min={0} />
        <InputWithUnit label="Number of runs" value={runs} onChange={setRuns} unit="runs" min={0} />
        <InputWithUnit label="Extra solvent" value={extra} onChange={setExtra} unit="%" min={0} />
        <FormulaBox formula="total = flow x time x runs x (1 + extra%)" explanation="Include priming, equilibration, blanks, and SOP requirements separately if needed." />
        <ResultBox invalid={Boolean(result.error)} projectId={projectId} calculatorType="hplc_solvent_consumption" formula="total = flow x time x runs x (1 + extra%)" inputs={{ flowRateMlMin: flow, runTimeMin: time, numberOfRuns: runs, extraPercent: extra }} result={result.value !== undefined ? `${fmt(result.value.totalWithExtraMl)} mL total (${fmt(result.value.baseMl)} mL base)` : result.error ?? ""} warning={warning} />
      </div>
    </CalculatorCard>
  );
}

function PeakResolutionCalculator({ projectId }: { projectId: string | null }) {
  const [rt1, setRt1] = useState(2);
  const [rt2, setRt2] = useState(2.5);
  const [w1, setW1] = useState(0.1);
  const [w2, setW2] = useState(0.1);
  const result = useMemo(() => safe(() => calculatePeakResolution(rt1, rt2, w1, w2)), [rt1, rt2, w1, w2]);
  return (
    <CalculatorCard title="Peak resolution calculator" description="Estimate chromatographic separation between two peaks.">
      <div className="grid gap-3">
        <InputWithUnit label="Retention time 1" value={rt1} onChange={setRt1} unit="min" min={0} />
        <InputWithUnit label="Retention time 2" value={rt2} onChange={setRt2} unit="min" min={0} />
        <InputWithUnit label="Peak width 1" value={w1} onChange={setW1} unit="min" min={0} />
        <InputWithUnit label="Peak width 2" value={w2} onChange={setW2} unit="min" min={0} />
        <FormulaBox formula="Rs = 2(rt2 - rt1) / (w1 + w2)" explanation="Use consistent width definition from your chromatogram/report." />
        <ResultBox invalid={Boolean(result.error)} projectId={projectId} calculatorType="peak_resolution" formula="Rs = 2(rt2 - rt1) / (w1 + w2)" inputs={{ rt1, rt2, width1: w1, width2: w2 }} result={result.value !== undefined ? `Rs = ${fmt(result.value)}` : result.error ?? ""} warning={result.error} />
      </div>
    </CalculatorCard>
  );
}

function PipetteCalculator({ projectId }: { projectId: string | null }) {
  const [volume, setVolume] = useState(637.7);
  const result = selectPipetteRange(volume);
  return (
    <CalculatorCard title="Pipette range selector" description="Choose a practical pipette range for a target volume.">
      <div className="grid gap-3">
        <InputWithUnit label="Volume" value={volume} onChange={setVolume} unit="uL" min={0} />
        <FormulaBox formula="range by uL: 0.5-10 P10, 10-20 P20, 20-200 P200, 200-1000 P1000" explanation="Below 0.5 uL is usually too small; above 1000 uL should use a larger-volume strategy." />
        <ResultBox invalid={result === "invalid volume"} projectId={projectId} calculatorType="pipette_range" formula="range by uL thresholds" inputs={{ volumeUl: volume }} result={result} warning={pipetteWarning(volume)} />
      </div>
    </CalculatorCard>
  );
}
