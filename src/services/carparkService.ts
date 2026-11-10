import { Carpark, FilterOptions, VehicleType } from '../types/carpark';
import { INITIAL_CARPARKS } from './carparkData';

// Storage key for user bookmarks
const FAVORITES_STORAGE_KEY = 'sg_parklive_favorites';

// Haversine formula to compute distance in km between two GPS coordinates
export function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Calculate parking fee in SGD based on carpark rules and stay duration
export interface ParkingFeeResult {
  totalFee: number;
  durationMins: number;
  isGracePeriod: boolean;
  rateBreakdown: string[];
}

export function calculateParkingFee(
  carpark: Carpark,
  vehicleType: VehicleType,
  entryDate: Date,
  exitDate: Date
): ParkingFeeResult {
  const durationMs = exitDate.getTime() - entryDate.getTime();
  const durationMins = Math.max(0, Math.round(durationMs / (1000 * 60)));

  // If stay is within grace period, it's free
  if (durationMins <= carpark.gracePeriodMins) {
    return {
      totalFee: 0,
      durationMins,
      isGracePeriod: true,
      rateBreakdown: [
        `Within ${carpark.gracePeriodMins}-minute grace period: Free ($0.00)`,
      ],
    };
  }

  // Motorcycle standard flat rates in SG HDB/URA
  if (vehicleType === 'motorcycle') {
    if (carpark.agency === 'HDB' || carpark.agency === 'URA') {
      // HDB motorcycle: $0.65 per session (7am-10.30pm), $0.65 night (10.30pm-7am)
      const fee = durationMins > 720 ? 1.30 : 0.65;
      return {
        totalFee: fee,
        durationMins,
        isGracePeriod: false,
        rateBreakdown: [
          `Motorcycle HDB EPS Session Rate: S$${fee.toFixed(2)} (${durationMins} mins)`,
        ],
      };
    }
  }

  // Heavy vehicle in HDB/URA
  if (vehicleType === 'heavyVehicle') {
    if (carpark.agency === 'HDB' || carpark.agency === 'URA') {
      const blocks = Math.ceil(durationMins / 30);
      const fee = blocks * 1.20;
      return {
        totalFee: fee,
        durationMins,
        isGracePeriod: false,
        rateBreakdown: [
          `Heavy Vehicle standard rate: ${blocks} × S$1.20 (30-min blocks) = S$${fee.toFixed(2)}`,
        ],
      };
    }
  }

  // Standard Car Parking Fee Calculation
  const isWeekend = entryDate.getDay() === 0 || entryDate.getDay() === 6;
  const breakdown: string[] = [];
  let totalFee = 0;

  // Commercial / Mall complex rate structure
  if (carpark.pricing.firstHourRate && carpark.pricing.subsequentRate) {
    const firstHrRate = carpark.pricing.firstHourRate;
    const subRate = carpark.pricing.subsequentRate;

    if (durationMins <= 60) {
      totalFee = firstHrRate;
      breakdown.push(`First hour flat rate: S$${firstHrRate.toFixed(2)}`);
    } else {
      totalFee = firstHrRate;
      breakdown.push(`First hour: S$${firstHrRate.toFixed(2)}`);
      const extraMins = durationMins - 60;
      const extra15mBlocks = Math.ceil(extraMins / 15);
      const subFee = extra15mBlocks * subRate;
      totalFee += subFee;
      breakdown.push(
        `Subsequent ${extraMins} mins (${extra15mBlocks} × 15-min blocks @ S$${subRate.toFixed(2)}): S$${subFee.toFixed(2)}`
      );
    }
  } else {
    // Per half-hour rate (e.g. HDB / URA standard)
    const ratePerHalfHour = isWeekend
      ? carpark.pricing.ratePerHalfHourWeekend
      : carpark.pricing.ratePerHalfHourWeekday;
    const halfHourBlocks = Math.ceil(durationMins / 30);
    totalFee = halfHourBlocks * ratePerHalfHour;
    breakdown.push(
      `${halfHourBlocks} × 30-min blocks @ S$${ratePerHalfHour.toFixed(2)}: S$${totalFee.toFixed(2)}`
    );

    // Check night parking cap if stay crosses into night
    const entryHour = entryDate.getHours();
    if (
      carpark.pricing.nightMaxCap &&
      (entryHour >= 22 || entryHour < 6) &&
      totalFee > carpark.pricing.nightMaxCap
    ) {
      totalFee = carpark.pricing.nightMaxCap;
      breakdown.push(`Night parking cap applied: S$${totalFee.toFixed(2)}`);
    }
  }

  return {
    totalFee: Math.round(totalFee * 100) / 100,
    durationMins,
    isGracePeriod: false,
    rateBreakdown: breakdown,
  };
}

// Service class with state and simulation
class CarparkService {
  private carparks: Carpark[] = [...INITIAL_CARPARKS];
  private isSimulating: boolean = true;

  constructor() {
    this.recalculateOccupancy();
  }

  private recalculateOccupancy() {
    this.carparks = this.carparks.map((cp) => {
      const carTotal = cp.lots.car.total;
      const carAvail = cp.lots.car.available;
      const occ = Math.round(((carTotal - carAvail) / carTotal) * 100);
      return {
        ...cp,
        occupancyRate: Math.min(100, Math.max(0, occ)),
      };
    });
  }

  // Retrieve current carpark list
  public getCarparks(userLat?: number, userLng?: number): Carpark[] {
    if (userLat !== undefined && userLng !== undefined) {
      return this.carparks.map((cp) => ({
        ...cp,
        distanceKm: getDistanceKm(userLat, userLng, cp.lat, cp.lng),
      }));
    }
    return [...this.carparks];
  }

  // Get single carpark by ID
  public getCarparkById(id: string): Carpark | undefined {
    return this.carparks.find((cp) => cp.id === id);
  }

  // Check serverless backend health and LTA key configuration
  public async checkBackendHealth(): Promise<{
    configured: boolean;
    service: string;
    message?: string;
  }> {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        return {
          configured: Boolean(data.ltaDatamallConfigured),
          service: data.service,
        };
      }
    } catch {
      // Backend not reached or offline
    }
    return { configured: false, service: 'Local Standalone' };
  }

  // Refresh carpark lots by calling serverless /api/carparkavailability
  // If LTA key is configured, pulls live LTA DataMall data.
  // If not yet configured, gracefully applies realistic live fluctuation.
  public async refreshLiveLots(): Promise<Carpark[]> {
    try {
      const res = await fetch('/api/carparkavailability');
      if (res.ok) {
        const data = await res.json();

        // If backend returned live LTA records, merge lots
        if (data.status === 'success' && Array.isArray(data.value) && data.value.length > 0) {
          const ltaRecords: Array<{
            CarParkID: string;
            Development: string;
            AvailableLots: number;
            LotType: string;
          }> = data.value;

          const ltaMap = new Map<string, number>();
          ltaRecords.forEach((r) => {
            const key = `${r.CarParkID}_${r.LotType}`;
            ltaMap.set(key, r.AvailableLots);
          });

          this.carparks = this.carparks.map((cp) => {
            const liveCarLots = ltaMap.get(`${cp.carparkNo}_C`);
            const liveMotorLots = ltaMap.get(`${cp.carparkNo}_Y`);
            const liveHeavyLots = ltaMap.get(`${cp.carparkNo}_H`);

            const newCarAvail = liveCarLots !== undefined ? liveCarLots : cp.lots.car.available;
            const newMotorAvail = liveMotorLots !== undefined ? liveMotorLots : cp.lots.motorcycle.available;
            const newHeavyAvail = liveHeavyLots !== undefined ? liveHeavyLots : cp.lots.heavyVehicle.available;

            const carTotal = cp.lots.car.total;
            const newOcc = Math.round(((carTotal - newCarAvail) / carTotal) * 100);

            return {
              ...cp,
              lots: {
                car: { ...cp.lots.car, available: newCarAvail },
                motorcycle: { ...cp.lots.motorcycle, available: newMotorAvail },
                heavyVehicle: { ...cp.lots.heavyVehicle, available: newHeavyAvail },
              },
              occupancyRate: Math.max(0, Math.min(100, newOcc)),
              lastUpdated: new Date().toISOString(),
            };
          });

          return [...this.carparks];
        }
      }
    } catch (err) {
      console.warn('Live API request failed, falling back to simulated live flux:', err);
    }

    // Fallback: simulated live flux
    this.carparks = this.carparks.map((cp) => {
      const deltaCar = Math.floor(Math.random() * 9) - 4;
      const newCarAvail = Math.max(0, Math.min(cp.lots.car.total, cp.lots.car.available + deltaCar));

      const deltaMotor = Math.floor(Math.random() * 5) - 2;
      const newMotorAvail = Math.max(
        0,
        Math.min(cp.lots.motorcycle.total, cp.lots.motorcycle.available + deltaMotor)
      );

      let newEVAvail = cp.evChargers?.available ?? 0;
      if (cp.evChargers) {
        const evDelta = Math.random() > 0.8 ? (Math.random() > 0.5 ? 1 : -1) : 0;
        newEVAvail = Math.max(0, Math.min(cp.evChargers.total, cp.evChargers.available + evDelta));
      }

      const newOcc = Math.round(((cp.lots.car.total - newCarAvail) / cp.lots.car.total) * 100);

      return {
        ...cp,
        lots: {
          ...cp.lots,
          car: { ...cp.lots.car, available: newCarAvail },
          motorcycle: { ...cp.lots.motorcycle, available: newMotorAvail },
        },
        evChargers: cp.evChargers ? { ...cp.evChargers, available: newEVAvail } : null,
        occupancyRate: newOcc,
        lastUpdated: new Date().toISOString(),
      };
    });

    return [...this.carparks];
  }

  // Filter and sort carparks
  public filterCarparks(
    list: Carpark[],
    filters: FilterOptions,
    userLocation?: { lat: number; lng: number }
  ): Carpark[] {
    let result = list.map((cp) => {
      if (userLocation) {
        return {
          ...cp,
          distanceKm: getDistanceKm(userLocation.lat, userLocation.lng, cp.lat, cp.lng),
        };
      }
      return cp;
    });

    // Search query filter (matches carpark code, name, address, postal code, or area)
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      result = result.filter(
        (cp) =>
          cp.name.toLowerCase().includes(q) ||
          cp.carparkNo.toLowerCase().includes(q) ||
          cp.address.toLowerCase().includes(q) ||
          cp.postalCode.includes(q) ||
          cp.area.toLowerCase().includes(q)
      );
    }

    // Area filter
    if (filters.selectedArea && filters.selectedArea !== 'All') {
      result = result.filter((cp) => cp.area === filters.selectedArea);
    }

    // Agency filter
    if (filters.agencyFilter && filters.agencyFilter !== 'all') {
      result = result.filter((cp) => cp.agency === filters.agencyFilter);
    }

    // Availability filter
    if (filters.availabilityFilter === 'ample') {
      result = result.filter((cp) => {
        const avail = cp.lots[filters.vehicleType].available;
        const total = cp.lots[filters.vehicleType].total;
        return total > 0 && avail / total >= 0.3;
      });
    } else if (filters.availabilityFilter === 'moderate') {
      result = result.filter((cp) => {
        const avail = cp.lots[filters.vehicleType].available;
        const total = cp.lots[filters.vehicleType].total;
        return total > 0 && avail / total >= 0.1;
      });
    } else if (filters.availabilityFilter === 'availableOnly') {
      result = result.filter((cp) => cp.lots[filters.vehicleType].available > 0);
    }

    // EV Charging filter
    if (filters.hasEVOnly) {
      result = result.filter((cp) => cp.evChargers && cp.evChargers.available > 0);
    }

    // Minimum Clearance filter
    if (filters.minClearance > 0) {
      result = result.filter(
        (cp) => cp.heightClearance === null || cp.heightClearance >= filters.minClearance
      );
    }

    // Free Parking filter
    if (filters.freeParkingOnly) {
      result = result.filter((cp) => cp.freeParking && cp.freeParking !== 'None');
    }

    // Sorting
    result.sort((a, b) => {
      if (filters.sortBy === 'availableLots') {
        return b.lots[filters.vehicleType].available - a.lots[filters.vehicleType].available;
      }
      if (filters.sortBy === 'distance') {
        const distA = a.distanceKm ?? 9999;
        const distB = b.distanceKm ?? 9999;
        return distA - distB;
      }
      if (filters.sortBy === 'rate') {
        return a.pricing.ratePerHalfHourWeekday - b.pricing.ratePerHalfHourWeekday;
      }
      if (filters.sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

    return result;
  }

  // Bookmarking favorites
  public getFavorites(): string[] {
    try {
      const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
      return raw ? JSON.parse(raw) : ['MALL_SUNTEC', 'HDB_TOA_PAYOH_HUB'];
    } catch {
      return ['MALL_SUNTEC', 'HDB_TOA_PAYOH_HUB'];
    }
  }

  public toggleFavorite(id: string): string[] {
    try {
      const current = this.getFavorites();
      const updated = current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id];
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    } catch {
      return [];
    }
  }
}

export const carparkService = new CarparkService();
