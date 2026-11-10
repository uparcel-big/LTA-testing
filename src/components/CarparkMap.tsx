import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Carpark, VehicleType } from '../types/carpark';
import { Navigation, Compass, Layers, ShieldCheck, Zap } from 'lucide-react';

interface CarparkMapProps {
  carparks: Carpark[];
  selectedCarpark: Carpark | null;
  onSelectCarpark: (carpark: Carpark) => void;
  vehicleType: VehicleType;
  userLocation: { lat: number; lng: number } | null;
  onLocateMe: () => void;
  isLocating: boolean;
}

const REGION_PRESETS = [
  { label: 'All Singapore', center: [1.3521, 103.8198] as [number, number], zoom: 12 },
  { label: 'CBD & Marina Bay', center: [1.2855, 103.8540] as [number, number], zoom: 14 },
  { label: 'Orchard Road', center: [1.3025, 103.8360] as [number, number], zoom: 15 },
  { label: 'Bugis', center: [1.2990, 103.8540] as [number, number], zoom: 15 },
  { label: 'Toa Payoh', center: [1.3340, 103.8470] as [number, number], zoom: 14 },
  { label: 'Jurong East', center: [1.3335, 103.7440] as [number, number], zoom: 14 },
  { label: 'Tampines & East', center: [1.3530, 103.9420] as [number, number], zoom: 14 },
  { label: 'Woodlands', center: [1.4360, 103.7865] as [number, number], zoom: 14 },
];

export const CarparkMap: React.FC<CarparkMapProps> = ({
  carparks,
  selectedCarpark,
  onSelectCarpark,
  vehicleType,
  userLocation,
  onLocateMe,
  isLocating,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.CircleMarker | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Singapore center coordinates
      const map = L.map(mapContainerRef.current, {
        center: [1.3521, 103.8198],
        zoom: 12,
        minZoom: 11,
        maxZoom: 18,
        zoomControl: false,
      });

      // CartoDB Voyager tile layer (clean, high contrast, non-distracting)
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 19,
        }
      ).addTo(map);

      // Add Zoom control on top-right
      L.control.zoom({ position: 'topright' }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      // Do not destroy on every re-render; we maintain singleton map
    };
  }, []);

  // Update Markers when carparks, vehicleType, or selection changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    carparks.forEach((cp) => {
      const breakdown = cp.lots[vehicleType];
      const avail = breakdown.available;
      const total = breakdown.total;
      const pct = total > 0 ? Math.round((avail / total) * 100) : 0;

      // Color logic:
      // Green (ample: >30% available or >50 lots)
      // Amber (moderate: 10% - 30%)
      // Red (low: <10%)
      // Slate (0 lots)
      let bgClass = 'bg-emerald-600 text-white border-emerald-700 shadow-emerald-200';
      let dotColor = '#10b981';

      if (avail === 0) {
        bgClass = 'bg-slate-700 text-slate-200 border-slate-800 shadow-slate-200';
        dotColor = '#64748b';
      } else if (pct < 12 || avail < 15) {
        bgClass = 'bg-rose-600 text-white border-rose-700 shadow-rose-200';
        dotColor = '#e11d48';
      } else if (pct < 30 || avail < 50) {
        bgClass = 'bg-amber-600 text-white border-amber-700 shadow-amber-200';
        dotColor = '#d97706';
      }

      const isSelected = selectedCarpark?.id === cp.id;

      // Custom HTML Pin
      const iconHtml = `
        <div class="group relative flex flex-col items-center cursor-pointer transition-transform duration-150 ${
          isSelected ? 'scale-125 z-50' : 'hover:scale-110 z-10'
        }">
          <div class="px-2 py-1 rounded-md text-xs font-bold font-mono shadow-md border flex items-center gap-1.5 whitespace-nowrap ${bgClass} ${
        isSelected ? 'ring-2 ring-slate-900 ring-offset-1' : ''
      }">
            <span class="w-1.5 h-1.5 rounded-full" style="background-color: ${dotColor}"></span>
            <span>${avail}</span>
          </div>
          <div class="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] ${
            avail === 0
              ? 'border-t-slate-700'
              : pct < 12
              ? 'border-t-rose-600'
              : pct < 30
              ? 'border-t-amber-600'
              : 'border-t-emerald-600'
          }"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-carpark-pin',
        html: iconHtml,
        iconSize: [42, 28],
        iconAnchor: [21, 28],
      });

      const marker = L.marker([cp.lat, cp.lng], { icon: customIcon });

      marker.on('click', () => {
        onSelectCarpark(cp);
        map.panTo([cp.lat, cp.lng], { animate: true, duration: 0.5 });
      });

      marker.addTo(markersLayer);
    });
  }, [carparks, selectedCarpark, vehicleType, onSelectCarpark]);

  // Center on selected carpark when changed externally
  useEffect(() => {
    if (!selectedCarpark || !mapInstanceRef.current) return;
    mapInstanceRef.current.panTo([selectedCarpark.lat, selectedCarpark.lng], {
      animate: true,
      duration: 0.6,
    });
  }, [selectedCarpark]);

  // Handle user GPS location update
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userLocation) {
      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
      } else {
        const marker = L.circleMarker([userLocation.lat, userLocation.lng], {
          radius: 8,
          fillColor: '#2563eb',
          color: '#ffffff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.9,
        }).addTo(map);

        marker.bindPopup('<b>Your Current Location</b>');
        userMarkerRef.current = marker;
      }
    }
  }, [userLocation]);

  const handleJumpRegion = (center: [number, number], zoom: number) => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo(center, zoom, { duration: 0.8 });
  };

  return (
    <div className="relative w-full h-full min-h-[460px] bg-slate-100 flex flex-col overflow-hidden rounded-xl border border-slate-200">
      {/* Top Map Controls Strip */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-wrap items-center gap-1.5 p-1 bg-white/95 backdrop-blur-md rounded-lg shadow-sm border border-slate-200 text-xs">
        <span className="px-2 py-1 font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
          Quick Jump
        </span>
        {REGION_PRESETS.map((preset) => (
          <button
            key={preset.label}
            onClick={() => handleJumpRegion(preset.center, preset.zoom)}
            className="px-2.5 py-1 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors whitespace-nowrap font-medium"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Locate Me Button & Legend */}
      <div className="absolute bottom-4 right-4 z-[1000] flex flex-col items-end gap-2">
        <button
          onClick={onLocateMe}
          disabled={isLocating}
          className="flex items-center gap-2 px-3 py-2 bg-white text-slate-800 hover:bg-slate-50 active:bg-slate-100 rounded-lg shadow-md border border-slate-200 text-xs font-semibold transition-all cursor-pointer"
          title="Find carparks near your current GPS location"
        >
          <Compass className={`w-4 h-4 text-rose-600 ${isLocating ? 'animate-spin' : ''}`} />
          <span>{isLocating ? 'Acquiring GPS...' : 'Near Me'}</span>
        </button>

        {/* Status Legend Pill */}
        <div className="bg-white/95 backdrop-blur-md px-3 py-2 rounded-lg shadow-md border border-slate-200 text-[11px] text-slate-600 flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>&gt;30% Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>Filling Up</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span>&lt;10% Lots</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-700"></span>
            <span>Full</span>
          </div>
        </div>
      </div>

      {/* Selected Carpark Fast-Inspect Floating Card */}
      {selectedCarpark && (
        <div className="absolute top-16 left-3 z-[1000] max-w-sm w-[calc(100%-24px)] md:w-96 bg-white/98 backdrop-blur-md rounded-xl shadow-xl border border-slate-200 p-4 transition-all">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                  {selectedCarpark.carparkNo}
                </span>
                <span className="text-xs text-slate-500">{selectedCarpark.agency}</span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-slate-500">{selectedCarpark.area}</span>
              </div>
              <h4 className="font-semibold text-slate-900 text-sm mt-1 leading-tight">
                {selectedCarpark.name}
              </h4>
              <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                {selectedCarpark.address}
              </p>
            </div>
            <button
              onClick={() => onSelectCarpark(selectedCarpark)}
              className="text-xs px-2.5 py-1 bg-rose-600 text-white rounded-md hover:bg-rose-700 font-medium shrink-0"
            >
              Details
            </button>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-50 rounded-lg p-1.5 border border-slate-100">
              <span className="text-[10px] text-slate-400 block uppercase">
                {vehicleType === 'car' ? 'Cars' : vehicleType === 'motorcycle' ? 'Motor' : 'Heavy'}
              </span>
              <span className="font-mono font-bold text-sm text-slate-900 tabular-nums">
                {selectedCarpark.lots[vehicleType].available}
              </span>
              <span className="text-[10px] text-slate-400">
                {' '}
                / {selectedCarpark.lots[vehicleType].total}
              </span>
            </div>
            <div className="bg-slate-50 rounded-lg p-1.5 border border-slate-100">
              <span className="text-[10px] text-slate-400 block uppercase">Clearance</span>
              <span className="font-mono font-semibold text-xs text-slate-800">
                {selectedCarpark.heightClearance ? `${selectedCarpark.heightClearance}m` : 'Surface'}
              </span>
            </div>
            <div className="bg-slate-50 rounded-lg p-1.5 border border-slate-100">
              <span className="text-[10px] text-slate-400 block uppercase">Grace</span>
              <span className="font-mono font-semibold text-xs text-slate-800">
                {selectedCarpark.gracePeriodMins} mins
              </span>
            </div>
          </div>

          <div className="mt-2.5 flex items-center justify-between text-xs text-slate-600">
            <span>
              Weekday: S${selectedCarpark.pricing.ratePerHalfHourWeekday.toFixed(2)} / 30m
            </span>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${selectedCarpark.lat},${selectedCarpark.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-700 font-medium"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Navigate</span>
            </a>
          </div>
        </div>
      )}

      {/* The Leaflet Container DOM */}
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};
