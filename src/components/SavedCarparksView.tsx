import React from 'react';
import { Carpark, VehicleType } from '../types/carpark';
import { CarparkCard } from './CarparkCard';
import { Bookmark, Sparkles, Navigation } from 'lucide-react';

interface SavedCarparksViewProps {
  carparks: Carpark[];
  favoriteIds: string[];
  vehicleType: VehicleType;
  onSelectCarpark: (carpark: Carpark) => void;
  onToggleFavorite: (id: string) => void;
  onBrowseAll: () => void;
}

export const SavedCarparksView: React.FC<SavedCarparksViewProps> = ({
  carparks,
  favoriteIds,
  vehicleType,
  onSelectCarpark,
  onToggleFavorite,
  onBrowseAll,
}) => {
  const savedList = carparks.filter((cp) => favoriteIds.includes(cp.id));

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-500 mb-1">
            <Bookmark className="w-5 h-5 fill-amber-400" />
            <h2 className="text-lg font-bold text-slate-900">Your Saved Singapore Carparks</h2>
          </div>
          <p className="text-xs text-slate-500">
            Quickly monitor real-time lot availability for your frequently visited destinations,
            workplace, or residence.
          </p>
        </div>

        <div className="text-xs font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
          <span className="font-bold text-slate-900 font-mono">{savedList.length}</span> carparks saved
        </div>
      </div>

      {/* Saved Cards List */}
      {savedList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {savedList.map((cp) => (
            <CarparkCard
              key={cp.id}
              carpark={cp}
              vehicleType={vehicleType}
              isSelected={false}
              isFavorite={true}
              onSelect={onSelectCarpark}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Bookmark className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No saved carparks yet</h3>
          <p className="text-xs text-slate-500">
            Click the bookmark icon on any carpark card or map pin to pin your favourite locations
            here for quick tracking.
          </p>
          <button
            onClick={onBrowseAll}
            className="mt-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Browse All Carparks
          </button>
        </div>
      )}
    </div>
  );
};
