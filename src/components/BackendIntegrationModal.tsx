import React, { useState } from 'react';
import { X, Code2, Copy, Check, ExternalLink, Database, Server, Globe } from 'lucide-react';

interface BackendIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackendIntegrationModal: React.FC<BackendIntegrationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'lta' | 'hdb' | 'express'>('lta');
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const ltaSnippet = `// LTA DataMall CarParkAvailabilityv2 Integration
// Header required: AccountKey: <Your_LTA_DataMall_Key>
// Free registration at: https://datamall.lta.gov.sg/content/datamall/en.html

async function fetchLTACarparks() {
  const response = await fetch('https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2', {
    headers: {
      'AccountKey': process.env.LTA_DATAMALL_KEY || '',
      'accept': 'application/json'
    }
  });

  const data = await response.json();
  // Returns:
  // {
  //   "odata.metadata": "...",
  //   "value": [
  //     {
  //       "CarParkID": "1",
  //       "Area": "Marina",
  //       "Development": "Suntec City",
  //       "Location": "1.2935 103.8572", // [lat, lng]
  //       "AvailableLots": 642,
  //       "LotType": "C", // C = Cars, H = Heavy, Y = Motorcycle
  //       "Agency": "LTA"
  //     }
  //   ]
  // }
  return data.value;
}`;

  const hdbSnippet = `// data.gov.sg HDB Real-Time Carpark Availability API
// Free public endpoint, no authentication key required!

async function fetchHDBCarparkAvailability() {
  const response = await fetch('https://api.data.gov.sg/v1/transport/carpark-availability');
  const data = await response.json();

  // Returns:
  // {
  //   "items": [
  //     {
  //       "timestamp": "2026-11-10T11:35:00+08:00",
  //       "carpark_data": [
  //         {
  //           "carpark_number": "ACB",
  //           "update_datetime": "2026-11-10 11:34:45",
  //           "carpark_info": [
  //             {
  //               "total_lots": "490",
  //               "lot_type": "C",
  //               "lots_available": "142"
  //             }
  //           ]
  //         }
  //       ]
  //     }
  //   ]
  // }
  return data.items[0].carpark_data;
}`;

  const expressSnippet = `// server.ts - Proxy route for Singapore Carpark live availability
import express from 'express';

const app = express();

app.get('/api/carparks/live', async (req, res) => {
  try {
    const ltaRes = await fetch('https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2', {
      headers: { 'AccountKey': process.env.LTA_DATAMALL_KEY || '' }
    });
    const ltaData = await ltaRes.json();
    
    // Normalize and return to frontend
    res.json({ success: true, data: ltaData.value });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch carpark lots' });
  }
});`;

  const currentCode =
    activeTab === 'lta' ? ltaSnippet : activeTab === 'hdb' ? hdbSnippet : expressSnippet;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-2xl bg-slate-950 text-slate-100 rounded-2xl shadow-2xl border border-slate-800 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-600/20 text-rose-400 rounded-lg">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Backend Integration Architecture</h3>
              <p className="text-xs text-slate-400">
                Connect official Singapore government carpark APIs when ready
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-4 text-xs">
          <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs">
              <Database className="w-4 h-4" />
              <span>Ready for Backend Integration</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              This frontend has been built with clean model contracts in{' '}
              <code className="text-rose-400 font-mono">/src/services/carparkService.ts</code>. When
              you are ready to connect live government feeds, simply swap the simulated refresh with a
              call to your backend proxy or directly to the endpoints below.
            </p>
          </div>

          {/* Sub Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <button
              onClick={() => setActiveTab('lta')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                activeTab === 'lta'
                  ? 'bg-rose-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              LTA DataMall v2
            </button>
            <button
              onClick={() => setActiveTab('hdb')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                activeTab === 'hdb'
                  ? 'bg-rose-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              data.gov.sg HDB API
            </button>
            <button
              onClick={() => setActiveTab('express')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                activeTab === 'express'
                  ? 'bg-rose-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              Express Proxy Route
            </button>
          </div>

          {/* Code Viewer */}
          <div className="relative bg-slate-900 rounded-xl border border-slate-800 p-4 font-mono text-[11px] text-slate-200 overflow-x-auto max-h-72">
            <button
              onClick={handleCopy}
              className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-sans font-semibold border border-slate-700 transition-colors"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
            </button>
            <pre className="pr-16 text-emerald-400">{currentCode}</pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-900/50">
          <a
            href="https://datamall.lta.gov.sg/content/datamall/en.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5"
          >
            <span>Request free LTA DataMall API Key</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
