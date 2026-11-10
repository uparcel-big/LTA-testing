import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Carpark, FilterOptions, VehicleType } from './types/carpark';
import { carparkService } from './services/carparkService';
import { Header, ActiveTab } from './components/Header';
import { SearchBarAndFilters } from './components/SearchBarAndFilters';
import { CarparkMap } from './components/CarparkMap';
import { CarparkCard } from './components/CarparkCard';
import { CarparkDetailModal } from './components/CarparkDetailModal';
import { FeeCalculatorView } from './components/FeeCalculatorView';
import { DeliveryGuideView } from './components/DeliveryGuideView';
import { SavedCarparksView } from './components/SavedCarparksView';
import { BackendIntegrationModal } from './components/BackendIntegrationModal';
import {
  Map,
  List,
  Columns,
  RefreshCw,
  Compass,
  AlertCircle,
  Car,
  Bike,
  Truck,
  Zap,
  Clock,
  Shield,
  Layers,
} from 'lucide-react';

export default function App() {
  const [carparks, setCarparks] = useState<Carpark[]>(() => carparkService.getCarparks());
  const [activeTab, setActiveTab] = useState<ActiveTab>('tracker');
  const [selectedCarpark, setSelectedCarpark] = useState<Carpark | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toISOString());
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => carparkService.getFavorites());
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);

  // View Mode: 'split' (side-by-side on desktop), 'map', 'list'
  const [viewMode, setViewMode] = useState<'split' | 'map' | 'list'>('split');

  // Filter State
  const [filters, setFilters] = useState<FilterOptions>({
    searchQuery: '',
    vehicleType: 'car',
    selectedArea: 'All',
    agencyFilter: 'all',
    availabilityFilter: 'all',
    hasEVOnly: false,
    minClearance: 0,
    freeParkingOnly: false,
    sortBy: 'availableLots',
  });

  // Extract distinct areas
  const availableAreas = useMemo(() => {
    const areas = new Set(carparks.map((cp) => cp.area));
    return Array.from(areas).sort();
  }, [carparks]);

  // Compute filtered & sorted carparks
  const filteredCarparks = useMemo(() => {
    return carparkService.filterCarparks(
      carparks,
      filters,
      userLocation || undefined
    );
  }, [carparks, filters, userLocation]);

  // Total summary metrics
  const totalLotsForSelectedVehicle = useMemo(() => {
    return filteredCarparks.reduce(
      (acc, cp) => {
        acc.available += cp.lots[filters.vehicleType].available;
        acc.total += cp.lots[filters.vehicleType].total;
        return acc;
      },
      { available: 0, total: 0 }
    );
  }, [filteredCarparks, filters.vehicleType]);

  // Auto-refresh timer every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      handleRefresh();
    }, 30000);

    return () => clearInterval(timer);
  }, [userLocation]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      const updated = carparkService.refreshLiveLots();
      setCarparks(
        userLocation
          ? updated.map((cp) => ({
              ...cp,
              distanceKm: carparkService.getCarparks(userLocation.lat, userLocation.lng).find(
                (c) => c.id === cp.id
              )?.distanceKm,
            }))
          : [...updated]
      );
      setLastUpdated(new Date().toISOString());
      setIsRefreshing(false);
    }, 400);
  }, [userLocation]);

  // User GPS Geolocation handler
  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setUserLocation(coords);
        setIsLocating(false);
        // Auto sort by distance
        setFilters((prev) => ({ ...prev, sortBy: 'distance' }));
      },
      (err) => {
        console.warn('Geolocation failed or permission denied, using default Marina Bay coords:', err);
        // Fallback to Singapore CBD / Marina Bay Sands coords
        const coords = { lat: 1.2838, lng: 103.8591 };
        setUserLocation(coords);
        setIsLocating(false);
        setFilters((prev) => ({ ...prev, sortBy: 'distance' }));
      },
      { timeout: 8000 }
    );
  }, []);

  const handleToggleFavorite = (id: string) => {
    const updated = carparkService.toggleFavorite(id);
    setFavoriteIds(updated);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* 3-Zone Navigation Header */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        vehicleType={filters.vehicleType}
        onSelectVehicleType={(vt) => setFilters((prev) => ({ ...prev, vehicleType: vt }))}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        lastUpdated={lastUpdated}
        savedCount={favoriteIds.length}
        onOpenApiModal={() => setIsApiModalOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {/* TAB 1: Live Tracker (Map & List) */}
        {activeTab === 'tracker' && (
          <div className="space-y-4">
            {/* Search, Vehicle Selector & Quick Area Chips */}
            <SearchBarAndFilters
              filters={filters}
              onChangeFilters={setFilters}
              totalCarparksCount={carparks.length}
              filteredCount={filteredCarparks.length}
              availableAreas={availableAreas}
            />

            {/* Quick Metrics Bar & View Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="font-semibold text-slate-900 font-mono tabular-nums">
                    {totalLotsForSelectedVehicle.available.toLocaleString()}
                  </span>
                  <span>
                    {' '}
                    available{' '}
                    {filters.vehicleType === 'car'
                      ? 'car'
                      : filters.vehicleType === 'motorcycle'
                      ? 'motorcycle'
                      : 'heavy vehicle'}{' '}
                    lots
                  </span>
                </div>
                <span className="text-slate-300" aria-hidden="true">
                  ·
                </span>
                <div>
                  <span className="font-semibold text-slate-900 font-mono tabular-nums">
                    {filteredCarparks.length}
                  </span>{' '}
                  carparks matched
                </div>
              </div>

              {/* View Switcher: Split / Map / List */}
              <div className="flex items-center p-1 bg-slate-100 rounded-lg shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode('split')}
                  className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                    viewMode === 'split' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                  }`}
                  title="Split dual screen map and list"
                >
                  <Columns className="w-3.5 h-3.5" />
                  <span>Split View</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('map')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                    viewMode === 'map' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                  }`}
                  title="Full screen map"
                >
                  <Map className="w-3.5 h-3.5" />
                  <span>Map Only</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                    viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                  }`}
                  title="List cards only"
                >
                  <List className="w-3.5 h-3.5" />
                  <span>List Only</span>
                </button>
              </div>
            </div>

            {/* Layout Grid based on viewMode */}
            {viewMode === 'split' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* Left Column: Interactive Map (Pinned Height) */}
                <div className="lg:col-span-7 h-[540px] sticky top-24">
                  <CarparkMap
                    carparks={filteredCarparks}
                    selectedCarpark={selectedCarpark}
                    onSelectCarpark={setSelectedCarpark}
                    vehicleType={filters.vehicleType}
                    userLocation={userLocation}
                    onLocateMe={handleLocateMe}
                    isLocating={isLocating}
                  />
                </div>

                {/* Right Column: Scrollable High-Density List */}
                <div className="lg:col-span-5 space-y-3 max-h-[760px] overflow-y-auto pr-1">
                  {filteredCarparks.length > 0 ? (
                    filteredCarparks.map((cp) => (
                      <CarparkCard
                        key={cp.id}
                        carpark={cp}
                        vehicleType={filters.vehicleType}
                        isSelected={selectedCarpark?.id === cp.id}
                        isFavorite={favoriteIds.includes(cp.id)}
                        onSelect={setSelectedCarpark}
                        onToggleFavorite={handleToggleFavorite}
                      />
                    ))
                  ) : (
                    <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-500">
                      No carparks matched your current search and filter criteria. Try adjusting the
                      filters or clearing the search text.
                    </div>
                  )}
                </div>
              </div>
            )}

            {viewMode === 'map' && (
              <div className="h-[680px] w-full">
                <CarparkMap
                  carparks={filteredCarparks}
                  selectedCarpark={selectedCarpark}
                  onSelectCarpark={setSelectedCarpark}
                  vehicleType={filters.vehicleType}
                  userLocation={userLocation}
                  onLocateMe={handleLocateMe}
                  isLocating={isLocating}
                />
              </div>
            )}

            {viewMode === 'list' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCarparks.map((cp) => (
                  <CarparkCard
                    key={cp.id}
                    carpark={cp}
                    vehicleType={filters.vehicleType}
                    isSelected={selectedCarpark?.id === cp.id}
                    isFavorite={favoriteIds.includes(cp.id)}
                    onSelect={setSelectedCarpark}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Fee Calculator */}
        {activeTab === 'calculator' && (
          <FeeCalculatorView
            carparks={carparks}
            onSelectCarpark={(cp) => {
              setSelectedCarpark(cp);
              setActiveTab('tracker');
            }}
          />
        )}

        {/* TAB 3: Delivery & Clearance Guide */}
        {activeTab === 'delivery' && (
          <DeliveryGuideView
            carparks={carparks}
            onSelectCarpark={(cp) => {
              setSelectedCarpark(cp);
              setActiveTab('tracker');
            }}
          />
        )}

        {/* TAB 4: Saved Carparks */}
        {activeTab === 'saved' && (
          <SavedCarparksView
            carparks={carparks}
            favoriteIds={favoriteIds}
            vehicleType={filters.vehicleType}
            onSelectCarpark={setSelectedCarpark}
            onToggleFavorite={handleToggleFavorite}
            onBrowseAll={() => setActiveTab('tracker')}
          />
        )}
      </main>

      {/* Selected Carpark Detail Modal / Drawer */}
      <CarparkDetailModal
        carpark={selectedCarpark}
        onClose={() => setSelectedCarpark(null)}
        isFavorite={selectedCarpark ? favoriteIds.includes(selectedCarpark.id) : false}
        onToggleFavorite={handleToggleFavorite}
        initialVehicleType={filters.vehicleType}
      />

      {/* Developer Backend Integration Modal */}
      <BackendIntegrationModal
        isOpen={isApiModalOpen}
        onClose={() => setIsApiModalOpen(false)}
      />

      {/* Clean Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">SG ParkLive</span>
            <span>·</span>
            <span>Singapore Carpark Lots Availability Tracker</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsApiModalOpen(true)}
              className="text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
            >
              Backend API Integration Spec
            </button>
            <span>·</span>
            <span>Data aligned with LTA DataMall & data.gov.sg</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
