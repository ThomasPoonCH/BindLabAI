import { convertUnits } from "./engine";

export function convertUlToMl(value: number) {
  return convertUnits(value, "uL", "mL").value;
}

export function convertMlToUl(value: number) {
  return convertUnits(value, "mL", "uL").value;
}

export function convertMgToG(value: number) {
  return convertUnits(value, "mg", "g").value;
}

export function convertGToMg(value: number) {
  return convertUnits(value, "g", "mg").value;
}

export function convertUmolToMol(value: number) {
  return convertUnits(value, "umol", "mol").value;
}

export function convertMmolToMol(value: number) {
  return convertUnits(value, "mmol", "mol").value;
}

export function convertMolToMmol(value: number) {
  return convertUnits(value, "mol", "mmol").value;
}

export function convertMolToUmol(value: number) {
  return convertUnits(value, "mol", "umol").value;
}

export function selectPipetteRange(volumeUl: number) {
  if (!Number.isFinite(volumeUl) || volumeUl <= 0) return "invalid volume";
  if (volumeUl < 0.5) return "too small; dilute stock or use a more suitable method";
  if (volumeUl <= 10) return "P10";
  if (volumeUl <= 20) return "P20";
  if (volumeUl <= 200) return "P200";
  if (volumeUl <= 1000) return "P1000";
  return "serological pipette / graduated pipette / split into multiple pipettings";
}
