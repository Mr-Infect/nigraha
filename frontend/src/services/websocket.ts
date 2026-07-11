import { useADSBStore } from '../stores/useADSBStore';
import { useNewsStore } from '../stores/useNewsStore';
import { useAISStore } from '../stores/useAISStore';
import { useFIRMSStore } from '../stores/useFIRMSStore';
import { useAlertStore } from '../stores/useAlertStore';
import { useGDELTStore, useOSMStore } from '../stores/useGeoStores';
import { useAssetStore } from '../stores/useAssetStore';
import { useCyberStore } from '../stores/useCyberStore';
import { useSatelliteStore } from '../stores/useSatelliteStore';

let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
const WS_URL = 'ws://localhost:8001/ws';

function connect() {
  if (ws && ws.readyState === WebSocket.OPEN) return;
  
  ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    console.log('[NIGRAHA WS] Connected');
    if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  };

  ws.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data);
      const { type, data } = payload;

      switch (type) {
        case 'adsb_update':
          useADSBStore.getState().updateAircraft(data);
          // Check for emergency squawks and send to alert store
          if (Array.isArray(data)) {
            const emergencies = data
              .filter((ac: any) => ['7700', '7600', '7500', '7777'].includes(ac.squawk))
              .map((ac: any) => ({
                id: Date.now() + Math.random(),
                type: 'SQUAWK_EMERGENCY',
                severity: 'CRITICAL' as const,
                message: `SQUAWK ${ac.squawk} | ${ac.flight || ac.hex} | ALT ${ac.alt_geom || '?'}ft`,
                timestamp: new Date().toISOString(),
                lat: ac.lat,
                lon: ac.lon,
                source: 'ADS-B',
                acknowledged: false,
              }));
            if (emergencies.length > 0) {
              useAlertStore.getState().addAlerts(emergencies);
            }
          }
          break;

        case 'news_update':
          useNewsStore.getState().setNews(data);
          break;

        case 'ais_update':
          useAISStore.getState().updateShips(data);
          break;

        case 'firms_update':
          useFIRMSStore.getState().setData(data);
          break;

        case 'gdelt_events':
          useGDELTStore.getState().setData(data);
          break;

        case 'osm_military':
          useOSMStore.getState().setData(data);
          break;

        case 'assets_update':
          useAssetStore.getState().setData(data);
          break;

        case 'cyber_news_update':
          useCyberStore.getState().setCyberNews(data);
          break;

        case 'cyber_attack_event':
          useCyberStore.getState().addAttack(data);
          break;

        case 'satellites_update':
          useSatelliteStore.getState().setSatelliteData(data.positions, data.orbits);
          break;

        case 'alert':
          if (Array.isArray(data)) {
            useAlertStore.getState().addAlerts(data);
          } else {
            useAlertStore.getState().addAlerts([data]);
          }
          break;

        default:
          break;
      }
    } catch (e) {
      console.error('[NIGRAHA WS] Parse error', e);
    }
  };

  ws.onclose = () => {
    console.log('[NIGRAHA WS] Disconnected — reconnecting in 3s...');
    ws = null;
    reconnectTimer = setTimeout(connect, 3000);
  };

  ws.onerror = (err) => {
    console.error('[NIGRAHA WS] Error', err);
    ws?.close();
  };
}

export const useWebSocket = () => {
  return { connect };
};
