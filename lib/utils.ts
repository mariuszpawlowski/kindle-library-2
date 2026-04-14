/**
 * Returns the last word of an author name, lowercased, for sorting and letter extraction.
 * Shared by page.tsx sort logic and AlphabetBar availableLetters computation.
 */
export function getSurname(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts[parts.length - 1].toLowerCase();
}
