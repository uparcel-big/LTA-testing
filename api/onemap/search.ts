/**
 * Serverless OneMap Search / Geocode Endpoint
 * GET /api/onemap/search
 * 
 * Proxies requests to:
 * https://www.onemap.gov.sg/api/common/elastic/search
 * 
 * Query Parameters:
 * - searchVal: string (e.g. "raffles place", postal code "038983", address)
 * - returnGeom: 'Y' | 'N' (default 'Y')
 * - getAddrDetails: 'Y' | 'N' (default 'Y')
 * - pageNum: number (default 1)
 * 
 * Authentication:
 * OneMap officially requires the Authorization header.
 * Token is retrieved automatically from environment variables / cache,
 * or forwarded from the incoming request Authorization header.
 */
import { getOrMintOneMapToken } from './client.ts';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const searchVal = (req.query?.searchVal || req.query?.q || '').toString().trim();
  if (!searchVal) {
    return res.status(400).json({
      error: 'Missing query parameter: searchVal',
      example: '/api/onemap/search?searchVal=raffles%20place',
    });
  }

  const returnGeom = (req.query?.returnGeom || 'Y').toString();
  const getAddrDetails = (req.query?.getAddrDetails || 'Y').toString();
  const pageNum = (req.query?.pageNum || '1').toString();

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
        'OneMap Authorization token is required. Set ONEMAP_EMAIL and ONEMAP_PASSWORD (or ONEMAP_TOKEN) in environment variables.',
      endpoint: 'https://www.onemap.gov.sg/api/common/elastic/search',
      helpUrl: 'https://www.onemap.gov.sg/apidocs/',
      results: [],
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const targetUrl = new URL('https://www.onemap.gov.sg/api/common/elastic/search');
    targetUrl.searchParams.set('searchVal', searchVal);
    targetUrl.searchParams.set('returnGeom', returnGeom);
    targetUrl.searchParams.set('getAddrDetails', getAddrDetails);
    targetUrl.searchParams.set('pageNum', pageNum);

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
      error: 'Failed to connect to OneMap search API',
      message: err?.message,
    });
  }
}
