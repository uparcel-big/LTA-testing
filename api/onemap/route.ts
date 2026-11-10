/**
 * Serverless OneMap Routing Endpoint
 * GET /api/onemap/route
 * 
 * Proxies requests to:
 * https://www.onemap.gov.sg/api/public/routingsvc/route
 * 
 * Query Parameters:
 * - start: "lat,lng" (e.g. "1.320981,103.844150")
 * - end: "lat,lng" (e.g. "1.326762,103.8559")
 * - routeType: 'walk' | 'drive' | 'cycle' | 'pt' (default: 'drive')
 * - date (optional for pt): YYYY-MM-DD
 * - time (optional for pt): HH:MM:SS
 * - mode (optional for pt): 'TRANSIT' | 'BUS' | 'RAIL'
 * 
 * Authentication:
 * Requires OneMap Authorization token (automatically managed from environment).
 */
import { getOrMintOneMapToken } from './client.ts';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const start = (req.query?.start || '').toString().trim();
  const end = (req.query?.end || '').toString().trim();
  const routeType = (req.query?.routeType || 'drive').toString().toLowerCase();

  if (!start || !end) {
    return res.status(400).json({
      error: 'Missing required query parameters: start and end (format: lat,lng)',
      example:
        '/api/onemap/route?start=1.320981,103.844150&end=1.326762,103.8559&routeType=drive',
      supportedRouteTypes: ['walk', 'drive', 'cycle', 'pt'],
    });
  }

  // Obtain Authorization token
  let token = (req.headers?.authorization || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    const tokenResult = await getOrMintOneMapToken();
    token = tokenResult.token || '';
  }

  if (!token) {
    return res.status(200).json({
      status: 'pending_configuration',
      configured: false,
      message:
        'OneMap Authorization token is required for routing. Set ONEMAP_EMAIL and ONEMAP_PASSWORD in environment variables.',
      endpoint: 'https://www.onemap.gov.sg/api/public/routingsvc/route',
      helpUrl: 'https://www.onemap.gov.sg/apidocs/',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const targetUrl = new URL('https://www.onemap.gov.sg/api/public/routingsvc/route');
    targetUrl.searchParams.set('start', start);
    targetUrl.searchParams.set('end', end);
    targetUrl.searchParams.set('routeType', routeType);

    if (req.query?.date) targetUrl.searchParams.set('date', req.query.date.toString());
    if (req.query?.time) targetUrl.searchParams.set('time', req.query.time.toString());
    if (req.query?.mode) targetUrl.searchParams.set('mode', req.query.mode.toString());

    const upstreamRes = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: {
        Authorization: token,
        accept: 'application/json',
      },
    });

    const data = await upstreamRes.json();
    res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
    return res.status(upstreamRes.status).json(data);
  } catch (err: any) {
    return res.status(502).json({
      error: 'Failed to connect to OneMap routing API',
      message: err?.message,
    });
  }
}
