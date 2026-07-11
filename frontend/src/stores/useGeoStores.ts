import { create } from 'zustand';
import type { FeatureCollection } from 'geojson';

interface GDELTState {
  data: FeatureCollection | null;
  setData: (data: FeatureCollection) => void;
}

export const useGDELTStore = create<GDELTState>((set) => ({
  data: null,
  setData: (data) => set({ data }),
}));

interface OSMState {
  data: FeatureCollection | null;
  setData: (data: FeatureCollection) => void;
}

export const useOSMStore = create<OSMState>((set) => ({
  data: null,
  setData: (data) => set({ data }),
}));
