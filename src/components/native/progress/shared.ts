/** A 0–100 value as the 0–1 fraction native progress views take */
export const progressFraction = (value = 0) => Math.max(0, Math.min(100, value)) / 100;
