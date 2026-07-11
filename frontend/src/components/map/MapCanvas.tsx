import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { FeatureCollection, Feature } from 'geojson';
import { useADSBStore } from '../../stores/useADSBStore';
import { useLayerStore } from '../../stores/useLayerStore';
import { useAISStore } from '../../stores/useAISStore';
import { useFIRMSStore } from '../../stores/useFIRMSStore';
import { useGDELTStore, useOSMStore } from '../../stores/useGeoStores';
import { useAssetStore } from '../../stores/useAssetStore';
import { useCyberStore } from '../../stores/useCyberStore';
import { useSatelliteStore } from '../../stores/useSatelliteStore';


// ─── OSIRIS-Style Tactical Icon Library ────────────────────────────────────
// Clean, small, directional SVG shapes — one per platform type.
// Standard palette (non-cyber): uses OSIRIS color convention
//   Cyan   = civil/commercial aircraft
//   Amber  = friendly military air
//   Red    = emergency/hostile
//   Green  = naval surface
//   Lime   = nuclear/strategic facilities
//   Purple = satellites/space
//   Orange = missiles/weapons
// All SVGs are 24×24 viewport, rendered at pixelRatio:2 (effectively ~14px on screen)

// IconDef intentionally removed — handled by IconPalette registry

function buildIcon(
  body: string,       // SVG inner markup
  w: number, h: number,
  fill: string,       // primary fill
  stroke: string,     // outline stroke
  glow?: string       // optional drop-shadow color
): string {
  const filter = glow
    ? `<defs><filter id="g" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="0" stdDeviation="2" flood-color="${glow}" flood-opacity="0.85"/></filter></defs>`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${filter}<g fill="${fill}" stroke="${stroke}" stroke-width="1" stroke-linejoin="round"${glow ? ' filter="url(#g)"' : ''}>${body}</g></svg>`;
}

// ── Aircraft: thin arrowhead pointing up (rotated by track at render time) ──
// Civil airliner — cyan (matches OSIRIS exactly)
const SVG_CIVIL_PLANE = (c: string) => buildIcon(
  `<polygon points="12,2 15.5,18 12,15 8.5,18" />
   <polygon points="4,13 12,10 20,13 12,11" fill-opacity="0.5"/>`,
  24, 24, c, '#0A0E17', c
);

// Military jet — amber, slightly wider delta wing
const SVG_MIL_JET = (c: string) => buildIcon(
  `<polygon points="12,2 16,19 12,15 8,19" />
   <polygon points="2,14 12,9 22,14 18,16 12,13 6,16" fill-opacity="0.6"/>`,
  24, 24, c, '#0A0E17', c
);

// UAV/Drone — X-wing shape
const SVG_DRONE = (c: string) => buildIcon(
  `<polygon points="12,2 14,9 20,6 17,12 20,18 12,15 4,18 7,12 4,6 10,9" />
   <circle cx="12" cy="12" r="2.5"/>`,
  24, 24, c, '#0A0E17', c
);

// ── Naval Surface: pentagon hull pointing up (rotated by COG) ──
// Destroyer / Frigate — teal green
const SVG_DESTROYER = (c: string) => buildIcon(
  `<polygon points="12,2 20,8 18,21 6,21 4,8" />
   <rect x="10" y="8" width="4" height="6" fill="${c === 'rgba(0,0,0,0)' ? 'transparent' : '#0A0E17'}" opacity="0.4"/>`,
  24, 24, c, '#0A0E17', c
);

// Aircraft Carrier — wide flat hexagon
const SVG_CARRIER = (c: string) => buildIcon(
  `<polygon points="12,3 21,8 21,18 12,22 3,18 3,8" />
   <rect x="5" y="11" width="14" height="3" fill="#0A0E17" opacity="0.5"/>
   <rect x="8" y="6" width="2" height="8" fill="#0A0E17" opacity="0.5"/>`,
  24, 24, c, '#0A0E17', c
);

// Submarine — elongated teardrop (no rotation, submerged)
const SVG_SUBMARINE = (c: string) => buildIcon(
  `<ellipse cx="12" cy="13" rx="5" ry="9"/>
   <polygon points="12,2 14,6 10,6"/>`,
  24, 24, c, '#0A0E17', c
);

// ── Fixed Facilities ──
// Nuclear power plant — radiation trefoil outline
const SVG_NUCLEAR = (c: string) => buildIcon(
  `<circle cx="12" cy="12" r="9" fill="none" stroke="${c}" stroke-width="1.5"/>
   <circle cx="12" cy="12" r="2.5"/>
   <path d="M12,9.5 L8.5,3.5 A9,9 0 0,1 15.5,3.5 Z" />
   <path d="M9.8,13.5 L3,17 A9,9 0 0,1 3,7 L9.8,10.5 A4,4 0 0,0 9.8,13.5Z" />
   <path d="M14.2,13.5 L21,17 A9,9 0 0,0 21,7 L14.2,10.5 A4,4 0 0,1 14.2,13.5Z" />`,
  24, 24, c, '#0A0E17', c
);

// Military base / airfield — square with crosshair
const SVG_BASE = (c: string) => buildIcon(
  `<rect x="3" y="3" width="18" height="18" fill="${c}" fill-opacity="0.25" stroke="${c}" stroke-width="1.5"/>
   <line x1="12" y1="3" x2="12" y2="21" stroke="${c}" stroke-width="1.2"/>
   <line x1="3" y1="12" x2="21" y2="12" stroke="${c}" stroke-width="1.2"/>
   <circle cx="12" cy="12" r="2.5" fill="${c}"/>`,
  24, 24, 'none', c, c
);

// Missile / SAM battery — upward triangle with bolt
const SVG_MISSILE = (c: string) => buildIcon(
  `<polygon points="12,2 21,21 3,21" fill="${c}" fill-opacity="0.2" stroke="${c}" stroke-width="1.5"/>
   <line x1="12" y1="9" x2="12" y2="16" stroke="${c}" stroke-width="2" stroke-linecap="round"/>
   <circle cx="12" cy="18" r="1.5" fill="${c}"/>`,
  24, 24, 'none', c, c
);

// Radar / EW emitter — concentric arcs (radar dish)
const SVG_RADAR = (c: string) => buildIcon(
  `<path d="M12,20 L12,12" stroke="${c}" stroke-width="2"/>
   <path d="M6,20 Q6,8 12,8 Q18,8 18,20" fill="none" stroke="${c}" stroke-width="1.2" opacity="0.5"/>
   <path d="M3,20 Q3,4 12,4 Q21,4 21,20" fill="none" stroke="${c}" stroke-width="1" opacity="0.3"/>
   <circle cx="12" cy="20" r="2.5" fill="${c}"/>`,
  24, 24, 'none', c, c
);

// Satellite — plus body with solar panels
const SVG_SATELLITE = (c: string) => buildIcon(
  `<rect x="10" y="4" width="4" height="16" fill="${c}"/>
   <rect x="2" y="9" width="20" height="6" fill="${c}"/>
   <circle cx="12" cy="12" r="3" fill="#0A0E17" stroke="${c}" stroke-width="1.2"/>`,
  24, 24, c, '#0A0E17', c
);

// Supply/logistics convoy — truck silhouette
const SVG_SUPPLY = (c: string) => buildIcon(
  `<rect x="5" y="8" width="14" height="10" fill="${c}" fill-opacity="0.7"/>
   <rect x="3" y="12" width="6" height="6" fill="${c}"/>
   <circle cx="8" cy="19" r="2" fill="#0A0E17" stroke="${c}"/>
   <circle cx="17" cy="19" r="2" fill="#0A0E17" stroke="${c}"/>`,
  24, 24, c, '#0A0E17', c
);

// SIGINT emitter — circle with signal waves
const SVG_SIGINT = (c: string) => buildIcon(
  `<circle cx="12" cy="14" r="3" fill="${c}"/>
   <path d="M7,10 Q12,5 17,10" fill="none" stroke="${c}" stroke-width="1.5" opacity="0.8"/>
   <path d="M4,7 Q12,0 20,7" fill="none" stroke="${c}" stroke-width="1" opacity="0.5"/>
   <line x1="12" y1="17" x2="12" y2="22" stroke="${c}" stroke-width="1.5"/>`,
  24, 24, 'none', c, c
);

// ── Icon Registry ─────────────────────────────────────────────────────────────
type IconPalette = {
  civil_plane: string; mil_jet: string; drone: string;
  destroyer: string;   carrier: string; submarine: string;
  nuclear_plant: string; military_base: string; missile_site: string;
  radar: string; satellite: string; supply: string; sigint: string;
};

function getPalette(isCyber: boolean): IconPalette {
  if (isCyber) {
    const p = '#9400D3', s = '#c084fc';
    return {
      civil_plane: p, mil_jet: p, drone: s,
      destroyer: p,   carrier: s, submarine: p,
      nuclear_plant: s, military_base: p, missile_site: s,
      radar: p, satellite: s, supply: p, sigint: s,
    };
  }
  return {
    civil_plane:  '#00F0FF',   // cyan — civil air
    mil_jet:      '#FFB800',   // amber — friendly military
    drone:        '#FF00FF',   // magenta — UAV
    destroyer:    '#00FF88',   // green — naval
    carrier:      '#FF3399',   // pink — carrier
    submarine:    '#7FFF00',   // chartreuse — sub
    nuclear_plant:'#39FF14',   // lime — nuclear
    military_base:'#FFB800',   // amber — military base
    missile_site: '#FF6600',   // orange — SAM
    radar:        '#00FF88',   // green — SIGINT/EW
    satellite:    '#c084fc',   // violet — space
    supply:       '#FF8C00',   // orange — logistics
    sigint:       '#00FFAA',   // teal — emitter
  };
}

function buildIconSvg(name: keyof IconPalette, isCyber: boolean): string {
  const p = getPalette(isCyber);
  const c = p[name];
  switch (name) {
    case 'civil_plane':   return SVG_CIVIL_PLANE(c);
    case 'mil_jet':       return SVG_MIL_JET(c);
    case 'drone':         return SVG_DRONE(c);
    case 'destroyer':     return SVG_DESTROYER(c);
    case 'carrier':       return SVG_CARRIER(c);
    case 'submarine':     return SVG_SUBMARINE(c);
    case 'nuclear_plant': return SVG_NUCLEAR(c);
    case 'military_base': return SVG_BASE(c);
    case 'missile_site':  return SVG_MISSILE(c);
    case 'radar':         return SVG_RADAR(c);
    case 'satellite':     return SVG_SATELLITE(c);
    case 'supply':        return SVG_SUPPLY(c);
    case 'sigint':        return SVG_SIGINT(c);
    default:              return SVG_CIVIL_PLANE(c);
  }
}

function registerTacticalIcons(m: maplibregl.Map, isCyber: boolean) {
  const suffix = isCyber ? '-cyber' : '-std';
  const names: Array<keyof IconPalette> = [
    'civil_plane', 'mil_jet', 'drone',
    'destroyer', 'carrier', 'submarine',
    'nuclear_plant', 'military_base', 'missile_site',
    'radar', 'satellite', 'supply', 'sigint',
  ];

  names.forEach(name => {
    const id = `${name}${suffix}`;
    if (m.hasImage(id)) m.removeImage(id);
    const svg = buildIconSvg(name, isCyber);
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url  = URL.createObjectURL(blob);
    const img  = new Image(48, 48);   // 48×48 canvas at pixelRatio:2 → 24px on screen
    img.onload = () => {
      if (!m.hasImage(id)) m.addImage(id, img, { pixelRatio: 2 });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}



// ─── Strategic Chokepoints ───────────────────────────────────────────────────
const CHOKEPOINTS_GEOJSON: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', geometry: { type: 'Point', coordinates: [56.5, 26.5] },  properties: { name: 'HORMUZ',    importance: 'CRITICAL', throughput: '21M bbl/day' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [103.8, 1.2] },  properties: { name: 'MALACCA',   importance: 'CRITICAL', throughput: '100k ships/yr' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [32.5, 30.5] },  properties: { name: 'SUEZ',      importance: 'CRITICAL', throughput: '12% world trade' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [120.0, 23.5] }, properties: { name: 'TAIWAN STR',importance: 'CRITICAL', throughput: 'NATO flashpoint' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [43.5, 12.5] },  properties: { name: 'BAB-MANDEB',importance: 'HIGH',     throughput: '6.2M bbl/day' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [-5.3, 36.0] },  properties: { name: 'GIBRALTAR', importance: 'HIGH',     throughput: 'NATO med entry' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [-20.0, 64.0] }, properties: { name: 'GIUK GAP',  importance: 'HIGH',     throughput: 'NATO N-Atl ASW' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [114.0, 12.0] }, properties: { name: 'S-CHINA SEA',importance: 'CRITICAL', throughput: '$5T trade/yr' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [-80.0, 9.0] },  properties: { name: 'PANAMA',    importance: 'HIGH',     throughput: '6% world trade' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [29.1, 41.0] },  properties: { name: 'BOSPHORUS', importance: 'HIGH',     throughput: 'Black Sea access' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [18.0, 62.0] },  properties: { name: 'BALTIC ENT',importance: 'MEDIUM',   throughput: 'NATO Baltic access' } },
  ],
};

// ─── Nuclear Facilities (Global Operational Reactors — OSINT) ────────────────
const NUCLEAR_GEOJSON: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    // India
    { type: 'Feature', geometry: { type: 'Point', coordinates: [76.02, 10.17] }, properties: { name: 'Kudankulam NPP', country: 'IN', type: 'Power Reactor', capacity: '2000 MWe', status: 'OPERATIONAL' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [74.19, 17.02] }, properties: { name: 'Tarapur NPP', country: 'IN', type: 'Power Reactor', capacity: '320 MWe', status: 'OPERATIONAL' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [79.58, 28.04] }, properties: { name: 'Narora NPP', country: 'IN', type: 'Power Reactor', capacity: '440 MWe', status: 'OPERATIONAL' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [79.97, 22.54] }, properties: { name: 'Kakrapar NPP', country: 'IN', type: 'Power Reactor', capacity: '440 MWe', status: 'OPERATIONAL' } },
    // China
    { type: 'Feature', geometry: { type: 'Point', coordinates: [114.53, 22.6] },  properties: { name: 'Daya Bay NPP', country: 'CN', type: 'Power Reactor', capacity: '1944 MWe', status: 'OPERATIONAL' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [121.98, 30.42] }, properties: { name: 'Qinshan NPP', country: 'CN', type: 'Power Reactor', capacity: '2500 MWe', status: 'OPERATIONAL' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [118.64, 35.86] }, properties: { name: 'Tianwan NPP', country: 'CN', type: 'Power Reactor', capacity: '4688 MWe', status: 'OPERATIONAL' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [104.62, 30.06] }, properties: { name: 'Fangchenggang NPP', country: 'CN', type: 'Power Reactor', capacity: '2000 MWe', status: 'OPERATIONAL' } },
    // Russia
    { type: 'Feature', geometry: { type: 'Point', coordinates: [59.5, 56.8] },   properties: { name: 'Beloyarsk NPP', country: 'RU', type: 'Fast Breeder', capacity: '1485 MWe', status: 'OPERATIONAL' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [37.2, 57.9] },   properties: { name: 'Kalinin NPP', country: 'RU', type: 'Power Reactor', capacity: '4000 MWe', status: 'OPERATIONAL' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [27.7, 60.4] },   properties: { name: 'Leningrad NPP', country: 'RU', type: 'Power Reactor', capacity: '4000 MWe', status: 'OPERATIONAL' } },
    // Pakistan
    { type: 'Feature', geometry: { type: 'Point', coordinates: [66.76, 25.04] }, properties: { name: 'Karachi NPP', country: 'PK', type: 'Power Reactor', capacity: '650 MWe', status: 'OPERATIONAL' } },
    // USA
    { type: 'Feature', geometry: { type: 'Point', coordinates: [-74.3, 40.6] },  properties: { name: 'Oyster Creek NPP', country: 'US', type: 'Power Reactor', capacity: '619 MWe', status: 'DECOMMISSIONED' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [-121.4, 37.0] }, properties: { name: 'Diablo Canyon NPP', country: 'US', type: 'Power Reactor', capacity: '2256 MWe', status: 'OPERATIONAL' } },
    // France
    { type: 'Feature', geometry: { type: 'Point', coordinates: [4.73, 43.45] },  properties: { name: 'Marcoule', country: 'FR', type: 'Enrichment', capacity: 'Weapons-grade', status: 'OPERATIONAL' } },
    // North Korea
    { type: 'Feature', geometry: { type: 'Point', coordinates: [125.9, 39.7] },  properties: { name: 'Yongbyon', country: 'KP', type: 'Enrichment/Reprocessing', capacity: 'Weapons program', status: 'ACTIVE' } },
    // Iran
    { type: 'Feature', geometry: { type: 'Point', coordinates: [50.8, 29.0] },   properties: { name: 'Bushehr NPP', country: 'IR', type: 'Power Reactor', capacity: '1000 MWe', status: 'OPERATIONAL' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [52.3, 33.7] },   properties: { name: 'Natanz Enrichment', country: 'IR', type: 'Enrichment', capacity: 'Weapons-grade', status: 'ACTIVE' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [59.1, 35.7] },   properties: { name: 'Fordow FEP', country: 'IR', type: 'Enrichment', capacity: '60% enrichment', status: 'ACTIVE' } },
  ],
};

// ─── Global Military Bases (Foreign / Expeditionary) — OSINT ─────────────────
const BASES_GEOJSON: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', geometry: { type: 'Point', coordinates: [43.16, 11.55] }, properties: { name: 'Camp Lemonnier', country: 'US', host: 'DJ', type: 'CENTCOM FWD Base', status: 'ACTIVE', personnel: '4000+' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [56.36, 26.17] }, properties: { name: 'NSA Bahrain (5th Fleet)', country: 'US', host: 'BH', type: 'Naval HQ', status: 'ACTIVE', personnel: '7000' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [51.56, 25.85] }, properties: { name: 'Al Udeid AB', country: 'US', host: 'QA', type: 'Air Base / CENTCOM', status: 'ACTIVE', personnel: '10000' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [49.98, 26.28] }, properties: { name: 'Dhahran AB', country: 'US', host: 'SA', type: 'Air Base', status: 'ACTIVE', personnel: '2500' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [67.2, 37.2] },   properties: { name: 'Manas Transit Center', country: 'US', host: 'KG', type: 'Air Transit', status: 'CLOSED', personnel: '0' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [128.0, 26.35] }, properties: { name: 'Kadena AB', country: 'US', host: 'JP', type: 'Air Base / PACAF', status: 'ACTIVE', personnel: '18000' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [127.77, 26.27] },properties: { name: 'Camp Foster / Futenma', country: 'US', host: 'JP', type: 'Marine Corps', status: 'ACTIVE', personnel: '25000' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [127.0, 37.12] }, properties: { name: 'Osan AB / Camp Humphreys', country: 'US', host: 'KR', type: 'Air Base / Army', status: 'ACTIVE', personnel: '40000' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [103.5, 1.36] },  properties: { name: 'Changi NB (Rotn)', country: 'US', host: 'SG', type: 'Naval Rotation', status: 'ACTIVE', personnel: '250' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [72.39, 7.31] },  properties: { name: 'Diego Garcia (BIOT)', country: 'US/UK', host: 'IO', type: 'Strategic Bomber/Naval', status: 'ACTIVE', personnel: '3000' } },
    // China
    { type: 'Feature', geometry: { type: 'Point', coordinates: [43.14, 11.55] }, properties: { name: 'PLA Base Djibouti', country: 'CN', host: 'DJ', type: 'Naval Logistics', status: 'ACTIVE', personnel: '400' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [111.5, 16.85] }, properties: { name: 'Fiery Cross Reef', country: 'CN', host: 'SCS', type: 'Artificial Island AB', status: 'ACTIVE', personnel: '200' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [112.9, 10.72] }, properties: { name: 'Subi Reef', country: 'CN', host: 'SCS', type: 'Artificial Island', status: 'ACTIVE', personnel: '200' } },
    // Russia
    { type: 'Feature', geometry: { type: 'Point', coordinates: [37.04, 35.52] }, properties: { name: 'Hmeimim AB', country: 'RU', host: 'SY', type: 'Air Base', status: 'ACTIVE', personnel: '5000' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [36.11, 34.89] }, properties: { name: 'Tartus Naval Base', country: 'RU', host: 'SY', type: 'Naval Base', status: 'ACTIVE', personnel: '1000' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [32.89, 39.94] }, properties: { name: 'Incirlik AB', country: 'US/NATO', host: 'TR', type: 'Nuclear sharing AB', status: 'ACTIVE', personnel: '5000' } },
    // India
    { type: 'Feature', geometry: { type: 'Point', coordinates: [55.52, -4.68] }, properties: { name: 'INS Kalvari (Assumption)', country: 'IN', host: 'SC', type: 'Naval Facility', status: 'PLANNED', personnel: '0' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [73.6, 15.46] },  properties: { name: 'INS Hansa Goa', country: 'IN', host: 'IN', type: 'Naval Air Station', status: 'ACTIVE', personnel: '3000' } },
  ],
};

// ─── Undersea Cables (Critical Infrastructure) ───────────────────────────────
const CABLES_GEOJSON: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', geometry: { type: 'LineString', coordinates: [[72.8,18.9],[56.4,24.5],[43.3,11.6],[36.8,-1.3],[39.2,-6.8],[44.3,-11.7]] }, properties: { name: 'SEA-ME-WE 5', operator: 'Consortium', capacity: '24 Tbps', significance: 'Europe–Asia critical link' } },
    { type: 'Feature', geometry: { type: 'LineString', coordinates: [[-74.0,40.7],[-8.8,38.7],[-7.3,37.1],[12.3,45.4]] }, properties: { name: 'TAT-14', operator: 'AT&T/BT/DT', capacity: '3.2 Tbps', significance: 'Trans-Atlantic NATO' } },
    { type: 'Feature', geometry: { type: 'LineString', coordinates: [[103.8,1.2],[120.9,14.6],[130.5,35.3],[139.6,35.7]] }, properties: { name: 'APG (Asia Pacific Gateway)', operator: 'Telkom/NTT', capacity: '54.8 Tbps', significance: 'Intra-Asia backbone' } },
    { type: 'Feature', geometry: { type: 'LineString', coordinates: [[-122.4,37.8],[-157.8,21.3],[144.7,13.4],[130.5,35.3],[139.6,35.7]] }, properties: { name: 'FASTER', operator: 'Google/SoftBank', capacity: '60 Tbps', significance: 'US–Japan tech backbone' } },
    { type: 'Feature', geometry: { type: 'LineString', coordinates: [[-73.9,40.7],[-8.7,38.7],[12.3,45.4],[28.9,41.0],[34.0,36.9],[35.5,33.9]] }, properties: { name: 'MedNautilus', operator: 'Turkcell', capacity: '3.84 Tbps', significance: 'NATO Med. backbone' } },
    { type: 'Feature', geometry: { type: 'LineString', coordinates: [[72.8,18.9],[80.3,6.9],[103.8,1.2]] }, properties: { name: 'India–SG (I2I)', operator: 'BSNL/SingTel', capacity: '8.4 Tbps', significance: 'India–ASEAN link' } },
  ],
};

// ─── Missile Battery Sites (SAM/IRBM) — OSINT ────────────────────────────────
const MISSILES_GEOJSON: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', geometry: { type: 'Point', coordinates: [77.2, 28.6] },   properties: { name: 'Delhi IAF S-400 Site', country: 'IN', system: 'S-400 Triumf', range: '400km', status: 'OPERATIONAL' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [72.9, 19.1] },   properties: { name: 'Mumbai IAF S-400', country: 'IN', system: 'S-400 Triumf', range: '400km', status: 'ACTIVE' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [116.4, 39.9] },  properties: { name: 'Beijing HQ-9 Battery', country: 'CN', system: 'HQ-9B', range: '200km', status: 'OPERATIONAL' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [121.5, 25.0] },  properties: { name: 'Taipei PAC-3 Battery', country: 'TW', system: 'PAC-3 MSE', range: '70km', status: 'OPERATIONAL' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [128.0, 36.5] },  properties: { name: 'THAAD Seongju', country: 'US', system: 'THAAD', range: '200km', status: 'OPERATIONAL' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [36.8, 56.9] },   properties: { name: 'Dubna S-400 Moscow', country: 'RU', system: 'S-400 Triumf', range: '400km', status: 'OPERATIONAL' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [50.5, 26.0] },   properties: { name: 'Bahrain PAC-3', country: 'US', system: 'PAC-3', range: '70km', status: 'OPERATIONAL' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [53.7, 24.5] },   properties: { name: 'Al Dhafra PAC-3', country: 'US', system: 'PAC-3 / THAAD', range: '200km', status: 'OPERATIONAL' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [125.8, 39.0] },  properties: { name: 'DPRK KN-23 Battery', country: 'KP', system: 'KN-23 SRBM', range: '690km', status: 'ACTIVE' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [51.6, 35.7] },   properties: { name: 'Tehran HQ-9 Battery', country: 'IR', system: 'HQ-9 (Bavar-373)', range: '200km', status: 'OPERATIONAL' } },
  ],
};

// ─── EW / A2AD Denial Zones (Electronic Warfare / Anti-Access) ───────────────
const EW_ZONES_GEOJSON: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', geometry: { type: 'Point', coordinates: [112.0, 16.0] },  properties: { name: 'SCS A2/AD Bubble (CN)', system: 'HQ-9/DF-26/J-20', radius_km: 900, type: 'A2AD' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [37.0, 35.5] },   properties: { name: 'Syria A2/AD (RU)', system: 'S-400/Krasukha-4 EW', radius_km: 400, type: 'A2AD' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [37.6, 55.7] },   properties: { name: 'Moscow Zone (RU)', system: 'S-500/A-235 PRS', radius_km: 600, type: 'A2AD' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [51.5, 35.7] },   properties: { name: 'Tehran A2/AD (IR)', system: 'Bavar-373/Khordad-15', radius_km: 350, type: 'A2AD' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [125.9, 39.0] },  properties: { name: 'DPRK A2/AD Zone', system: 'KN-23/Hwasong-15', radius_km: 500, type: 'A2AD' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [22.5, 54.5] },   properties: { name: 'Kaliningrad IADS (RU)', system: 'S-400/Iskander/EW', radius_km: 400, type: 'IADS' } },
  ],
};

// ─── SIGINT Emitter Sites (Radar / DF / ELINT) — OSINT ───────────────────────
const EMITTERS_GEOJSON: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', geometry: { type: 'Point', coordinates: [88.37, 22.56] }, properties: { name: 'Sriniketan OTHR', country: 'IN', type: 'Over-Horizon Radar', band: 'HF', coverage: '3000km' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [77.7, 8.1] },    properties: { name: 'Kanyakumari NSigC', country: 'IN', type: 'Naval SIGINT Station', band: 'HF/VHF/UHF', coverage: 'IO basin' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [72.39, 7.31] },  properties: { name: 'Diego Garcia SIGINT', country: 'US', type: 'Ground Station / SIGINT', band: 'All', coverage: 'Global' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [134.0, 34.8] },  properties: { name: 'Misawa SIGINT', country: 'US/JP', type: 'ECHELON Node', band: 'HF/SHF', coverage: 'Asia-Pac' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [114.0, 22.3] },  properties: { name: 'Hong Kong SIGINT (CN)', country: 'CN', type: 'ELINT Station', band: 'VHF/UHF', coverage: 'SCS' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [30.5, 50.5] },   properties: { name: 'Kyiv GRU SIGINT', country: 'RU', type: 'Direction Finding', band: 'HF', coverage: 'Europe' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [-77.0, 38.9] },  properties: { name: 'NSA Fort Meade', country: 'US', type: 'Global SIGINT HQ', band: 'All', coverage: 'Global' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [-2.1, 52.1] },   properties: { name: 'GCHQ Bude', country: 'UK', type: 'ECHELON / Submarine Cable Tap', band: 'All', coverage: 'Europe/Atl' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [149.1, -35.2] }, properties: { name: 'Pine Gap (AUS)', country: 'US/AU', type: 'CIA/NSA Signals Station', band: 'SHF/EHF', coverage: 'Asia/IO' } },
  ],
};

// ─── STANREP Popup Builder ────────────────────────────────────────────────────
function stanrep(title: string, color: string, rows: Array<[string, string, string?]>) {
  const rowHtml = rows.map(([label, val, valColor]) =>
    `<div class="sr-row"><span class="sr-label">${label}</span><span class="sr-val" style="color:${valColor || '#CBD5E1'}">${val}</span></div>`
  ).join('');
  return `
    <div class="stanrep-card">
      <div class="sr-header" style="border-color:${color}40;color:${color}">${title}</div>
      <div class="sr-grid">${rowHtml}</div>
    </div>`;
}

export default function MapCanvas() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const isLoaded = useRef(false);
  const rafId = useRef<number | null>(null);

  const aircraft  = useADSBStore(state => state.aircraft);
  const ships     = useAISStore(state => state.ships);
  const firmsData = useFIRMSStore(state => state.data);
  const gdeltData = useGDELTStore(state => state.data);
  const osmData   = useOSMStore(state => state.data);
  const assetData = useAssetStore(state => state.data);
  const activeAttacks = useCyberStore(state => state.activeAttacks);
  const satPositions  = useSatelliteStore(state => state.positions);
  const satOrbits     = useSatelliteStore(state => state.orbits);
  const cyberMode     = useCyberStore(state => state.cyberMode);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
        sources: {
          base: {
            type: 'raster',
            // CartoCDN Dark Matter — no API key required, globally reliable
            tiles: ['https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'],
            tileSize: 256,
            attribution: '© CartoDB © OpenStreetMap',
            maxzoom: 19,
          },
        },
        layers: [{ id: 'base', type: 'raster', source: 'base' }],
      },
      center: [75.0, 20.0],
      zoom: 2.8,
      minZoom: 2,
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-left');
    map.current.addControl(new maplibregl.ScaleControl({ unit: 'nautical' }), 'bottom-right');

    map.current.on('load', () => {
      if (!map.current) return;
      isLoaded.current = true;
      const m = map.current;

      // Register OSIRIS-style tactical icons for both standard and cyber themes
      registerTacticalIcons(m, false);
      registerTacticalIcons(m, true);

      // ── Add all GeoJSON sources ──────────────────────────────────────────
      const liveSourceIds = ['adsb', 'ais', 'firms', 'gdelt', 'osm_military', 'assets', 'cyber-attacks', 'satellites', 'satellite-orbits'] as const;
      liveSourceIds.forEach(id => {
        m.addSource(id, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } } as maplibregl.GeoJSONSourceSpecification);
      });

      // Static OSINT intelligence sources (clustered for performance)
      m.addSource('chokepoints', { type: 'geojson', data: CHOKEPOINTS_GEOJSON });
      m.addSource('nuclear', {
        type: 'geojson', data: NUCLEAR_GEOJSON,
        cluster: true, clusterMaxZoom: 5, clusterRadius: 40,
      } as maplibregl.GeoJSONSourceSpecification);
      m.addSource('mil_bases', {
        type: 'geojson', data: BASES_GEOJSON,
        cluster: true, clusterMaxZoom: 4, clusterRadius: 50,
      } as maplibregl.GeoJSONSourceSpecification);
      m.addSource('cables', { type: 'geojson', data: CABLES_GEOJSON });
      m.addSource('missiles', { type: 'geojson', data: MISSILES_GEOJSON });
      m.addSource('ew_zones', { type: 'geojson', data: EW_ZONES_GEOJSON });
      m.addSource('emitters', { type: 'geojson', data: EMITTERS_GEOJSON });

      // ── Cyber overlay ────────────────────────────────────────────────────
      m.addLayer({ id: 'cyber-overlay', type: 'background',
        paint: { 'background-color': '#4B0082', 'background-opacity': 0.25 },
        layout: { visibility: 'none' },
      }, 'base');

      // ── Cyber attack lines ───────────────────────────────────────────────
      m.addLayer({ id: 'cyber-attacks-lines', type: 'line', source: 'cyber-attacks',
        layout: { visibility: 'none' },
        paint: { 'line-color': '#9400D3', 'line-width': 2, 'line-opacity': 0.85, 'line-dasharray': [3, 2] },
      });
      m.addLayer({ id: 'cyber-attacks-targets', type: 'circle', source: 'cyber-attacks',
        layout: { visibility: 'none' },
        paint: { 'circle-radius': 7, 'circle-color': '#FF00FF', 'circle-opacity': 0.6,
                 'circle-stroke-width': 2, 'circle-stroke-color': '#FFFFFF' },
      });

      // ── FIRMS thermal heatmap ────────────────────────────────────────────
      m.addLayer({ id: 'firms-heat', type: 'heatmap', source: 'firms',
        layout: { visibility: 'none' },
        paint: {
          'heatmap-weight': 1,
          'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 9, 3],
          'heatmap-color': ['interpolate', ['linear'], ['heatmap-density'],
            0, 'rgba(0,0,0,0)', 0.2, '#FFB800', 0.5, '#FF6600', 1, '#FF3333'],
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 6, 9, 25],
          'heatmap-opacity': 0.85,
        },
      });

      // ── GDELT conflict events ────────────────────────────────────────────
      m.addLayer({ id: 'gdelt-events', type: 'circle', source: 'gdelt',
        layout: { visibility: 'none' },
        paint: { 'circle-radius': 4, 'circle-color': '#FFB800', 'circle-opacity': 0.8,
                 'circle-stroke-width': 1, 'circle-stroke-color': '#FF6600' },
      });

      // ── OSM military installations ───────────────────────────────────────
      m.addLayer({ id: 'osm-military-dots', type: 'circle', source: 'osm_military',
        layout: { visibility: 'none' },
        paint: { 'circle-radius': 4, 'circle-color': '#FFB800', 'circle-opacity': 0.9,
                 'circle-stroke-width': 1, 'circle-stroke-color': '#FF3333' },
      });

      // ── Undersea cables ──────────────────────────────────────────────────
      m.addLayer({ id: 'cables-layer', type: 'line', source: 'cables',
        layout: { visibility: 'none', 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#00FF88', 'line-width': 1.5, 'line-opacity': 0.7, 'line-dasharray': [2, 3] },
      });

      // ── EW / A2AD zones ──────────────────────────────────────────────────
      m.addLayer({ id: 'ew-zones-layer', type: 'circle', source: 'ew_zones',
        layout: { visibility: 'none' },
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 3, 18, 6, 60],
          'circle-color': 'rgba(255,50,50,0)',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#FF3333',
          'circle-opacity': 0.7,
          'circle-stroke-opacity': 0.6,
        },
      });
      m.addLayer({ id: 'ew-zones-labels', type: 'symbol', source: 'ew_zones',
        layout: { visibility: 'none', 'text-field': ['get', 'name'], 'text-size': 9,
                  'text-anchor': 'center', 'text-font': ['Open Sans Regular'], 'text-optional': true },
        paint: { 'text-color': '#FF6666', 'text-halo-color': '#0A0E17', 'text-halo-width': 2 },
      });

      // ── SIGINT emitter sites ─────────────────────────────────────────────
      m.addLayer({ id: 'emitters-layer', type: 'circle', source: 'emitters',
        layout: { visibility: 'none' },
        paint: { 'circle-radius': 6, 'circle-color': '#00FF88', 'circle-opacity': 0.85,
                 'circle-stroke-width': 1.5, 'circle-stroke-color': '#00FF88' },
      });
      m.addLayer({ id: 'emitters-labels', type: 'symbol', source: 'emitters',
        layout: { visibility: 'none', 'text-field': ['get', 'name'], 'text-size': 8,
                  'text-anchor': 'top', 'text-offset': [0, 0.8], 'text-font': ['Open Sans Regular'], 'text-optional': true },
        paint: { 'text-color': '#00FF88', 'text-halo-color': '#0A0E17', 'text-halo-width': 2 },
      });

      // ── Missile battery sites ────────────────────────────────────────────
      m.addLayer({ id: 'missiles-layer', type: 'symbol', source: 'missiles',
        layout: {
          visibility: 'none',
          'icon-image': cyberMode ? 'missile_site-cyber' : 'missile_site-std',
          'icon-size': 0.85,
          'icon-allow-overlap': true,
        },
      });
      m.addLayer({ id: 'missiles-labels', type: 'symbol', source: 'missiles',
        layout: { visibility: 'none', 'text-field': ['get', 'system'], 'text-size': 8,
                  'text-anchor': 'top', 'text-offset': [0, 1.2], 'text-font': ['Open Sans Regular'], 'text-optional': true },
        paint: { 'text-color': '#FF6600', 'text-halo-color': '#0A0E17', 'text-halo-width': 2 },
      });

      // ── Nuclear facilities — clustered ────────────────────────────────────
      m.addLayer({ id: 'nuclear-clusters', type: 'circle', source: 'nuclear',
        filter: ['has', 'point_count'],
        layout: { visibility: 'none' },
        paint: { 'circle-radius': 14, 'circle-color': '#39FF14', 'circle-opacity': 0.8,
                 'circle-stroke-width': 2, 'circle-stroke-color': '#0A0E17' },
      });
      m.addLayer({ id: 'nuclear-cluster-count', type: 'symbol', source: 'nuclear',
        filter: ['has', 'point_count'],
        layout: { visibility: 'none', 'text-field': ['get', 'point_count_abbreviated'],
                  'text-size': 10, 'text-font': ['Open Sans Regular'] },
        paint: { 'text-color': '#0A0E17' },
      });
      m.addLayer({ id: 'nuclear-layer', type: 'symbol', source: 'nuclear',
        filter: ['!', ['has', 'point_count']],
        layout: {
          visibility: 'none',
          'icon-image': cyberMode ? 'nuclear_plant-cyber' : 'nuclear_plant-std',
          'icon-size': 0.8,
          'icon-allow-overlap': true,
        },
      });

      // ── Military bases — clustered ────────────────────────────────────────
      m.addLayer({ id: 'bases-clusters', type: 'circle', source: 'mil_bases',
        filter: ['has', 'point_count'],
        layout: { visibility: 'none' },
        paint: { 'circle-radius': 14, 'circle-color': '#FFB800', 'circle-opacity': 0.8,
                 'circle-stroke-width': 2, 'circle-stroke-color': '#0A0E17' },
      });
      m.addLayer({ id: 'bases-cluster-count', type: 'symbol', source: 'mil_bases',
        filter: ['has', 'point_count'],
        layout: { visibility: 'none', 'text-field': ['get', 'point_count_abbreviated'],
                  'text-size': 10, 'text-font': ['Open Sans Regular'] },
        paint: { 'text-color': '#0A0E17' },
      });
      m.addLayer({ id: 'bases-layer', type: 'symbol', source: 'mil_bases',
        filter: ['!', ['has', 'point_count']],
        layout: {
          visibility: 'none',
          'icon-image': cyberMode ? 'military_base-cyber' : 'military_base-std',
          'icon-size': 0.85,
          'icon-allow-overlap': true,
        },
      });
      m.addLayer({ id: 'bases-labels', type: 'symbol', source: 'mil_bases',
        filter: ['!', ['has', 'point_count']],
        layout: { visibility: 'none', 'text-field': ['get', 'name'], 'text-size': 8,
                  'text-anchor': 'top', 'text-offset': [0, 1.0], 'text-font': ['Open Sans Regular'],
                  'text-optional': true, 'text-max-width': 10 },
        paint: { 'text-color': '#FFB800', 'text-halo-color': '#0A0E17', 'text-halo-width': 2 },
      });

      // ── Strategic chokepoints ────────────────────────────────────────────
      m.addLayer({ id: 'chokepoints-pulse', type: 'circle', source: 'chokepoints',
        paint: {
          'circle-radius': 10,
          'circle-color': 'rgba(0,0,0,0)',
          'circle-stroke-width': 2,
          'circle-stroke-color': ['match', ['get', 'importance'], 'CRITICAL', '#FF3333', 'HIGH', '#FFB800', '#00F0FF'],
          'circle-opacity': 0.8,
        },
      });
      m.addLayer({ id: 'chokepoints-labels', type: 'symbol', source: 'chokepoints',
        layout: { 'text-field': ['get', 'name'], 'text-size': 9, 'text-anchor': 'top',
                  'text-offset': [0, 1.0], 'text-optional': true, 'text-font': ['Open Sans Regular'],
                  'text-letter-spacing': 0.1 },
        paint: { 'text-color': '#00F0FF', 'text-halo-color': '#0A0E17', 'text-halo-width': 2 },
      });

      // ── AIS ships — MIL-STD destroyer/frigate symbols ─────────────────────
      m.addLayer({ id: 'ais-ships', type: 'symbol', source: 'ais',
        layout: {
          visibility: 'none',
          'icon-image': cyberMode ? 'destroyer-cyber' : 'destroyer-std',
          'icon-size': 0.9,
          'icon-rotate': ['get', 'cog'],
          'icon-allow-overlap': true,
          'icon-rotation-alignment': 'map',
        },
      });

      // ── ADS-B aircraft — MIL-STD fighter / civil plane symbols ────────────
      m.addLayer({ id: 'adsb-planes', type: 'symbol', source: 'adsb',
        layout: {
          'icon-image': [
            'concat',
            ['case', ['==', ['get', 't'], 'MIL'], 'mil_jet', 'civil_plane'],
            cyberMode ? '-cyber' : '-std'
          ],
          'icon-size': ['case', ['==', ['get', 'emergency'], true], 1.1, 0.85],
          'icon-rotate': ['get', 'track'],
          'icon-allow-overlap': true,
          'icon-rotation-alignment': 'map',
        },
      });

      // ── Strategic assets layer — type-matched MIL-STD symbols ─────────────
      m.addLayer({ id: 'assets-layer-pulse', type: 'symbol', source: 'assets',
        layout: {
          'icon-image': ['concat',
            ['match', ['get', 'type'],
              'aircraft_carrier', 'carrier',
              'submarine',        'submarine',
              'destroyer',        'destroyer',
              'frigate',          'destroyer',     // maps to destroyer shape
              'nuclear_plant',    'nuclear_plant',
              'enrichment_area',  'nuclear_plant',
              'defense_rd',       'radar',         // radar shape for R&D
              'manufacturing',    'military_base', // base shape for factory
              'drone',            'drone',
              'logistics_convoy', 'supply',
              'maritime_supply',  'destroyer',
              'military_base',    'military_base',
              'radar',            'radar',
              'nuclear_plant'  // fallback
            ],
            cyberMode ? '-cyber' : '-std'
          ],
          'icon-size': 0.9,
          'icon-allow-overlap': true,
        },
      });
      m.addLayer({ id: 'assets-layer-labels', type: 'symbol', source: 'assets',
        layout: {
          'text-field': ['get', 'name'], 'text-size': 8, 'text-anchor': 'bottom',
          'text-offset': [0, -1.2], 'text-optional': true, 'text-font': ['Open Sans Regular'],
        },
        paint: { 'text-color': '#CBD5E1', 'text-halo-color': '#0A0E17', 'text-halo-width': 1.5 },
      });

      // ── Satellite orbital ground tracks ──────────────────────────────────
      m.addLayer({ id: 'satellites-orbits', type: 'line', source: 'satellite-orbits',
        paint: { 'line-color': cyberMode ? '#9400D3' : '#c084fc',
                 'line-width': 1, 'line-opacity': 0.35, 'line-dasharray': [4, 4] },
      });
      m.addLayer({ id: 'satellites-layer', type: 'symbol', source: 'satellites',
        layout: {
          'icon-image': cyberMode ? 'satellite-cyber' : 'satellite-std',
          'icon-size': 0.95,
          'icon-allow-overlap': true,
        },
      });

      // ── Click popup handlers ──────────────────────────────────────────────
      const popup = new maplibregl.Popup({
        closeButton: true, closeOnClick: false, maxWidth: '320px',
      });

      const onLayerClick = (layerId: string, html: (p: Record<string, any>) => string) => {
        m.on('click', layerId, (e) => {
          if (!e.features?.length) return;
          const p = e.features[0].properties as Record<string, any>;
          const coords = (e.features[0].geometry as GeoJSON.Point).coordinates as [number, number];
          popup.setLngLat(coords).setHTML(html(p)).addTo(m);
        });
        m.on('mouseenter', layerId, () => { m.getCanvas().style.cursor = 'crosshair'; });
        m.on('mouseleave', layerId, () => { m.getCanvas().style.cursor = ''; });
      };

      // Aircraft STANREP
      onLayerClick('adsb-planes', (p) => stanrep(
        `${p.t === 'MIL' ? '✈ MIL AIR TRACK' : '✈ CIV AIR TRACK'} — ${p.flight || p.hex}`,
        p.t === 'MIL' ? '#FFB800' : '#00F0FF',
        [
          ['CLASSIFICATION', p.t === 'MIL' ? 'MILITARY / FIGHTER' : 'CIVIL / TRANSPORT', p.t === 'MIL' ? '#FFB800' : '#00F0FF'],
          ['ICAO HEX',    p.hex     || '—'],
          ['CALLSIGN',    p.flight  || '—'],
          ['SQUAWK',      p.squawk  || '—', ['7700','7500','7600'].includes(p.squawk) ? '#FF3333' : undefined],
          ['ALTITUDE',    p.alt_geom ? `${Math.round(p.alt_geom).toLocaleString()} ft` : '—'],
          ['SPEED',       p.gs  ? `${Math.round(p.gs)} kt` : '—'],
          ['HEADING',     p.track ? `${Math.round(p.track)}°` : '—'],
          ['COUNTRY',     p.country || 'Unknown'],
          ['STATUS',      p.emergency ? '⚠ EMERGENCY' : 'NOMINAL', p.emergency ? '#FF3333' : '#39FF14'],
        ]
      ));

      // Naval ship STANREP
      onLayerClick('ais-ships', (p) => stanrep(
        `⚓ SURFACE VESSEL — ${p.name || 'UNKNOWN'}`,
        '#00FF88',
        [
          ['MMSI',     p.mmsi   || '—'],
          ['SOG',      p.sog != null ? `${p.sog} kt` : '—'],
          ['COG',      p.cog != null ? `${Math.round(p.cog)}°` : '—'],
          ['VESSEL TYPE', p.type || 'Unknown'],
          ['FLAG',     p.flag   || '—'],
        ]
      ));

      // Chokepoint STANREP
      onLayerClick('chokepoints-pulse', (p) => stanrep(
        `⬡ STRATEGIC CHOKEPOINT — ${p.name}`,
        p.importance === 'CRITICAL' ? '#FF3333' : '#FFB800',
        [
          ['IMPORTANCE',  p.importance, p.importance === 'CRITICAL' ? '#FF3333' : '#FFB800'],
          ['THROUGHPUT',  p.throughput || '—'],
          ['TYPE',        'Strategic Maritime Chokepoint'],
        ]
      ));

      // Nuclear facility STANREP
      onLayerClick('nuclear-layer', (p) => stanrep(
        `☢ NUCLEAR FACILITY — ${p.name}`,
        '#39FF14',
        [
          ['COUNTRY',    p.country || '—'],
          ['FACILITY TYPE', p.type || '—'],
          ['CAPACITY',   p.capacity || '—'],
          ['STATUS',     p.status || '—', p.status === 'OPERATIONAL' ? '#39FF14' : p.status === 'ACTIVE' ? '#FFB800' : '#FF3333'],
        ]
      ));

      // Military base STANREP
      onLayerClick('bases-layer', (p) => stanrep(
        `◈ MILITARY BASE — ${p.name}`,
        '#FFB800',
        [
          ['OPERATOR',   p.country  || '—'],
          ['HOST NATION',p.host     || '—'],
          ['BASE TYPE',  p.type     || '—'],
          ['PERSONNEL',  p.personnel|| '—'],
          ['STATUS',     p.status || '—', p.status === 'ACTIVE' ? '#39FF14' : '#FF6600'],
        ]
      ));

      // Undersea cable STANREP
      onLayerClick('cables-layer', (p) => stanrep(
        `▬ UNDERSEA CABLE — ${p.name}`,
        '#00FF88',
        [
          ['OPERATOR',   p.operator      || '—'],
          ['CAPACITY',   p.capacity      || '—'],
          ['SIGNIFICANCE', p.significance || '—'],
        ]
      ));

      // Missile site STANREP
      onLayerClick('missiles-layer', (p) => stanrep(
        `◉ MISSILE BATTERY — ${p.name}`,
        '#FF6600',
        [
          ['COUNTRY',   p.country || '—'],
          ['SYSTEM',    p.system  || '—', '#FFB800'],
          ['RANGE',     p.range   || '—'],
          ['STATUS',    p.status  || '—', p.status === 'OPERATIONAL' ? '#39FF14' : '#FFB800'],
        ]
      ));

      // EW zone STANREP
      onLayerClick('ew-zones-layer', (p) => stanrep(
        `⊗ A2/AD DENIAL ZONE — ${p.name}`,
        '#FF3333',
        [
          ['SYSTEM',    p.system     || '—', '#FF6600'],
          ['RADIUS',    p.radius_km ? `${p.radius_km} km` : '—'],
          ['TYPE',      p.type       || '—'],
        ]
      ));

      // SIGINT emitter STANREP
      onLayerClick('emitters-layer', (p) => stanrep(
        `◈ SIGINT EMITTER — ${p.name}`,
        '#00FF88',
        [
          ['COUNTRY',   p.country  || '—'],
          ['TYPE',      p.type     || '—'],
          ['BAND',      p.band     || '—'],
          ['COVERAGE',  p.coverage || '—'],
        ]
      ));

      // Asset facility STANREP
      onLayerClick('assets-layer-pulse', (p) => stanrep(
        `✦ STRATEGIC ASSET — ${p.name || 'UNKNOWN'}`,
        '#FFB800',
        [
          ['CLASSIFICATION', String(p.type || '').replace(/_/g, ' ').toUpperCase(), '#FFD700'],
          ['STATUS',    p.status  || 'OPERATIONAL', '#39FF14'],
          ['COUNTRY',   p.country || 'GLOBAL'],
          ['DETAILS',   p.details || 'No further data'],
          ...(p.speed   ? [['SPEED', `${p.speed} kt`] as [string, string]] : []),
          ...(p.heading ? [['HEADING', `${p.heading}°`] as [string, string]] : []),
          ...(p.class   ? [['VESSEL CLASS', String(p.class).replace(/_/g, ' ').toUpperCase()] as [string, string]] : []),
        ]
      ));

      // Satellite STANREP
      onLayerClick('satellites-layer', (p) => stanrep(
        `🛰 ORBITAL TRACK — ${p.name}`,
        '#c084fc',
        [
          ['COUNTRY',    p.country    || '—'],
          ['ALTITUDE',   p.altitude ? `${p.altitude} km` : '—'],
          ['INCLINATION',p.inclination ? `${p.inclination}°` : '—'],
          ['ORBIT PERIOD', p.period ? `${Math.round(p.period / 60)} min` : '—'],
          ['TYPE',       String(p.type || '').toUpperCase()],
        ]
      ));

      return () => {
        map.current?.remove();
        map.current = null;
        isLoaded.current = false;
      };
    });
  }, []);

  // ── Live data source updates ──────────────────────────────────────────────

  // ADS-B via RAF batching
  useEffect(() => {
    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      if (!map.current || !isLoaded.current) return;
      const src = map.current.getSource('adsb') as maplibregl.GeoJSONSource;
      if (!src) return;
      const features: Feature[] = Object.values(aircraft)
        .filter(ac => ac.lat != null && ac.lon != null)
        .map(ac => ({
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: [ac.lon!, ac.lat!] },
          properties: { ...ac },
        }));
      src.setData({ type: 'FeatureCollection', features });
    });
  }, [aircraft]);

  // AIS ships
  useEffect(() => {
    if (!map.current || !isLoaded.current) return;
    const src = map.current.getSource('ais') as maplibregl.GeoJSONSource;
    if (!src) return;
    const features: Feature[] = Object.values(ships)
      .filter(s => s.lat != null && s.lon != null)
      .map(s => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [s.lon, s.lat] },
        properties: { ...s },
      }));
    src.setData({ type: 'FeatureCollection', features });
  }, [ships]);

  // FIRMS thermal
  useEffect(() => {
    if (!map.current || !isLoaded.current || !firmsData) return;
    const src = map.current.getSource('firms') as maplibregl.GeoJSONSource;
    if (src) src.setData(firmsData as FeatureCollection);
  }, [firmsData]);

  // GDELT events
  useEffect(() => {
    if (!map.current || !isLoaded.current || !gdeltData) return;
    const src = map.current.getSource('gdelt') as maplibregl.GeoJSONSource;
    if (src) src.setData(gdeltData as FeatureCollection);
  }, [gdeltData]);

  // OSM military
  useEffect(() => {
    if (!map.current || !isLoaded.current || !osmData) return;
    const src = map.current.getSource('osm_military') as maplibregl.GeoJSONSource;
    if (src) src.setData(osmData as FeatureCollection);
  }, [osmData]);

  // Strategic assets
  useEffect(() => {
    if (!map.current || !isLoaded.current || !assetData) return;
    const src = map.current.getSource('assets') as maplibregl.GeoJSONSource;
    if (src) src.setData(assetData as FeatureCollection);
  }, [assetData]);

  // Satellite positions
  useEffect(() => {
    if (!map.current || !isLoaded.current || !satPositions) return;
    const src = map.current.getSource('satellites') as maplibregl.GeoJSONSource;
    if (src) src.setData(satPositions as FeatureCollection);
  }, [satPositions]);

  // Satellite orbits
  useEffect(() => {
    if (!map.current || !isLoaded.current || !satOrbits) return;
    const src = map.current.getSource('satellite-orbits') as maplibregl.GeoJSONSource;
    if (src) src.setData(satOrbits as FeatureCollection);
  }, [satOrbits]);

  // Cyber attacks
  useEffect(() => {
    if (!map.current || !isLoaded.current) return;
    const src = map.current.getSource('cyber-attacks') as maplibregl.GeoJSONSource;
    if (!src) return;
    const features: Feature[] = activeAttacks.map(atk => ({
      type: 'Feature' as const,
      geometry: {
        type: 'LineString' as const,
        coordinates: [
          [atk.attacker_coords[0], atk.attacker_coords[1]],
          [atk.target_coords[0],   atk.target_coords[1]],
        ],
      },
      properties: { ...atk },
    }));
    src.setData({ type: 'FeatureCollection', features });
  }, [activeAttacks]);

  // Cyber mode icon swap
  useEffect(() => {
    const m = map.current;
    if (!m || !isLoaded.current) return;
    const suffix = cyberMode ? '-cyber' : '-std';

    // Re-register symbols for new mode
    registerTacticalIcons(m, cyberMode);

    if (m.getLayer('cyber-overlay'))
      m.setLayoutProperty('cyber-overlay', 'visibility', cyberMode ? 'visible' : 'none');
    if (m.getLayer('cyber-attacks-lines'))
      m.setLayoutProperty('cyber-attacks-lines', 'visibility', cyberMode ? 'visible' : 'none');
    if (m.getLayer('cyber-attacks-targets'))
      m.setLayoutProperty('cyber-attacks-targets', 'visibility', cyberMode ? 'visible' : 'none');

    // Update icon images for all symbol layers (after images load, ~200ms delay)
    setTimeout(() => {
      if (!m.getLayer) return;
      const setIcon = (layer: string, icon: string) => { if (m.getLayer(layer)) m.setLayoutProperty(layer, 'icon-image', icon); };
      setIcon('ais-ships',         `destroyer${suffix}`);
      setIcon('satellites-layer',  `satellite${suffix}`);
      setIcon('missiles-layer',    `missile_site${suffix}`);
      setIcon('nuclear-layer',     `nuclear_plant${suffix}`);
      setIcon('bases-layer',       `military_base${suffix}`);
      if (m.getLayer('adsb-planes'))
        m.setLayoutProperty('adsb-planes', 'icon-image', ['concat',
          ['case', ['==', ['get', 't'], 'MIL'], 'mil_jet', 'civil_plane'], suffix]);
      if (m.getLayer('assets-layer-pulse'))
        m.setLayoutProperty('assets-layer-pulse', 'icon-image', ['concat',
          ['match', ['get', 'type'],
            'aircraft_carrier', 'carrier', 'submarine', 'submarine',
            'destroyer', 'destroyer', 'frigate', 'destroyer',
            'nuclear_plant', 'nuclear_plant', 'enrichment_area', 'nuclear_plant',
            'defense_rd', 'radar', 'manufacturing', 'military_base',
            'drone', 'drone', 'logistics_convoy', 'supply', 'maritime_supply', 'destroyer',
            'military_base', 'military_base', 'radar', 'radar', 'nuclear_plant'],
          suffix]);
      if (m.getLayer('satellites-orbits'))
        m.setPaintProperty('satellites-orbits', 'line-color', cyberMode ? '#9400D3' : '#c084fc');
    }, 250);
  }, [cyberMode]);

  // Layer visibility watcher
  useEffect(() => {
    const unsub = useLayerStore.subscribe((state) => {
      if (!map.current || !isLoaded.current) return;
      const vis = (id: string, on: boolean) => {
        if (map.current?.getLayer(id))
          map.current.setLayoutProperty(id, 'visibility', on ? 'visible' : 'none');
      };
      const L = state.layers;
      vis('firms-heat',          !!L.firms);
      vis('adsb-planes',         !!L.adsb);
      vis('ais-ships',           !!L.ais);
      vis('gdelt-events',        !!L.gdelt);
      vis('osm-military-dots',   !!L.osm_military);
      vis('chokepoints-pulse',   !!L.chokepoints);
      vis('chokepoints-labels',  !!L.chokepoints);
      vis('assets-layer-pulse',  !!L.assets);
      vis('assets-layer-labels', !!L.assets);
      vis('satellites-layer',    !!L.satellites);
      vis('satellites-orbits',   !!L.satellites);
      // New layers
      vis('nuclear-layer',        !!L.nuclear);
      vis('nuclear-clusters',     !!L.nuclear);
      vis('nuclear-cluster-count',!!L.nuclear);
      vis('bases-layer',          !!L.mil_bases);
      vis('bases-clusters',       !!L.mil_bases);
      vis('bases-cluster-count',  !!L.mil_bases);
      vis('bases-labels',         !!L.mil_bases);
      vis('cables-layer',         !!L.cables);
      vis('missiles-layer',       !!L.missiles);
      vis('missiles-labels',      !!L.missiles);
      vis('ew-zones-layer',       !!L.ew_zones);
      vis('ew-zones-labels',      !!L.ew_zones);
      vis('emitters-layer',       !!L.emitters);
      vis('emitters-labels',      !!L.emitters);
    });
    return unsub;
  }, []);

  return <div ref={mapContainer} className="w-full h-full" />;
}
