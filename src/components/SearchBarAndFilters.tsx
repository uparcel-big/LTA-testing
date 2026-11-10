import React from 'react';
import { Search, X, SlidersHorizontal, Car, Bike, Truck, Zap, Shield, ArrowUpDown } from 'lucide-react';
import { FilterOptions, VehicleType, CarparkAgency } from '../types/carpark';

interface SearchBarAndFiltersProps {
  filters: FilterOptions;
  onChangeFilters: (filters: FilterOptions) => void;
  totalCarparksCount: number;
  filteredCount: number;
  availableAreas: string[];
}

export const SearchBarAndFilters: React.FC<SearchBarAndFiltersProps> = ({
  filters,
  onChangeFilters,
  totalCarparksCount,
  filteredCount,
  availableAreas,
}) => {
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  const handleUpdate = (patch: Partial<FilterOptions>) => {
    onChangeFilters({ ...filters, ...patch });
  };

  const handleClearFilters = () => {
    onChangeFilters({
      searchQuery: '',
      vehicleType: filters.vehicleType,
      selectedArea: 'All',
      agencyFilter: 'all',
      availabilityFilter: 'all',
      hasEVOnly: false,
      minClearance: 0,
      freeParkingOnly: false,
      sortBy: 'availableLots',
    });
  };

  const hasActiveAdvancedFilters =
    filters.agencyFilter !== 'all' ||
    filters.availabilityFilter !== 'all' ||
    filters.hasEVOnly ||
    filters.minClearance > 0 ||
    filters.freeParkingOnly;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3.5">
      {/* Top Row: Search Input & Vehicle Type Segmented Control */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => handleUpdate({ searchQuery: e.target.value })}
            placeholder="Search by carpark name, postal code (e.g. 038983), code (ACB), or street..."
            className="w-full pl-10 pr-9 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-sm text-slate-900 placeholder:text-slate-400 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
          />
          {filters.searchQuery && (
            <button
              onClick={() => handleUpdate({ searchQuery: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Vehicle Type Segmented Control (Cars, Motorbikes, Heavy Vehicles) */}
        <div className="flex items-center p-1 bg-slate-100 rounded-lg shrink-0">
          <button
            type="button"
            onClick={() => handleUpdate({ vehicleType: 'car' })}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap ${
              filters.vehicleType === 'car'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>Cars</span>
          </button>
          <button
            type="button"
            onClick={() => handleUpdate({ vehicleType: 'motorcycle' })}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap ${
              filters.vehicleType === 'motorcycle'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bike className="w-3.5 h-3.5" />
            <span>Motorcycles</span>
          </button>
          <button
            type="button"
            onClick={() => handleUpdate({ vehicleType: 'heavyVehicle' })}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap ${
              filters.vehicleType === 'heavyVehicle'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Heavy & Vans</span>
          </button>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <select
              value={filters.sortBy}
              onChange={(e) => handleUpdate({ sortBy: e.target.value as any })}
              className="appearance-none pl-8 pr-7 py-2 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
            >
              <option value="availableLots">Lots: Most Available</option>
              <option value="distance">Distance: Nearest First</option>
              <option value="rate">Rate: Lowest Fee</option>
              <option value="name">Name: A to Z</option>
            </select>
            <ArrowUpDown className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
              showAdvanced || hasActiveAdvancedFilters
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
            {hasActiveAdvancedFilters && (
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
            )}
          </button>
        </div>
      </div>

      {/* Area Quick Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        <span className="text-[11px] font-medium text-slate-400 shrink-0 uppercase tracking-wider mr-1">
          Area:
        </span>
        <button
          type="button"
          onClick={() => handleUpdate({ selectedArea: 'All' })}
          className={`px-3 py-1 rounded-md whitespace-nowrap font-medium transition-colors cursor-pointer ${
            filters.selectedArea === 'All'
              ? 'bg-slate-900 text-white font-semibold'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
          }`}
        >
          All Areas ({totalCarparksCount})
        </button>
        {availableAreas.map((area) => (
          <button
            key={area}
            type="button"
            onClick={() => handleUpdate({ selectedArea: area })}
            className={`px-3 py-1 rounded-md whitespace-nowrap font-medium transition-colors cursor-pointer ${
              filters.selectedArea === area
                ? 'bg-slate-900 text-white font-semibold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            {area}
          </button>
        ))}
      </div>

      {/* Advanced Filter Drawer */}
      {showAdvanced && (
        <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {/* Agency Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Agency / Operator
            </label>
            <select
              value={filters.agencyFilter}
              onChange={(e) => handleUpdate({ agencyFilter: e.target.value })}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-slate-700"
            >
              <option value="all">All Operators</option>
              <option value="HDB">HDB Heartlands</option>
              <option value="Commercial">Shopping Malls & Commercial</option>
              <option value="URA">URA Carparks</option>
              <option value="Hospital">Hospitals & Medical Centres</option>
            </select>
          </div>

          {/* Availability Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Availability Level
            </label>
            <select
              value={filters.availabilityFilter}
              onChange={(e) => handleUpdate({ availabilityFilter: e.target.value as any })}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-slate-700"
            >
              <option value="all">All Carparks (Inc. Full)</option>
              <option value="availableOnly">Has Lots (&gt;0)</option>
              <option value="ample">Ample Only (&gt;30% available)</option>
              <option value="moderate">Moderate+ (&gt;10% available)</option>
            </select>
          </div>

          {/* Min Clearance Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Min Clearance Height
            </label>
            <select
              value={filters.minClearance}
              onChange={(e) => handleUpdate({ minClearance: parseFloat(e.target.value) })}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-slate-700"
            >
              <option value="0">Any Height</option>
              <option value="2.0">≥ 2.0m (Standard Vans)</option>
              <option value="2.15">≥ 2.15m (Hiace / Urvan)</option>
              <option value="2.5">≥ 2.5m (High Roof Delivery)</option>
              <option value="4.0">≥ 4.0m (Lorries / Surface)</option>
            </select>
          </div>

          {/* Toggles & Reset */}
          <div className="flex flex-col justify-end gap-1.5">
            <label className="flex items-center gap-2 cursor-pointer text-slate-700">
              <input
                type="checkbox"
                checked={filters.hasEVOnly}
                onChange={(e) => handleUpdate({ hasEVOnly: e.target.checked })}
                className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
              />
              <span className="flex items-center gap-1 font-medium">
                <Zap className="w-3 h-3 text-amber-500" />
                <span>EV Charging Available</span>
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-700">
              <input
                type="checkbox"
                checked={filters.freeParkingOnly}
                onChange={(e) => handleUpdate({ freeParkingOnly: e.target.checked })}
                className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
              />
              <span className="font-medium">Free Parking Scheme</span>
            </label>

            {hasActiveAdvancedFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-rose-600 hover:text-rose-700 text-left font-semibold text-[11px] mt-1"
              >
                Reset All Filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Results Summary Bar */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
        <div>
          Showing <span className="font-bold text-slate-900">{filteredCount}</span> of{' '}
          <span className="font-medium text-slate-700">{totalCarparksCount}</span> carparks in
          Singapore
        </div>
        {hasActiveAdvancedFilters && (
          <span className="text-[11px] text-amber-600 font-medium">Active filters applied</span>
        )}
      </div>
    </div>
  );
};
