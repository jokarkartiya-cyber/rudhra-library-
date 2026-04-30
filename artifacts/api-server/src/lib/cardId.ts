export function generateCardId(year: number, sequence: number): string {
  return `RL-${year}-${String(sequence).padStart(4, "0")}`;
}
