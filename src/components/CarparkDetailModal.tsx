import React, { useState } from 'react';
import { Carpark, VehicleType } from '../types/carpark';
import { calculateParkingFee } from '../services/carparkService';
import {
  X,
  Navigation,
  Bookmark,
  Zap,
  Shield,
  Clock,
  Car,
  Bike,
  Truck,
  MapPin,
  ExternalLink,
  Copy,
  Check,
  TrendingUp,
  AlertTriangle,
  Info,
  DollarSign,
  Code2,
} from 'lucide-react';

interface CarparkDetailModalProps {
  carpark: Carpark | null;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  initialVehicleType: VehicleType;
}

export const CarparkDetailModal: React.FC<CarparkDetailModalProps> = ({
  carpark,
  onClose,
  isFavorite,
  onToggleFavorite,
  initialVehicleType,
}) => {
  if (!carpark) return null;

  // Fee Calculator State
  const [calcVehicle, setCalcVehicle] = useState<VehicleType>(initialVehicleType);
  const [stayDurationMinutes, setStayDurationMinutes] = useState<number>(60); // default 1 hour
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [showDevSchema, setShowDevSchema] = useState(false);

  // Compute live fee
  const now = new Date();
  const exitTime = new Date(now.getTime() + stayDurationMinutes * 60 * 1000);
  const feeResult = calculateParkingFee(carpark, calcVehicle, now, exitTime);

  const handleCopyCoords = () => {
    navigator.clipboard.writeText(`${carpark.lat}, ${carpark.lng}`);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  const getClearanceStatus = (height: number | null) => {
    if (height === null) {
      return {
        label: 'Open Surface (No Height Limit)',
        color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
        note: 'All lorries, high vans & buses permitted',
      };
    }
    if (height >= 2.15) {
      return {
        label: `${height}m Clearance`,
        color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
        note: 'High roof delivery vans (Hiace / Urvan) permitted',
      };
    }
    if (height >= 2.0) {
      return {
        label: `${height}m Clearance`,
        color: 'text-amber-700 bg-amber-50 border-amber-200',
        note: 'Standard passenger cars & low delivery vans only',
      };
    }
    return {
      label: `${height}m Low Clearance`,
      color: 'text-rose-700 bg-rose-50 border-rose-200',
      note: 'Warning: strictly passenger cars only',
    };
  };

  const clearanceInfo = getClearanceStatus(carpark.heightClearance);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-3xl max-h-[92vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-start justify-between gap-4 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                {carpark.carparkNo}
              </span>
              <span className="text-xs text-slate-600 font-medium">{carpark.agency}</span>
              <span className="text-xs text-slate-300">·</span>
              <span className="text-xs text-slate-600">{carpark.area}</span>
              <span className="text-xs text-slate-300">·</span>
              <span className="text-xs text-slate-500 font-mono">Postal {carpark.postalCode}</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">{carpark.name}</h2>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{carpark.address}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onToggleFavorite(carpark.id)}
              className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                isFavorite
                  ? 'bg-amber-50 text-amber-500 border-amber-200'
                  : 'bg-white text-slate-400 hover:text-slate-600 border-slate-200'
              }`}
              title={isFavorite ? 'Remove from favorites' : 'Bookmark carpark'}
            >
              <Bookmark className={`w-4 h-4 ${isFavorite ? 'fill-amber-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* Section 1: Real-Time Availability Lot Breakdown */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Live Lot Availability
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                Updated {new Date(carpark.lastUpdated).toLocaleTimeString()}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Cars */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-1">
                  <Car className="w-3.5 h-3.5 text-slate-500" />
                  <span className="font-semibold">Cars</span>
                </div>
                <div className="font-mono text-2xl font-black text-slate-900 tabular-nums">
                  {carpark.lots.car.available}
                </div>
                <div className="text-[11px] text-slate-500">
                  of {carpark.lots.car.total} total lots
                </div>
                <div className="mt-2 w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500"
                    style={{
                      width: `${Math.round(
                        (carpark.lots.car.available / Math.max(1, carpark.lots.car.total)) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Motorcycles */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-1">
                  <Bike className="w-3.5 h-3.5 text-slate-500" />
                  <span className="font-semibold">Motorcycles</span>
                </div>
                <div className="font-mono text-2xl font-black text-slate-900 tabular-nums">
                  {carpark.lots.motorcycle.available}
                </div>
                <div className="text-[11px] text-slate-500">
                  of {carpark.lots.motorcycle.total} total lots
                </div>
                <div className="mt-2 w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500"
                    style={{
                      width: `${Math.round(
                        (carpark.lots.motorcycle.available /
                          Math.max(1, carpark.lots.motorcycle.total)) *
                          100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Heavy / Delivery Vans */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-1">
                  <Truck className="w-3.5 h-3.5 text-slate-500" />
                  <span className="font-semibold">Heavy & Vans</span>
                </div>
                <div className="font-mono text-2xl font-black text-slate-900 tabular-nums">
                  {carpark.lots.heavyVehicle.available}
                </div>
                <div className="text-[11px] text-slate-500">
                  of {carpark.lots.heavyVehicle.total} total lots
                </div>
                <div className="mt-2 w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500"
                    style={{
                      width: `${Math.round(
                        (carpark.lots.heavyVehicle.available /
                          Math.max(1, carpark.lots.heavyVehicle.total)) *
                          100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* EV Charging */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-1">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span className="font-semibold">EV Charging</span>
                </div>
                {carpark.evChargers ? (
                  <>
                    <div className="font-mono text-2xl font-black text-slate-900 tabular-nums">
                      {carpark.evChargers.available}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {carpark.evChargers.provider} ({carpark.evChargers.powerKw}kW)
                    </div>
                    <div className="mt-2 w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500"
                        style={{
                          width: `${Math.round(
                            (carpark.evChargers.available / carpark.evChargers.total) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-slate-400 mt-2">No EV chargers installed</div>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Height Clearance, Gantry & Rules */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Height Clearance */}
            <div className={`p-3.5 rounded-xl border ${clearanceInfo.color}`}>
              <div className="flex items-center gap-1.5 text-xs font-semibold mb-1">
                <Shield className="w-4 h-4" />
                <span>{clearanceInfo.label}</span>
              </div>
              <p className="text-xs opacity-90">{clearanceInfo.note}</p>
            </div>

            {/* Grace Period */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800">
              <div className="flex items-center gap-1.5 text-xs font-semibold mb-1">
                <Clock className="w-4 h-4 text-slate-600" />
                <span>{carpark.gracePeriodMins}-Minute Grace Period</span>
              </div>
              <p className="text-xs text-slate-500">
                Free entry & exit if duration is within {carpark.gracePeriodMins} minutes.
              </p>
            </div>

            {/* Free Parking Scheme */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800">
              <div className="flex items-center gap-1.5 text-xs font-semibold mb-1">
                <Info className="w-4 h-4 text-slate-600" />
                <span>Free Parking Scheme</span>
              </div>
              <p className="text-xs text-slate-500">{carpark.freeParking}</p>
            </div>
          </div>

          {/* Section 3: Today's Occupancy Pattern Curve */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-slate-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Hourly Occupancy Trend
                </h4>
              </div>
              <span className="text-[11px] text-slate-500">Peak hours: 12pm - 2pm & 6pm - 8pm</span>
            </div>

            {/* Occupancy Bar visualization */}
            <div className="flex items-end justify-between gap-1 h-28 pt-4">
              {carpark.hourlyTrends.map((trend) => {
                const isHigh = trend.occupancyPercent >= 85;
                const isMed = trend.occupancyPercent >= 65;
                const barBg = isHigh ? 'bg-rose-500' : isMed ? 'bg-amber-500' : 'bg-emerald-500';

                return (
                  <div
                    key={trend.hour}
                    className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group"
                  >
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono text-slate-700 whitespace-nowrap">
                      {trend.occupancyPercent}%
                    </div>
                    <div
                      className={`w-full max-w-[28px] rounded-t transition-all ${barBg}`}
                      style={{ height: `${trend.occupancyPercent}%` }}
                    />
                    <span className="text-[10px] font-mono text-slate-500">{trend.hour}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 4: Built-In Interactive Parking Fee Calculator */}
          <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <h4 className="text-sm font-bold">Live Parking Fee Calculator</h4>
              </div>
              <span className="text-xs text-slate-400">Singapore Electronic Parking System</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Controls */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 font-medium mb-1">
                    Vehicle Type
                  </label>
                  <div className="flex items-center p-1 bg-slate-800 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setCalcVehicle('car')}
                      className={`flex-1 py-1 text-xs font-semibold rounded-md transition-colors ${
                        calcVehicle === 'car'
                          ? 'bg-rose-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Car
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalcVehicle('motorcycle')}
                      className={`flex-1 py-1 text-xs font-semibold rounded-md transition-colors ${
                        calcVehicle === 'motorcycle'
                          ? 'bg-rose-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Motorcycle
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalcVehicle('heavyVehicle')}
                      className={`flex-1 py-1 text-xs font-semibold rounded-md transition-colors ${
                        calcVehicle === 'heavyVehicle'
                          ? 'bg-rose-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Heavy / Van
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 font-medium mb-1">
                    Stay Duration: <span className="font-bold text-white">{stayDurationMinutes} mins</span> (
                    {(stayDurationMinutes / 60).toFixed(1)} hrs)
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="480"
                    step="15"
                    value={stayDurationMinutes}
                    onChange={(e) => setStayDurationMinutes(parseInt(e.target.value))}
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                    <span>10m (Grace)</span>
                    <span>1 hr</span>
                    <span>2 hrs</span>
                    <span>4 hrs</span>
                    <span>8 hrs</span>
                  </div>
                </div>
              </div>

              {/* Calculated Result */}
              <div className="bg-slate-800/80 p-3.5 rounded-lg border border-slate-700/80 flex flex-col justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Estimated Total Parking Fee:</span>
                  <div className="font-mono text-3xl font-black text-emerald-400 mt-1">
                    S${feeResult.totalFee.toFixed(2)}
                  </div>
                  {feeResult.isGracePeriod && (
                    <span className="inline-block mt-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                      Within Free Grace Period
                    </span>
                  )}
                </div>

                <div className="mt-3 pt-2 border-t border-slate-700/60 text-xs text-slate-300 space-y-1">
                  {feeResult.rateBreakdown.map((line, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-slate-500"></span>
                      <span>{line}</span>
                    </div>
                  ))}
                  <p className="text-[11px] text-slate-400 mt-1 italic">{carpark.pricing.notes}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Direct Navigation Links */}
          <div className="border-t border-slate-200 pt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${carpark.lat},${carpark.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                <Navigation className="w-3.5 h-3.5 text-rose-400" />
                <span>Google Maps</span>
              </a>

              <a
                href={`https://waze.com/ul?ll=${carpark.lat},${carpark.lng}&navigate=yes`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Waze</span>
              </a>

              <button
                onClick={handleCopyCoords}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200 transition-colors border border-slate-200 cursor-pointer"
              >
                {copiedCoords ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCoords ? 'Copied' : 'GPS Coords'}</span>
              </button>
            </div>

            <button
              onClick={() => setShowDevSchema(!showDevSchema)}
              className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 underline underline-offset-2"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>{showDevSchema ? 'Hide API Data Schema' : 'View LTA API Data Schema'}</span>
            </button>
          </div>

          {/* Developer Backend Integration Schema Drawer */}
          {showDevSchema && (
            <div className="bg-slate-900 text-slate-200 p-3.5 rounded-lg text-xs font-mono border border-slate-800 space-y-2">
              <div className="text-slate-400 text-[11px]">
                // Singapore DataMall / data.gov.sg standard payload mapping:
              </div>
              <pre className="text-[11px] overflow-x-auto text-emerald-400">
{JSON.stringify(
  {
    CarParkID: carpark.carparkNo,
    Area: carpark.area,
    Development: carpark.name,
    Location: `${carpark.lat} ${carpark.lng}`,
    AvailableLots: carpark.lots.car.available,
    LotType: 'C',
    Agency: carpark.agency,
  },
  null,
  2
)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
