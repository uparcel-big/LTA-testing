/**
 * Serverless Carpark Availability Endpoint
 * GET /api/carparkavailability
 * 
 * Fetches real-time carpark availability data across Singapore (HDB + LTA + URA)
 * from LTA DataMall API:
 * https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2
 * 
 * Authentication:
 * Requires AccountKey header provided via environment variable:
 * - LTA_DATAMALL_KEY (preferred)
 * - LTA_ACCOUNT_KEY (alias)
 * - ACCOUNT_KEY (alias)
 */

interface LTACarparkRecord {
  CarParkID: string;
  Area: string;
  Development: string;
  Location: string; // "lat lng" e.g. "1.2935 103.8572"
  AvailableLots: number;
  LotType: 'C' | 'H' | 'Y'; // C = Car, H = Heavy Vehicle, Y = Motorcycle
  Agency: 'HDB' | 'LTA' | 'URA' | string;
}

// In-memory cache to prevent excessive upstream calls (30-second TTL)
let cachedResponse: {
  timestamp: number;
  data: any;
} | null = null;
const CACHE_TTL_MS = 30000;

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, AccountKey');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed. Use GET.' });
  }

  // Retrieve AccountKey from environment variables (never hardcoded)
  const accountKey = (
    process.env.LTA_DATAMALL_KEY ||
    process.env.LTA_ACCOUNT_KEY ||
    process.env.ACCOUNT_KEY ||
    ''
  ).trim();

  // If no API key configured yet, return status and mock guidance
  if (!accountKey) {
    return res.status(200).json({
      status: 'pending_configuration',
      configured: false,
      message:
        'LTA DataMall AccountKey is not yet set in environment variables. Set LTA_DATAMALL_KEY in your .env or platform secrets.',
      endpoint: 'https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2',
      helpUrl: 'https://datamall.lta.gov.sg/content/datamall/en.html',
      totalRecords: 0,
      value: [],
      timestamp: new Date().toISOString(),
    });
  }

  // Check cache (unless client forces fresh with ?fresh=true or ?skip)
  const skip = req.query?.skip || req.query?.$skip || '0';
  const forceFresh = req.query?.fresh === 'true';
  const now = Date.now();

  if (!forceFresh && skip === '0' && cachedResponse && now - cachedResponse.timestamp < CACHE_TTL_MS) {
    res.setHeader('X-Cache', 'HIT');
    return res.status(200).json(cachedResponse.data);
  }

  try {
    const ltaEndpoint = new URL(
      'https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2'
    );
    if (skip && skip !== '0') {
      ltaEndpoint.searchParams.set('$skip', String(skip));
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const ltaResponse = await fetch(ltaEndpoint.toString(), {
      method: 'GET',
      headers: {
        AccountKey: accountKey,
        accept: 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!ltaResponse.ok) {
      const errorText = await ltaResponse.text();
      return res.status(ltaResponse.status).json({
        status: 'upstream_error',
        statusCode: ltaResponse.status,
        message: 'LTA DataMall API responded with an error',
        upstreamError: errorText,
        timestamp: new Date().toISOString(),
      });
    }

    const rawData = await ltaResponse.json();
    const records: LTACarparkRecord[] = rawData.value || [];

    // Optional query filters
    const agencyFilter = (req.query?.agency as string)?.toUpperCase();
    const lotTypeFilter = (req.query?.lotType as string)?.toUpperCase();
    const searchFilter = (req.query?.search as string)?.toLowerCase();

    let filteredRecords = records;
    if (agencyFilter) {
      filteredRecords = filteredRecords.filter((r) => r.Agency.toUpperCase() === agencyFilter);
    }
    if (lotTypeFilter) {
      filteredRecords = filteredRecords.filter((r) => r.LotType.toUpperCase() === lotTypeFilter);
    }
    if (searchFilter) {
      filteredRecords = filteredRecords.filter(
        (r) =>
          r.Development.toLowerCase().includes(searchFilter) ||
          r.CarParkID.toLowerCase().includes(searchFilter) ||
          r.Area.toLowerCase().includes(searchFilter)
      );
    }

    const responsePayload = {
      status: 'success',
      configured: true,
      timestamp: new Date().toISOString(),
      count: filteredRecords.length,
      totalUnfiltered: records.length,
      skip: parseInt(String(skip), 10),
      value: filteredRecords,
    };

    // Update cache if first page
    if (skip === '0') {
      cachedResponse = {
        timestamp: now,
        data: responsePayload,
      };
    }

    res.setHeader('X-Cache', 'MISS');
    res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
    return res.status(200).json(responsePayload);
  } catch (error: any) {
    const isTimeout = error.name === 'AbortError';
    return res.status(502).json({
      status: 'network_error',
      message: isTimeout
        ? 'Request to LTA DataMall timed out after 10 seconds'
        : (error?.message || 'Failed to connect to LTA DataMall service'),
      timestamp: new Date().toISOString(),
    });
  }
}
