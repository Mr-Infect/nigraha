import { create } from 'zustand';

export interface Aircraft {
  hex: string;
  flight?: string;
  lat?: number;
  lon?: number;
  alt_geom?: number;
  alt_baro?: number;
  gs?: number;       // Ground speed knots
  track?: number;    // Heading degrees
  squawk?: string;
  emergency?: boolean;
  t?: string;        // Type/category
  r?: string;        // Registration
  desc?: string;     // Description
  vert_rate?: number;
  seen?: number;
  rssi?: number;
}

interface ADSBState {
  aircraft: Record<string, Aircraft>;
  count: number;
  lastUpdate: number;
  updateAircraft: (newAircraft: Aircraft[]) => void;
}

export const useADSBStore = create<ADSBState>((set) => ({
  aircraft: {},
  count: 0,
  lastUpdate: 0,
  updateAircraft: (newAircraft) => set(() => {
    // Full replace strategy — backend sends the complete current set
    const updated: Record<string, Aircraft> = {};
    newAircraft.forEach(ac => {
      if (ac.hex) updated[ac.hex] = ac;
    });
    return { aircraft: updated, count: newAircraft.length, lastUpdate: Date.now() };
  }),
}));
