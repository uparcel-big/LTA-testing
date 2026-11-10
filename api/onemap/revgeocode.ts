/**
 * Serverless OneMap Reverse Geocode Endpoint
 * GET /api/onemap/revgeocode
 * 
 * Proxies requests to:
 * https://www.onemap.gov.sg/api/public/revgeocode
 * 
 * Query Parameters:
 * - location: "lat,lng" (e.g. "1.3,103.8")
 * - buffer: number in meters (default 40)
 * - addressType: 'All' | 'HDB' | 'Other' (default 'All')
 * - otherFeatures: 'Y' | 'N' (default 'N')
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

  const location = (req.query?.location || '').toString().trim();
  if (!location) {
    return res.status(400).json({
      error: 'Missing query parameter: location (format: lat,lng)',
      example: '/api/onemap/revgeocode?location=1.3,103.8&buffer=40&addressType=All',
    });
  }

  const buffer = (req.query?.buffer || '40').toString();
  const addressType = (req.query?.addressType || 'All').toString();
  const otherFeatures = (req.query?.otherFeatures || 'N').toString();

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
        'OneMap Authorization token is required for reverse geocoding. Set ONEMAP_EMAIL and ONEMAP_PASSWORD in environment variables.',
      endpoint: 'https://www.onemap.gov.sg/api/public/revgeocode',
      helpUrl: 'https://www.onemap.gov.sg/apidocs/',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const targetUrl = new URL('https://www.onemap.gov.sg/api/public/revgeocode');
    targetUrl.searchParams.set('location', location);
    targetUrl.searchParams.set('buffer', buffer);
    targetUrl.searchParams.set('addressType', addressType);
    targetUrl.searchParams.set('otherFeatures', otherFeatures);

    const upstreamRes = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: {
        Authorization: token,
        accept: 'application/json',
      },
    });

    const data = await upstreamRes.json();
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    return res.status(upstreamRes.status).json(data);
  } catch (err: any) {
    return res.status(502).json({
      error: 'Failed to connect to OneMap reverse geocode API',
      message: err?.message,
    });
  }
}
