import { create } from 'zustand';

export interface CyberAttack {
  timestamp: string;
  attacker: string;
  attacker_ip: string;
  attacker_coords: [number, number];
  target: string;
  target_ip: string;
  target_coords: [number, number];
  type: string;
  port: number;
}

export interface CyberNewsItem {
  title: string;
  link: string;
  published: string;
  source: string;
}

interface CyberState {
  cyberMode: boolean;
  activeAttacks: CyberAttack[];
  cyberNews: CyberNewsItem[];
  toggleCyberMode: () => void;
  addAttack: (attack: CyberAttack) => void;
  setCyberNews: (news: CyberNewsItem[]) => void;
}

export const useCyberStore = create<CyberState>((set) => ({
  cyberMode: false,
  activeAttacks: [],
  cyberNews: [],
  toggleCyberMode: () => set((state) => ({ cyberMode: !state.cyberMode })),
  addAttack: (attack) => set((state) => {
    const list = [attack, ...state.activeAttacks].slice(0, 50);
    return { activeAttacks: list };
  }),
  setCyberNews: (news) => set({ cyberNews: news }),
}));
