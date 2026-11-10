import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import healthHandler from './api/health.ts';
import carparkAvailabilityHandler from './api/carparkavailability.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// Serverless API Routes
app.all('/api/health', (req: Request, res: Response) => {
  return healthHandler(req, res);
});

app.all('/api/carparkavailability', (req: Request, res: Response) => {
  return carparkAvailabilityHandler(req, res);
});

// Alias to handle potential typo '/api/arparkavailability'
app.all('/api/arparkavailability', (req: Request, res: Response) => {
  return carparkAvailabilityHandler(req, res);
});

async function startServer() {
  if (!isProduction) {
    // Mount Vite dev server middleware in development
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static build assets in production
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
    console.log(`  - Health API: http://localhost:${PORT}/api/health`);
    console.log(`  - Carpark API: http://localhost:${PORT}/api/carparkavailability`);
  });
}

startServer();
