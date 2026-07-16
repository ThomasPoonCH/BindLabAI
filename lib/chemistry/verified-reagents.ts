export type VerificationStatus = "bindlab_verified" | "user_confirmed" | "external_verified";

export type VerifiedReagent = {
  id: string;
  canonicalName: string;
  synonyms: string[];
  abbreviations: string[];
  saltOrSolvateForm: string | null;
  molecularFormula: string | null;
  molecularWeight: number | null;
  density: number | null;
  physicalForm: "solid" | "liquid" | "stock_solution" | "gas" | "unknown";
  defaultUnit: "mass" | "volume" | "amount";
  source: string;
  verificationStatus: VerificationStatus;
  lastVerifiedDate: string;
};

// The numeric properties below are fixture-verified against ownJUL15.xlsx.
// Custom/internal compounds are intentionally excluded from the global library.
export const verifiedReagentLibrary: VerifiedReagent[] = [
  {
    id: "bindlab-hatu",
    canonicalName: "HATU",
    synonyms: ["O-(7-Azabenzotriazol-1-yl)-N,N,N',N'-tetramethyluronium hexafluorophosphate"],
    abbreviations: ["HATU"],
    saltOrSolvateForm: "hexafluorophosphate salt",
    molecularFormula: null,
    molecularWeight: 380.23,
    density: null,
    physicalForm: "solid",
    defaultUnit: "mass",
    source: "BindLab verified fixture: ownJUL15.xlsx",
    verificationStatus: "bindlab_verified",
    lastVerifiedDate: "2026-07-16",
  },
  {
    id: "bindlab-dipea",
    canonicalName: "N,N-Diisopropylethylamine",
    synonyms: ["Hünig's base", "Hunig's base", "N,N-diisopropylethylamine"],
    abbreviations: ["DIPEA"],
    saltOrSolvateForm: null,
    molecularFormula: null,
    molecularWeight: 129.24,
    density: 0.742,
    physicalForm: "liquid",
    defaultUnit: "volume",
    source: "BindLab verified fixture: ownJUL15.xlsx",
    verificationStatus: "bindlab_verified",
    lastVerifiedDate: "2026-07-16",
  },
  {
    id: "bindlab-methylamine-hydrochloride",
    canonicalName: "Methylamine hydrochloride",
    synonyms: ["methylamine HCl", "MeNH2 HCl", "MeNH2·HCl", "methanamine hydrochloride"],
    abbreviations: ["MeNH2·HCl"],
    saltOrSolvateForm: "hydrochloride salt",
    molecularFormula: null,
    molecularWeight: 67.52,
    density: null,
    physicalForm: "solid",
    defaultUnit: "mass",
    source: "BindLab verified fixture: ownJUL15.xlsx",
    verificationStatus: "bindlab_verified",
    lastVerifiedDate: "2026-07-16",
  },
  {
    id: "bindlab-methylamine-free-base",
    canonicalName: "Methylamine",
    synonyms: ["methanamine", "methylamine free base"],
    abbreviations: ["MeNH2"],
    saltOrSolvateForm: null,
    molecularFormula: "CH5N",
    molecularWeight: null,
    density: null,
    physicalForm: "unknown",
    defaultUnit: "amount",
    source: "BindLab identity record; physical properties not fixture-verified",
    verificationStatus: "bindlab_verified",
    lastVerifiedDate: "2026-07-16",
  },
  {
    id: "bindlab-dmf",
    canonicalName: "N,N-Dimethylformamide",
    synonyms: ["dimethylformamide", "N,N-dimethylformamide"],
    abbreviations: ["DMF"],
    saltOrSolvateForm: null,
    molecularFormula: null,
    molecularWeight: null,
    density: null,
    physicalForm: "liquid",
    defaultUnit: "volume",
    source: "BindLab verified fixture: ownJUL15.xlsx (identity and solvent role only)",
    verificationStatus: "bindlab_verified",
    lastVerifiedDate: "2026-07-16",
  },
];

export const normalizeChemicalName = (value: string) => value
  .toLowerCase()
  .normalize("NFKD")
  .replace(/[’']/g, "'")
  .replace(/[·•]/g, " ")
  .replace(/[^a-z0-9]+/g, " ")
  .trim()
  .replace(/\s+/g, " ");

export type ReagentResolution = {
  extractedName: string;
  record: VerifiedReagent | null;
  matchType: "canonical" | "alias" | "suggested" | "unresolved";
  confidence: number;
  requiresConfirmation: boolean;
  suggestions: VerifiedReagent[];
};

export function resolveVerifiedReagent(extractedName: string): ReagentResolution {
  const normalized = normalizeChemicalName(extractedName);
  const canonical = verifiedReagentLibrary.find((record) => normalizeChemicalName(record.canonicalName) === normalized);
  if (canonical) return { extractedName, record: canonical, matchType: "canonical", confidence: 1, requiresConfirmation: false, suggestions: [] };
  const alias = verifiedReagentLibrary.find((record) => [...record.synonyms, ...record.abbreviations].some((name) => normalizeChemicalName(name) === normalized));
  if (alias) return { extractedName, record: alias, matchType: "alias", confidence: 0.99, requiresConfirmation: false, suggestions: [] };
  const tokens = new Set(normalized.split(" ").filter((token) => token.length > 2));
  const suggestions = verifiedReagentLibrary.filter((record) => {
    const candidate = normalizeChemicalName([record.canonicalName, ...record.synonyms, ...record.abbreviations].join(" "));
    return [...tokens].some((token) => candidate.split(" ").includes(token));
  }).slice(0, 3);
  return { extractedName, record: null, matchType: suggestions.length ? "suggested" : "unresolved", confidence: 0, requiresConfirmation: true, suggestions };
}
