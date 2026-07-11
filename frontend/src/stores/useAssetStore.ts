import { create } from 'zustand';
import type { FeatureCollection } from 'geojson';

interface AssetState {
  data: FeatureCollection | null;
  setData: (data: FeatureCollection) => void;
}

export const useAssetStore = create<AssetState>((set) => ({
  data: null,
  setData: (data) => set({ data }),
}));
