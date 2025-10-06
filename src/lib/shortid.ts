// Generate short IDs similar to basek
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const LENGTH = 5;

export function generateShortId(): string {
  let result = '';
  const randomValues = new Uint8Array(LENGTH);
  crypto.getRandomValues(randomValues);

  for (let i = 0; i < LENGTH; i++) {
    result += ALPHABET[randomValues[i] % ALPHABET.length];
  }

  return result;
}

export async function generateUniqueShortId(db: D1Database): Promise<string> {
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const shortId = generateShortId();

    // Check if it already exists
    const existing = await db
      .prepare('SELECT id FROM runs WHERE short_id = ?')
      .bind(shortId)
      .first();

    if (!existing) {
      return shortId;
    }

    attempts++;
  }

  throw new Error('Failed to generate unique short ID');
}
