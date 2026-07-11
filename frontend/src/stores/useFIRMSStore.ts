import { create } from 'zustand';

interface FIRMSState {
  data: any; // GeoJSON FeatureCollection
  setData: (data: any) => void;
}

export const useFIRMSStore = create<FIRMSState>((set) => ({
  data: null,
  setData: (data) => set({ data })
}));
