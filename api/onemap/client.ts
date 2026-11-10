/**
 * Shared OneMap API Client & Token Manager
 * Manages automatic token minting, in-memory caching (lasts 3 days),
 * and credential handling via environment variables.
 * 
 * Environment Variables (never hardcoded):
 * - ONEMAP_EMAIL: Registered email with OneMap
 * - ONEMAP_PASSWORD: Password for OneMap account
 * - ONEMAP_TOKEN: Direct access token (optional override)
 */

interface CachedToken {
  token: string;
  expiresAt: number; // epoch ms
}

let memoryToken: CachedToken | null = null;

export function getOneMapCredentials() {
  const email = (process.env.ONEMAP_EMAIL || '').trim();
  const password = (process.env.ONEMAP_PASSWORD || '').trim();
  const staticToken = (
    process.env.ONEMAP_TOKEN ||
    process.env.ONEMAP_API_KEY ||
    ''
  ).trim();

  return { email, password, staticToken };
}

/**
 * Returns a valid OneMap access token.
 * If ONEMAP_TOKEN is provided in env, uses that.
 * Otherwise, mints a token using ONEMAP_EMAIL and ONEMAP_PASSWORD
 * and caches it in memory until expiration (~3 days).
 */
export async function getOrMintOneMapToken(): Promise<{
  token: string | null;
  error?: string;
  source?: 'static_env' | 'cache' | 'minted';
}> {
  const { email, password, staticToken } = getOneMapCredentials();

  // If a static token is set in environment, use it directly
  if (staticToken) {
    return { token: staticToken, source: 'static_env' };
  }

  // Check valid in-memory cached token (leaving 5-minute safety margin)
  const now = Date.now();
  if (memoryToken && memoryToken.expiresAt > now + 5 * 60 * 1000) {
    return { token: memoryToken.token, source: 'cache' };
  }

  // If no email & password configured, cannot mint
  if (!email || !password) {
    return {
      token: null,
      error:
        'OneMap credentials not configured. Please set ONEMAP_EMAIL and ONEMAP_PASSWORD (or ONEMAP_TOKEN) in your environment variables.',
    };
  }

  try {
    const response = await fetch('https://www.onemap.gov.sg/api/auth/post/getToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return {
        token: null,
        error: `Failed to mint OneMap token (${response.status}): ${errText}`,
      };
    }

    const data = await response.json();
    const token = data.access_token || data.token;
    if (!token) {
      return {
        token: null,
        error: 'OneMap getToken response did not return an access_token',
      };
    }

    // Token lasts 3 days (approx 72 hours). Cache for 70 hours
    const ttlMs = 70 * 60 * 60 * 1000;
    memoryToken = {
      token,
      expiresAt: now + ttlMs,
    };

    return { token, source: 'minted' };
  } catch (err: any) {
    return {
      token: null,
      error: `Network error connecting to OneMap getToken: ${err?.message || err}`,
    };
  }
}
