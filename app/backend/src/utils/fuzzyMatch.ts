/**
 * Normalise une chaîne pour la comparaison :
 * minuscules, sans accents, sans ponctuation, espaces compactés.
 */
export function normalize(str: string): string {
  return str
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Distance de Levenshtein classique (nombre d'éditions pour passer de a à b). */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[] = new Array(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;

  for (let i = 1; i <= m; i++) {
    let prevDiag = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      dp[j] =
        a[i - 1] === b[j - 1]
          ? prevDiag
          : 1 + Math.min(prevDiag, dp[j], dp[j - 1]);
      prevDiag = temp;
    }
  }
  return dp[n];
}

/** Score de similarité entre 0 (rien à voir) et 1 (identique), après normalisation. */
export function similarity(a: string, b: string): number {
  const normA = normalize(a);
  const normB = normalize(b);
  if (!normA || !normB) return 0;
  if (normA === normB) return 1;

  const distance = levenshtein(normA, normB);
  const maxLen = Math.max(normA.length, normB.length);
  return 1 - distance / maxLen;
}

const MATCH_THRESHOLD = 0.72;

/** Vrai si `guess` est une réponse acceptable pour `target` (titre ou artiste). */
export function isFuzzyMatch(guess: string, target: string): boolean {
  const normGuess = normalize(guess);
  const normTarget = normalize(target);
  if (!normGuess || !normTarget) return false;

  if (normGuess.length >= 3 && normTarget.includes(normGuess)) return true;

  return similarity(guess, target) >= MATCH_THRESHOLD;
}
