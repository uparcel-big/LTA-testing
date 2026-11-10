export type VehicleType = 'car' | 'motorcycle' | 'heavyVehicle';

export type CarparkAgency = 'HDB' | 'URA' | 'LTA' | 'Commercial' | 'Hospital';

export type CarparkType =
  | 'Multi-Storey (MSCP)'
  | 'Basement'
  | 'Surface'
  | 'Covered'
  | 'Mechanised';

export interface LotBreakdown {
  total: number;
  available: number;
}

export interface EVChargerInfo {
  total: number;
  available: number;
  provider: string; // e.g. "SP Mobility", "Shell Recharge", "CDG ENGIE"
  powerKw?: number;
}

export interface PricingInfo {
  ratePerHalfHourWeekday: number; // in SGD
  ratePerHalfHourWeekend: number;
  centralAreaSurcharge: boolean;
  nightMaxCap?: number; // e.g. $5.00 for HDB night parking
  firstHourRate?: number;
  subsequentRate?: number;
  notes?: string;
}

export interface HourlyTrend {
  hour: string; // e.g. "08:00", "09:00"
  occupancyPercent: number;
  availableCars: number;
}

export interface Carpark {
  id: string;
  carparkNo: string; // Singapore standard carpark code e.g. ACB, TAM1, SUNTEC
  name: string;
  address: string;
  postalCode: string;
  area: string; // e.g. "CBD / Marina Bay", "Orchard / Somerset", "Tampines"
  agency: CarparkAgency;
  lat: number;
  lng: number;
  carparkType: CarparkType;
  parkingSystem: 'Electronic Parking System (EPS)' | 'Coupon Parking';
  heightClearance: number | null; // in meters, e.g. 2.1, 1.9, null if open surface
  gracePeriodMins: number; // 10 mins standard HDB, 15 mins malls
  lots: {
    car: LotBreakdown;
    motorcycle: LotBreakdown;
    heavyVehicle: LotBreakdown;
  };
  evChargers: EVChargerInfo | null;
  shortTermParking: 'Whole Day' | '7am-10.30pm' | 'No';
  freeParking: string; // e.g. "Sun & PH (7am - 10.30pm)" or "None"
  nightParking: boolean;
  pricing: PricingInfo;
  occupancyRate: number; // calculated percentage for cars (0 - 100)
  lastUpdated: string;
  hourlyTrends: HourlyTrend[];
  distanceKm?: number;
}

export interface FilterOptions {
  searchQuery: string;
  vehicleType: VehicleType;
  selectedArea: string;
  agencyFilter: string; // 'all' | CarparkAgency
  availabilityFilter: 'all' | 'ample' | 'moderate' | 'availableOnly';
  hasEVOnly: boolean;
  minClearance: number; // 0 for any, 2.0, 2.2, 2.5, 4.0
  freeParkingOnly: boolean;
  sortBy: 'availableLots' | 'distance' | 'rate' | 'name';
}
