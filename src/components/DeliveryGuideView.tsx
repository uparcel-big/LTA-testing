import React, { useState } from 'react';
import { Carpark } from '../types/carpark';
import { Truck, ShieldCheck, Clock, AlertTriangle, MapPin, Search, Navigation } from 'lucide-react';

interface DeliveryGuideViewProps {
  carparks: Carpark[];
  onSelectCarpark: (carpark: Carpark) => void;
}

export const DeliveryGuideView: React.FC<DeliveryGuideViewProps> = ({
  carparks,
  onSelectCarpark,
}) => {
  const [postalSearch, setPostalSearch] = useState('');
  const [selectedClearance, setSelectedClearance] = useState<number>(2.15); // Default to Hiace standard

  const clearanceFiltered = carparks.filter((cp) => {
    const matchesClearance =
      selectedClearance === 0 ||
      cp.heightClearance === null ||
      cp.heightClearance >= selectedClearance;

    const matchesSearch =
      !postalSearch.trim() ||
      cp.postalCode.includes(postalSearch.trim()) ||
      cp.name.toLowerCase().includes(postalSearch.toLowerCase()) ||
      cp.address.toLowerCase().includes(postalSearch.toLowerCase());

    return matchesClearance && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-slate-900 text-white rounded-xl border border-slate-800 p-5 shadow-sm">
        <div className="flex items-center gap-2.5 text-rose-400 mb-1">
          <Truck className="w-5 h-5" />
          <h2 className="text-lg font-bold text-white">
            Singapore Courier & Delivery Driver Clearance Guide
          </h2>
        </div>
        <p className="text-xs text-slate-300 max-w-2xl">
          Quickly verify gantry height clearances, loading bay access, and grace periods across
          Singapore for commercial vans (Hiace, Urvan, NV200, NV350), 10ft/14ft lorries, and parcel
          drop-offs. Avoid expensive gantry collision damages and parking summonses.
        </p>

        {/* Quick Clearance Spec Cards */}
        <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Passenger Cars / SUVs
            </span>
            <div className="text-base font-bold text-white font-mono mt-0.5">&lt; 1.9m</div>
            <p className="text-[11px] text-slate-400 mt-1">Fits all MSCP & basements</p>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Standard Commercial Vans
            </span>
            <div className="text-base font-bold text-white font-mono mt-0.5">2.0m – 2.15m</div>
            <p className="text-[11px] text-slate-400 mt-1">Toyota Hiace, Nissan NV350</p>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              High-Roof / Luton Vans
            </span>
            <div className="text-base font-bold text-white font-mono mt-0.5">2.2m – 2.5m</div>
            <p className="text-[11px] text-slate-400 mt-1">Requires selected high MSCP</p>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              10ft / 14ft Box Lorries
            </span>
            <div className="text-base font-bold text-white font-mono mt-0.5">&gt; 3.0m</div>
            <p className="text-[11px] text-slate-400 mt-1">Surface open-air lots only</p>
          </div>
        </div>
      </div>

      {/* Filter and Clearance Matcher */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Postal Code / Street Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={postalSearch}
              onChange={(e) => setPostalSearch(e.target.value)}
              placeholder="Search delivery destination by 6-digit postal code or street..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          </div>

          {/* Height Requirement Selector */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg shrink-0">
            <span className="text-[11px] text-slate-500 font-semibold px-2 uppercase tracking-wider">
              Min Height:
            </span>
            <button
              onClick={() => setSelectedClearance(2.0)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                selectedClearance === 2.0 ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              ≥ 2.0m
            </button>
            <button
              onClick={() => setSelectedClearance(2.15)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                selectedClearance === 2.15
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600'
              }`}
            >
              ≥ 2.15m (Hiace)
            </button>
            <button
              onClick={() => setSelectedClearance(2.5)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                selectedClearance === 2.5 ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              ≥ 2.5m (Luton)
            </button>
            <button
              onClick={() => setSelectedClearance(4.0)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                selectedClearance === 4.0 ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              Surface Only
            </button>
          </div>
        </div>

        <div className="text-xs text-slate-500">
          Showing <span className="font-bold text-slate-900">{clearanceFiltered.length}</span>{' '}
          accessible delivery carparks meeting{' '}
          <span className="font-mono font-semibold text-slate-800">
            {selectedClearance === 4.0 ? 'Surface Open-Air' : `≥ ${selectedClearance}m`}
          </span>{' '}
          clearance.
        </div>
      </div>

      {/* Accessible Carpark Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clearanceFiltered.map((cp) => (
          <div
            key={cp.id}
            onClick={() => onSelectCarpark(cp)}
            className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                  {cp.carparkNo}
                </span>
                <span
                  className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full border ${
                    cp.heightClearance === null || cp.heightClearance >= 2.5
                      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                      : 'text-blue-700 bg-blue-50 border-blue-200'
                  }`}
                >
                  {cp.heightClearance ? `${cp.heightClearance}m Clearance` : 'Surface (No Limit)'}
                </span>
              </div>

              <h4 className="font-semibold text-slate-900 text-sm mt-2 leading-snug">{cp.name}</h4>
              <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{cp.address}</p>

              {/* Delivery Perks */}
              <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 block uppercase">Grace Period</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {cp.gracePeriodMins} mins free
                  </span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 block uppercase">Heavy Lots</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {cp.lots.heavyVehicle.available} avail
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2 flex items-center justify-between text-xs text-slate-600">
              <span className="font-mono text-slate-500">{cp.postalCode}</span>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${cp.lat},${cp.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-rose-600 font-semibold inline-flex items-center gap-1 hover:text-rose-700"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Navigate</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
