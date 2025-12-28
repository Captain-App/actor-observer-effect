/**
 * Splits text into words while preserving whitespace/non-word characters as much as possible
 * for UI rendering, but ensuring a stable word count that matches the timing data.
 * 
 * The timing data generation script should use this same logic.
 */
export function splitIntoWords(text: string): string[] {
  // We split by any whitespace but filter out empty strings to get the actual words.
  // This matches standard NLP/TTS word counting.
  return text.trim().split(/\s+/).filter(Boolean);
}

/**
 * Splits text into parts including the whitespace between words,
 * so we can render it exactly as it was while still knowing which parts are "words".
 */
export function splitIntoParts(text: string): string[] {
  return text.split(/(\s+)/);
}

