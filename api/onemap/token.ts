/**
 * Serverless OneMap Token Endpoint
 * POST/GET /api/onemap/token
 * 
 * Mints an access token using OneMap Auth API:
 * https://www.onemap.gov.sg/api/auth/post/getToken
 * 
 * Body (Optional): { "email": "...", "password": "..." }
 * If omitted in request body, uses ONEMAP_EMAIL and ONEMAP_PASSWORD from environment variables.
 * Tokens last 3 days (~72 hours).
 */
import { getOrMintOneMapToken, getOneMapCredentials } from './client.ts';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // If user passes custom credentials in POST body, mint directly with those
  if (req.method === 'POST' && req.body?.email && req.body?.password) {
    try {
      const response = await fetch('https://www.onemap.gov.sg/api/auth/post/getToken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: req.body.email,
          password: req.body.password,
        }),
      });

      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (err: any) {
      return res.status(502).json({
        error: 'Failed to reach OneMap getToken API',
        message: err?.message,
      });
    }
  }

  // Otherwise, use environment credentials and manage caching
  const creds = getOneMapCredentials();
  const hasEnvCredentials = Boolean(
    (creds.email && creds.password) || creds.staticToken
  );

  if (!hasEnvCredentials) {
    return res.status(200).json({
      status: 'pending_configuration',
      configured: false,
      message:
        'OneMap credentials not configured. Please set ONEMAP_EMAIL and ONEMAP_PASSWORD (or ONEMAP_TOKEN) in your environment variables.',
      endpoint: 'https://www.onemap.gov.sg/api/auth/post/getToken',
      helpUrl: 'https://www.onemap.gov.sg/apidocs/',
      timestamp: new Date().toISOString(),
    });
  }

  const result = await getOrMintOneMapToken();
  if (result.error || !result.token) {
    return res.status(502).json({
      status: 'error',
      message: result.error,
      timestamp: new Date().toISOString(),
    });
  }

  return res.status(200).json({
    status: 'success',
    access_token: result.token,
    source: result.source,
    validity: '3 days (72 hours)',
    timestamp: new Date().toISOString(),
  });
}
