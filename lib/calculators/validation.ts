export function assertPositive(value: number, name: string) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive finite number`);
  }
}

export function assertNonNegative(value: number, name: string) {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${name} must be zero or a positive finite number`);
  }
}

export function pipetteWarning(volumeUl: number) {
  if (!Number.isFinite(volumeUl) || volumeUl <= 0) return "Enter a positive volume.";
  if (volumeUl < 0.5) return "Too small for normal pipetting. Consider dilution.";
  if (volumeUl > 1000) return "Above 1000 uL. Use a serological/graduated pipette or split into multiple pipettings.";
  return null;
}
