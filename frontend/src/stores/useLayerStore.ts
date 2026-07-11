import { create } from 'zustand';

interface LayerGroup {
  id: string;
  label: string;
  domain: string;
  enabled: boolean;
  color: string;
}

interface LayerState {
  showLeftPanel: boolean;
  showRightPanel: boolean;
  layers: Record<string, boolean>;
  layerGroups: LayerGroup[];
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  toggleLayer: (layer: string) => void;
}

const defaultLayerGroups: LayerGroup[] = [
  // GEOINT
  { id: 'firms',       label: 'Thermal / FIRMS Hotspots',     domain: 'GEOINT', enabled: false, color: '#FF3333' },
  { id: 'osm_military',label: 'OSM Military Installations',   domain: 'GEOINT', enabled: false, color: '#FFB800' },
  { id: 'chokepoints', label: 'Strategic Maritime Chokepoints',domain: 'GEOINT', enabled: true,  color: '#00F0FF' },
  { id: 'cables',      label: 'Undersea Fibre/Cable Routes',   domain: 'GEOINT', enabled: false, color: '#00FF88' },
  // SIGINT
  { id: 'adsb',            label: 'ADS-B Live Air Traffic',    domain: 'SIGINT', enabled: true,  color: '#00F0FF' },
  { id: 'ais',             label: 'AIS Naval Vessel Tracks',   domain: 'SIGINT', enabled: false, color: '#00FF88' },
  { id: 'emergency_squawks', label: 'Emergency Squawks',       domain: 'SIGINT', enabled: true,  color: '#FF3333' },
  { id: 'emitters',        label: 'SIGINT Emitter Sites',      domain: 'SIGINT', enabled: false, color: '#00FF88' },
  // OSINT
  { id: 'gdelt',    label: 'GDELT Conflict Events',    domain: 'OSINT', enabled: false, color: '#FFB800' },
  { id: 'nuclear',  label: 'Nuclear Facilities (Global)', domain: 'OSINT', enabled: false, color: '#39FF14' },
  { id: 'mil_bases',label: 'Foreign Military Bases',   domain: 'OSINT', enabled: false, color: '#FFB800' },
  // MILINT
  { id: 'orb',      label: 'Order of Battle (ORB)',    domain: 'MILINT', enabled: false, color: '#00F0FF' },
  { id: 'geofence', label: 'Geofence / Border Zones',  domain: 'MILINT', enabled: false, color: '#FF3333' },
  { id: 'assets',   label: 'Strategic Assets & Facilities', domain: 'MILINT', enabled: true,  color: '#FFB800' },
  { id: 'satellites',label: 'Spy Satellites & Orbits', domain: 'MILINT', enabled: true,  color: '#c084fc' },
  { id: 'missiles', label: 'Missile Battery Sites',    domain: 'MILINT', enabled: false, color: '#FF6600' },
  { id: 'ew_zones', label: 'EW / A2AD Denial Zones',   domain: 'MILINT', enabled: false, color: '#FF3333' },
];

export const useLayerStore = create<LayerState>((set) => ({
  showLeftPanel: false,
  showRightPanel: false,
  layers: defaultLayerGroups.reduce((acc, g) => ({ ...acc, [g.id]: g.enabled }), {}),
  layerGroups: defaultLayerGroups,
  toggleLeftPanel: () => set((state) => ({ showLeftPanel: !state.showLeftPanel })),
  toggleRightPanel: () => set((state) => ({ showRightPanel: !state.showRightPanel })),
  toggleLayer: (layer) => set((state) => ({
    layers: { ...state.layers, [layer]: !state.layers[layer] }
  })),
}));
