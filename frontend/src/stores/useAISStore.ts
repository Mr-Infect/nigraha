import { create } from 'zustand';

export interface Ship {
  mmsi: number;
  lat: number;
  lon: number;
  cog: number;
  sog: number;
  name: string;
  timestamp: string;
}

interface AISState {
  ships: Record<number, Ship>;
  updateShips: (newShips: Ship[]) => void;
}

export const useAISStore = create<AISState>((set) => ({
  ships: {},
  updateShips: (newShips) => set((state) => {
    const updated = { ...state.ships };
    newShips.forEach(ship => {
      updated[ship.mmsi] = ship;
    });
    return { ships: updated };
  })
}));
