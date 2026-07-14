export type CalculatorDefinition = {
  id: string;
  title: string;
  category: "General Chemistry" | "Organic Synthesis" | "LCMS / HPLC" | "Lab Practical Tools";
  description: string;
  keywords: string[];
};

export const calculatorDefinitions: CalculatorDefinition[] = [
  { id: "molarity", title: "Molarity calculator", category: "General Chemistry", description: "Calculate M from moles and volume.", keywords: ["molarity", "concentration", "moles", "volume"] },
  { id: "dilution", title: "Dilution calculator", category: "General Chemistry", description: "Use C1V1 = C2V2 for stock dilutions.", keywords: ["dilution", "stock", "c1v1", "buffer"] },
  { id: "dilution_recipe", title: "Dilution Recipe Calculator", category: "General Chemistry", description: "Create fold, ratio, and multi-substance dilution recipes.", keywords: ["dilution", "recipe", "fold", "ratio", "mixture"] },
  { id: "mass_mmol_mw", title: "Mass / mmol / MW calculator", category: "General Chemistry", description: "Convert between mass, moles, mmol, and molecular weight.", keywords: ["mass", "mmol", "mw", "molecular weight"] },
  { id: "volume_density", title: "Volume from mass and density calculator", category: "General Chemistry", description: "Convert liquid mass to volume using density.", keywords: ["density", "liquid", "volume", "mass"] },
  { id: "equivalents", title: "Equivalents calculator", category: "General Chemistry", description: "Calculate reagent equivalents vs limiting reagent.", keywords: ["equiv", "equivalent", "stoichiometry"] },
  { id: "stock_solution", title: "Stock solution preparation calculator", category: "General Chemistry", description: "Plan mass and final volume for stock solutions.", keywords: ["stock", "solution", "prepare"] },
  { id: "unit_converter", title: "Unit converter", category: "General Chemistry", description: "Convert uL, mL, mg, g, umol, mmol, and mol.", keywords: ["unit", "convert", "ul", "ml", "mg"] },
  { id: "limiting_reagent", title: "Limiting reagent calculator", category: "Organic Synthesis", description: "Find the reagent that limits reaction scale.", keywords: ["limiting", "reagent", "organic synthesis"] },
  { id: "reagent_equiv_table", title: "Reagent equivalents table", category: "Organic Synthesis", description: "Generate mmol, equiv, mass, and volume rows.", keywords: ["reagent", "table", "hatU", "dipea"] },
  { id: "theoretical_yield", title: "Theoretical yield calculator", category: "Organic Synthesis", description: "Calculate theoretical product mass.", keywords: ["yield", "product", "theoretical"] },
  { id: "percent_yield", title: "Percent yield calculator", category: "Organic Synthesis", description: "Compare actual mass with theoretical mass.", keywords: ["percent yield", "actual yield"] },
  { id: "density_to_volume", title: "Density-to-volume reagent calculator", category: "Organic Synthesis", description: "Calculate liquid reagent volume from mass and density.", keywords: ["density", "volume", "liquid reagent"] },
  { id: "reaction_concentration", title: "Reaction concentration / solvent volume calculator", category: "Organic Synthesis", description: "Find reaction concentration or solvent volume.", keywords: ["reaction concentration", "solvent volume", "target concentration"] },
  { id: "solvent_volume_for_target_concentration", title: "Solvent volume for target concentration", category: "Organic Synthesis", description: "Calculate solvent volume from moles and target molarity.", keywords: ["target concentration", "solvent volume", "molarity"] },
  { id: "acn_water", title: "ACN:H2O mixture calculator", category: "LCMS / HPLC", description: "Prepare acetonitrile/water mixtures by percent.", keywords: ["acn", "h2o", "water", "mobile phase"] },
  { id: "additive_vv", title: "Mobile phase additive calculator", category: "LCMS / HPLC", description: "Calculate 0.1% formic acid or TFA v/v additions.", keywords: ["formic acid", "tfa", "additive", "v/v"] },
  { id: "lcms_dilution", title: "LCMS sample dilution calculator", category: "LCMS / HPLC", description: "Calculate dilution factor and final concentration.", keywords: ["lcms", "dilution", "sample"] },
  { id: "hplc_solvent_consumption", title: "HPLC run solvent consumption calculator", category: "LCMS / HPLC", description: "Estimate solvent needed for sequences.", keywords: ["hplc", "solvent", "flow", "run"] },
  { id: "gradient_table", title: "Gradient table helper", category: "LCMS / HPLC", description: "Generate a simple LC gradient timeline.", keywords: ["gradient", "percent b", "hplc"] },
  { id: "peak_resolution", title: "Peak resolution calculator", category: "LCMS / HPLC", description: "Calculate chromatographic resolution.", keywords: ["peak", "resolution", "retention"] },
  { id: "retention_time_difference", title: "Retention time difference calculator", category: "LCMS / HPLC", description: "Compare two retention times.", keywords: ["retention time", "rt"] },
  { id: "pipette_range", title: "Pipette range selector", category: "Lab Practical Tools", description: "Pick P10, P20, P200, P1000, or larger-volume strategy.", keywords: ["pipette", "ul", "volume"] },
  { id: "serial_dilution", title: "Serial dilution calculator", category: "Lab Practical Tools", description: "Plan repeated dilution steps.", keywords: ["serial dilution", "dilution"] },
  { id: "sample_labeling", title: "Sample labeling helper", category: "Lab Practical Tools", description: "Create consistent sample labels.", keywords: ["label", "sample"] },
  { id: "notebook_insert", title: "Lab notebook calculation insert generator", category: "Lab Practical Tools", description: "Turn calculator output into notebook-ready text.", keywords: ["notebook", "insert", "calculation"] }
];

export function recommendCalculatorsFromText(text: string) {
  const normalized = text.toLowerCase();
  const ids = new Set<string>();

  if (/\b(lcms|hplc|acn|h2o|mobile phase|peak|retention time|formic acid|tfa)\b/.test(normalized)) {
    ["acn_water", "lcms_dilution", "hplc_solvent_consumption", "peak_resolution", "additive_vv"].forEach((id) => ids.add(id));
  }

  if (/\b(organic synthesis|hatu|dipea|dmf|mmol|mw|molecular weight|density|equiv|yield)\b/.test(normalized)) {
    ["mass_mmol_mw", "equivalents", "density_to_volume", "solvent_volume_for_target_concentration", "theoretical_yield"].forEach((id) => ids.add(id));
  }

  if (/\b(western blot|buffer|antibody|gel|protein)\b/.test(normalized)) {
    ["dilution", "stock_solution", "unit_converter", "pipette_range"].forEach((id) => ids.add(id));
  }

  if (ids.size === 0) {
    ["molarity", "dilution", "unit_converter", "pipette_range"].forEach((id) => ids.add(id));
  }

  return Array.from(ids)
    .map((id) => calculatorDefinitions.find((calculator) => calculator.id === id))
    .filter((calculator): calculator is CalculatorDefinition => Boolean(calculator));
}
