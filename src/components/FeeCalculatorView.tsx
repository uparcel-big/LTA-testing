import React, { useState } from 'react';
import { Carpark, VehicleType } from '../types/carpark';
import { calculateParkingFee } from '../services/carparkService';
import { Calculator, ArrowRight, DollarSign, Clock, Car, Bike, Truck, Check, AlertCircle } from 'lucide-react';

interface FeeCalculatorViewProps {
  carparks: Carpark[];
  onSelectCarpark: (carpark: Carpark) => void;
}

export const FeeCalculatorView: React.FC<FeeCalculatorViewProps> = ({
  carparks,
  onSelectCarpark,
}) => {
  const [selectedIdA, setSelectedIdA] = useState<string>(carparks[0]?.id || '');
  const [selectedIdB, setSelectedIdB] = useState<string>(carparks[1]?.id || '');
  const [vehicleType, setVehicleType] = useState<VehicleType>('car');
  const [stayMins, setStayMins] = useState<number>(120); // default 2 hours
  const [isWeekend, setIsWeekend] = useState<boolean>(false);

  const carparkA = carparks.find((c) => c.id === selectedIdA) || carparks[0];
  const carparkB = carparks.find((c) => c.id === selectedIdB) || carparks[1];

  // Simulated Entry & Exit Dates
  const now = new Date();
  if (isWeekend) {
    // Force to Saturday
    now.setDate(now.getDate() + ((6 - now.getDay() + 7) % 7));
  }
  const exitDate = new Date(now.getTime() + stayMins * 60 * 1000);

  const feeA = carparkA ? calculateParkingFee(carparkA, vehicleType, now, exitDate) : null;
  const feeB = carparkB ? calculateParkingFee(carparkB, vehicleType, now, exitDate) : null;

  const diff = feeA && feeB ? Math.abs(feeA.totalFee - feeB.totalFee) : 0;
  const cheaperCarpark =
    feeA && feeB
      ? feeA.totalFee < feeB.totalFee
        ? carparkA
        : feeB.totalFee < feeA.totalFee
        ? carparkB
        : null
      : null;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center gap-2.5 text-rose-600 mb-1">
          <Calculator className="w-5 h-5" />
          <h2 className="text-lg font-bold text-slate-900">
            Singapore Parking Fee Calculator & Comparison
          </h2>
        </div>
        <p className="text-xs text-slate-500 max-w-2xl">
          Compare estimated parking costs across any two Singapore carparks. Accounts for official
          HDB standard & Central Area peak rates, shopping mall first-hour vs subsequent 15-minute
          blocks, grace periods, and night caps.
        </p>

        {/* Global Controls */}
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Vehicle Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
              Vehicle Type
            </label>
            <div className="flex items-center p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setVehicleType('car')}
                className={`flex-1 py-1 text-xs font-semibold rounded-md transition-colors ${
                  vehicleType === 'car' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                Car
              </button>
              <button
                type="button"
                onClick={() => setVehicleType('motorcycle')}
                className={`flex-1 py-1 text-xs font-semibold rounded-md transition-colors ${
                  vehicleType === 'motorcycle'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600'
                }`}
              >
                Motorcycle
              </button>
              <button
                type="button"
                onClick={() => setVehicleType('heavyVehicle')}
                className={`flex-1 py-1 text-xs font-semibold rounded-md transition-colors ${
                  vehicleType === 'heavyVehicle'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600'
                }`}
              >
                Heavy / Van
              </button>
            </div>
          </div>

          {/* Stay Duration Slider */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Stay Duration
              </label>
              <span className="font-mono font-bold text-xs text-slate-900">
                {stayMins} mins ({(stayMins / 60).toFixed(1)} hrs)
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="480"
              step="15"
              value={stayMins}
              onChange={(e) => setStayMins(parseInt(e.target.value))}
              className="w-full accent-rose-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
              <span>10m</span>
              <span>1 hr</span>
              <span>2 hrs</span>
              <span>4 hrs</span>
              <span>8 hrs</span>
            </div>
          </div>

          {/* Day of Week */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
              Day Mode
            </label>
            <div className="flex items-center p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setIsWeekend(false)}
                className={`flex-1 py-1 text-xs font-semibold rounded-md transition-colors ${
                  !isWeekend ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                Weekday
              </button>
              <button
                type="button"
                onClick={() => setIsWeekend(true)}
                className={`flex-1 py-1 text-xs font-semibold rounded-md transition-colors ${
                  isWeekend ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                Weekend / Sun
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Carpark A */}
        {carparkA && feeA && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Select Carpark A
              </label>
              <select
                value={selectedIdA}
                onChange={(e) => setSelectedIdA(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-900 cursor-pointer focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              >
                {carparks.map((c) => (
                  <option key={c.id} value={c.id}>
                    [{c.agency}] {c.name} ({c.area})
                  </option>
                ))}
              </select>
            </div>

            {/* Total Fee Big Box */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
              <span className="text-xs text-slate-500 font-medium">Estimated Parking Fee</span>
              <div className="font-mono text-3xl font-black text-slate-900 mt-1">
                S${feeA.totalFee.toFixed(2)}
              </div>
              {feeA.isGracePeriod && (
                <span className="inline-block mt-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  Free Grace Period ({carparkA.gracePeriodMins} mins)
                </span>
              )}
            </div>

            {/* Fee Breakdown */}
            <div className="space-y-1.5 text-xs text-slate-600">
              <span className="font-semibold text-slate-700 block">Pricing Calculation:</span>
              {feeA.rateBreakdown.map((line, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-slate-400"></span>
                  <span>{line}</span>
                </div>
              ))}
              <p className="text-[11px] text-slate-400 mt-1">{carparkA.pricing.notes}</p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Clearance: {carparkA.heightClearance ? `${carparkA.heightClearance}m` : 'Open'}
              </span>
              <button
                type="button"
                onClick={() => onSelectCarpark(carparkA)}
                className="text-rose-600 font-semibold hover:text-rose-700"
              >
                View Live Lots &rarr;
              </button>
            </div>
          </div>
        )}

        {/* Carpark B */}
        {carparkB && feeB && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Select Carpark B
              </label>
              <select
                value={selectedIdB}
                onChange={(e) => setSelectedIdB(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-900 cursor-pointer focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              >
                {carparks.map((c) => (
                  <option key={c.id} value={c.id}>
                    [{c.agency}] {c.name} ({c.area})
                  </option>
                ))}
              </select>
            </div>

            {/* Total Fee Big Box */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
              <span className="text-xs text-slate-500 font-medium">Estimated Parking Fee</span>
              <div className="font-mono text-3xl font-black text-slate-900 mt-1">
                S${feeB.totalFee.toFixed(2)}
              </div>
              {feeB.isGracePeriod && (
                <span className="inline-block mt-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  Free Grace Period ({carparkB.gracePeriodMins} mins)
                </span>
              )}
            </div>

            {/* Fee Breakdown */}
            <div className="space-y-1.5 text-xs text-slate-600">
              <span className="font-semibold text-slate-700 block">Pricing Calculation:</span>
              {feeB.rateBreakdown.map((line, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-slate-400"></span>
                  <span>{line}</span>
                </div>
              ))}
              <p className="text-[11px] text-slate-400 mt-1">{carparkB.pricing.notes}</p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Clearance: {carparkB.heightClearance ? `${carparkB.heightClearance}m` : 'Open'}
              </span>
              <button
                type="button"
                onClick={() => onSelectCarpark(carparkB)}
                className="text-rose-600 font-semibold hover:text-rose-700"
              >
                View Live Lots &rarr;
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Comparison Verdict Banner */}
      {cheaperCarpark && diff > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <Check className="w-5 h-5 font-bold" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-emerald-900">
              {cheaperCarpark.name} is cheaper by S${diff.toFixed(2)}
            </h4>
            <p className="text-xs text-emerald-700 mt-0.5">
              For a {stayMins}-minute stay on a {isWeekend ? 'weekend' : 'weekday'}, choosing{' '}
              {cheaperCarpark.name} saves you money compared to the alternative.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
