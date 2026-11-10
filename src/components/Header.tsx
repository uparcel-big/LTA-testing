import React from 'react';
import { RefreshCw, Car, Bike, Truck, Bookmark, Calculator, MapPin, Compass, Code2 } from 'lucide-react';
import { VehicleType } from '../types/carpark';

export type ActiveTab = 'tracker' | 'calculator' | 'delivery' | 'saved';

interface HeaderProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  vehicleType: VehicleType;
  onSelectVehicleType: (vt: VehicleType) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  lastUpdated: string;
  savedCount: number;
  onOpenApiModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  vehicleType,
  onSelectVehicleType,
  onRefresh,
  isRefreshing,
  lastUpdated,
  savedCount,
  onOpenApiModal,
}) => {
  const formattedTime = new Date(lastUpdated).toLocaleTimeString('en-SG', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-rose-600 flex items-center justify-center text-white font-black text-lg tracking-tighter shadow-sm">
              P
            </div>
            <div>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onSelectTab('tracker');
                }}
                className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap block leading-tight hover:text-rose-600 transition-colors"
              >
                SG ParkLive
              </a>
              <span className="text-[11px] text-slate-500 font-medium block">
                Singapore Real-Time Lots Tracker
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Links (4-5 single line text links) */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              onClick={() => onSelectTab('tracker')}
              className={`transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 cursor-pointer ${
                activeTab === 'tracker'
                  ? 'border-rose-600 text-rose-600 font-semibold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              Live Lots & Map
            </button>
            <button
              onClick={() => onSelectTab('calculator')}
              className={`transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 cursor-pointer ${
                activeTab === 'calculator'
                  ? 'border-rose-600 text-rose-600 font-semibold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              Fee Calculator
            </button>
            <button
              onClick={() => onSelectTab('delivery')}
              className={`transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 cursor-pointer ${
                activeTab === 'delivery'
                  ? 'border-rose-600 text-rose-600 font-semibold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              Delivery & Clearance
            </button>
            <button
              onClick={() => onSelectTab('saved')}
              className={`transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'saved'
                  ? 'border-rose-600 text-rose-600 font-semibold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              <span>Saved Lots</span>
              {savedCount > 0 && (
                <span className="text-[11px] font-mono px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded-full font-bold">
                  {savedCount}
                </span>
              )}
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action Area */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Live refresh trigger & timestamp */}
            <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
              <span>Live {formattedTime}</span>
            </div>

            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 cursor-pointer"
              title="Refresh live carpark availability lots"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-rose-600' : ''}`} />
            </button>

            <button
              onClick={onOpenApiModal}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200 whitespace-nowrap cursor-pointer"
            >
              <Code2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Backend API</span>
            </button>
          </div>
        </div>

        {/* Mobile secondary navigation strip */}
        <div className="md:hidden flex items-center justify-between py-2 border-t border-slate-100 overflow-x-auto gap-3 text-xs">
          <button
            onClick={() => onSelectTab('tracker')}
            className={`whitespace-nowrap px-2.5 py-1 rounded-md font-medium ${
              activeTab === 'tracker' ? 'bg-rose-50 text-rose-600 font-semibold' : 'text-slate-600'
            }`}
          >
            Live Lots
          </button>
          <button
            onClick={() => onSelectTab('calculator')}
            className={`whitespace-nowrap px-2.5 py-1 rounded-md font-medium ${
              activeTab === 'calculator' ? 'bg-rose-50 text-rose-600 font-semibold' : 'text-slate-600'
            }`}
          >
            Calculator
          </button>
          <button
            onClick={() => onSelectTab('delivery')}
            className={`whitespace-nowrap px-2.5 py-1 rounded-md font-medium ${
              activeTab === 'delivery' ? 'bg-rose-50 text-rose-600 font-semibold' : 'text-slate-600'
            }`}
          >
            Delivery & Clearance
          </button>
          <button
            onClick={() => onSelectTab('saved')}
            className={`whitespace-nowrap px-2.5 py-1 rounded-md font-medium ${
              activeTab === 'saved' ? 'bg-rose-50 text-rose-600 font-semibold' : 'text-slate-600'
            }`}
          >
            Saved ({savedCount})
          </button>
        </div>
      </div>
    </header>
  );
};
