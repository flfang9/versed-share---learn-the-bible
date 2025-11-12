/**
 * Extracts verse number from a verse object, handling various property names.
 * Falls back to index-based numbering if no verse number is found.
 * 
 * @param {object} verse - The verse object (may have verse, number, or verseNumber property)
 * @param {number} [index] - Optional index for fallback (0-based, will return index + 1)
 * @returns {number|null} - The verse number, or null if no index provided and no number found
 * 
 * @example
 * getVerseNumber({ verse: 5 }) // => 5
 * getVerseNumber({ number: 10 }, 0) // => 10
 * getVerseNumber({}, 2) // => 3 (index + 1)
 * getVerseNumber({}) // => null (no index provided)
 */
export function getVerseNumber(verse, index) {
  if (verse?.verse != null) return verse.verse;
  if (verse?.number != null) return verse.number;
  if (verse?.verseNumber != null) return verse.verseNumber;
  if (index != null) return index + 1;
  return null;
}

