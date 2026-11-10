/**
 * Serverless Health Check Endpoint
 * GET /api/health
 */
export default async function handler(req: any, res: any) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, AccountKey');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const hasLtaKey = Boolean(
    process.env.LTA_DATAMALL_KEY ||
    process.env.LTA_ACCOUNT_KEY ||
    process.env.ACCOUNT_KEY
  );

  return res.status(200).json({
    status: 'ok',
    service: 'Singapore Carpark Lots Tracker Serverless API',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime ? process.uptime() : 0),
    ltaDatamallConfigured: hasLtaKey,
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      health: '/api/health',
      carparkAvailability: '/api/carparkavailability',
      ltaUpstream: 'https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2',
    },
  });
}
