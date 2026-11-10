import React from 'react';
import { Carpark, VehicleType } from '../types/carpark';
import { Navigation, Bookmark, Zap, Shield, Clock, ChevronRight, MapPin } from 'lucide-react';

interface CarparkCardProps {
  carpark: Carpark;
  vehicleType: VehicleType;
  isSelected: boolean;
  isFavorite: boolean;
  onSelect: (carpark: Carpark) => void;
  onToggleFavorite: (id: string) => void;
}

export const CarparkCard: React.FC<CarparkCardProps> = ({
  carpark,
  vehicleType,
  isSelected,
  isFavorite,
  onSelect,
  onToggleFavorite,
}) => {
  const lots = carpark.lots[vehicleType];
  const avail = lots.available;
  const total = lots.total;
  const pct = total > 0 ? Math.round((avail / total) * 100) : 0;

  // Status Styling
  let statusColor = 'text-emerald-600 bg-emerald-50 border-emerald-200';
  let barColor = 'bg-emerald-500';
  let statusText = 'Ample Lots';

  if (avail === 0) {
    statusColor = 'text-slate-600 bg-slate-100 border-slate-200';
    barColor = 'bg-slate-400';
    statusText = 'Full (0 Lots)';
  } else if (pct < 12 || avail < 15) {
    statusColor = 'text-rose-700 bg-rose-50 border-rose-200';
    barColor = 'bg-rose-500';
    statusText = 'Critical / Low';
  } else if (pct < 30 || avail < 50) {
    statusColor = 'text-amber-700 bg-amber-50 border-amber-200';
    barColor = 'bg-amber-500';
    statusText = 'Filling Fast';
  }

  const vehicleLabel =
    vehicleType === 'car' ? 'Car' : vehicleType === 'motorcycle' ? 'Motor' : 'Heavy / Van';

  return (
    <div
      onClick={() => onSelect(carpark)}
      className={`group relative bg-white rounded-xl border p-4 transition-all duration-150 cursor-pointer hover:shadow-md ${
        isSelected
          ? 'border-rose-500 ring-2 ring-rose-500/20 shadow-md'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Top Header: Code, Agency, Area & Favorite Button */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
            {carpark.carparkNo}
          </span>
          <span className="text-xs text-slate-500 font-medium">{carpark.agency}</span>
          <span className="text-xs text-slate-300" aria-hidden="true">
            ·
          </span>
          <span className="text-xs text-slate-500">{carpark.area}</span>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(carpark.id);
          }}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            isFavorite
              ? 'text-amber-500 bg-amber-50 hover:bg-amber-100'
              : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
          }`}
          title={isFavorite ? 'Remove from favorites' : 'Bookmark carpark'}
        >
          <Bookmark className={`w-4 h-4 ${isFavorite ? 'fill-amber-400' : ''}`} />
        </button>
      </div>

      {/* Carpark Name & Address */}
      <div className="mt-1.5">
        <h3 className="font-semibold text-slate-900 text-base group-hover:text-rose-600 transition-colors leading-snug">
          {carpark.name}
        </h3>
        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5 flex items-center gap-1">
          <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
          <span>{carpark.address}</span>
        </p>
      </div>

      {/* Real-Time Availability Block */}
      <div className="mt-3 bg-slate-50 rounded-lg p-2.5 border border-slate-100">
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono font-black text-2xl text-slate-900 tabular-nums">
              {avail}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              / {total} {vehicleLabel} lots available
            </span>
          </div>
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusColor}`}
          >
            {statusText}
          </span>
        </div>

        {/* Progress bar showing capacity */}
        <div className="mt-2 w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${barColor}`}
            style={{ width: `${Math.max(2, Math.min(100, 100 - carpark.occupancyRate))}%` }}
          />
        </div>
      </div>

      {/* Meta Specs Grid: Clearance, Grace, EV, Pricing */}
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
        {/* Clearance */}
        <div className="flex items-center gap-1.5 text-slate-600">
          <span className="text-slate-400 font-medium">Clearance:</span>
          <span className="font-mono font-semibold text-slate-800">
            {carpark.heightClearance ? `${carpark.heightClearance}m` : 'Surface (Open)'}
          </span>
        </div>

        {/* Grace Period */}
        <div className="flex items-center gap-1.5 text-slate-600">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{carpark.gracePeriodMins}m Grace</span>
        </div>

        {/* EV Chargers */}
        {carpark.evChargers ? (
          <div className="flex items-center gap-1.5 text-emerald-700">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-mono font-semibold">
              {carpark.evChargers.available} EV Lots
            </span>
          </div>
        ) : (
          <div className="text-slate-400">No EV charging</div>
        )}
      </div>

      {/* Rate and Navigation Footer */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="text-slate-600">
          <span className="font-medium">Weekday: </span>
          <span className="font-mono font-semibold text-slate-900">
            S${carpark.pricing.ratePerHalfHourWeekday.toFixed(2)}
          </span>
          <span className="text-slate-400"> / 30m</span>
        </div>

        <div className="flex items-center gap-2">
          {carpark.distanceKm !== undefined && (
            <span className="font-mono text-slate-500 font-medium">
              {carpark.distanceKm} km away
            </span>
          )}

          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${carpark.lat},${carpark.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors"
            title="Open in Google Maps navigation"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Map</span>
          </a>

          <button
            type="button"
            onClick={() => onSelect(carpark)}
            className="p-1 text-slate-400 hover:text-slate-600"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
