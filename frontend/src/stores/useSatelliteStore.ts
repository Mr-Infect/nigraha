import { create } from 'zustand';
import type { FeatureCollection } from 'geojson';

interface SatelliteState {
  positions: FeatureCollection | null;
  orbits: FeatureCollection | null;
  setSatelliteData: (positions: FeatureCollection, orbits: FeatureCollection) => void;
}

export const useSatelliteStore = create<SatelliteState>((set) => ({
  positions: null,
  orbits: null,
  setSatelliteData: (positions, orbits) => set({ positions, orbits }),
}));
