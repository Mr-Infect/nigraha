import { create } from 'zustand';

export interface Alert {
  id: number;
  type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
  timestamp: string;
  lat?: number;
  lon?: number;
  source?: string;
  acknowledged: boolean;
}

interface AlertState {
  alerts: Alert[];
  unacknowledged: number;
  addAlerts: (newAlerts: Alert[]) => void;
  acknowledge: (id: number) => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  alerts: [],
  unacknowledged: 0,
  addAlerts: (newAlerts) => set((state) => {
    const merged = [...newAlerts, ...state.alerts].slice(0, 100);
    return { alerts: merged, unacknowledged: merged.filter(a => !a.acknowledged).length };
  }),
  acknowledge: (id) => set((state) => {
    const alerts = state.alerts.map(a => a.id === id ? { ...a, acknowledged: true } : a);
    return { alerts, unacknowledged: alerts.filter(a => !a.acknowledged).length };
  }),
}));
