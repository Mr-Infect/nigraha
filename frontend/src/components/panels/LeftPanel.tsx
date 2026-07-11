import { useState } from 'react';
import { useADSBStore } from '../../stores/useADSBStore';
import { useNewsStore } from '../../stores/useNewsStore';
import { useAISStore } from '../../stores/useAISStore';
import { useAlertStore } from '../../stores/useAlertStore';
import { useCyberStore } from '../../stores/useCyberStore';
import { useSatelliteStore } from '../../stores/useSatelliteStore';
import { Radio, Crosshair, Anchor, Bell, ChevronRight, Terminal, Globe, Calendar, Orbit } from 'lucide-react';

type Tab = 'sigint' | 'naval' | 'news' | 'alerts';
type AirSubTab = 'live' | 'atc';
type SeaSubTab = 'ships' | 'satellites';

const severityColor: Record<string, string> = {
  CRITICAL: '#FF3333',
  HIGH: '#FF6600',
  MEDIUM: '#FFB800',
  LOW: '#00F0FF',
};

const SQUAWK_LABELS: Record<string, string> = {
  '7700': '⚠ EMERGENCY',
  '7600': '⚠ COMM FAIL',
  '7500': '⚠ HIJACK',
  '7777': '⚠ MIL INTERCEPT',
};

// Simulated ATC flight schedules for Asian Hubs
const ATC_SCHEDULES = [
  { flight: 'AIC 101', route: 'DEL ➔ JFK', time: '13:40', gate: 'T3-12', status: 'BOARDING', airline: 'Air India' },
  { flight: 'SIA 403', route: 'SIN ➔ DEL', time: '14:05', gate: 'T3-05', status: 'ON TIME', airline: 'Singapore Air' },
  { flight: 'CCA 975', route: 'PEK ➔ BOM', time: '14:20', gate: 'T2-18', status: 'DELAYED', airline: 'Air China' },
  { flight: 'JAL 039', route: 'HND ➔ SIN', time: '14:45', gate: 'T1-02', status: 'SCHEDULED', airline: 'Japan Airlines' },
  { flight: 'PGT 221', route: 'BOM ➔ DEL', time: '15:00', gate: 'T2-08', status: 'SCHEDULED', airline: 'IndiGo' },
  { flight: 'UAE 506', route: 'DXB ➔ PEK', time: '15:15', gate: 'T3-14', status: 'ON TIME', airline: 'Emirates' },
  { flight: 'AIC 302', route: 'DEL ➔ SYD', time: '15:30', gate: 'T3-20', status: 'SCHEDULED', airline: 'Air India' },
];

export default function LeftPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('sigint');
  const [airSubTab, setAirSubTab] = useState<AirSubTab>('live');
  const [seaSubTab, setSeaSubTab] = useState<SeaSubTab>('ships');

  const aircraft = useADSBStore(state => state.aircraft);
  const acCount = useADSBStore(state => state.count);
  const ships = useAISStore(state => state.ships);
  const news = useNewsStore(state => state.news);
  const { alerts, unacknowledged, acknowledge } = useAlertStore();
  const { cyberMode, cyberNews, activeAttacks } = useCyberStore();
  const satPositions = useSatelliteStore(state => state.positions);

  const acList = Object.values(aircraft)
    .sort((a, b) => {
      if (a.emergency && !b.emergency) return -1;
      if (!a.emergency && b.emergency) return 1;
      if (a.t === 'MIL' && b.t !== 'MIL') return -1;
      return 0;
    })
    .slice(0, 60);

  const shipList = Object.values(ships).slice(0, 50);
  const satList = satPositions ? satPositions.features : [];

  const accentTextClass = cyberMode ? 'text-[#a855f7]' : 'text-neon-cyan';
  const borderTabClass = cyberMode ? 'border-[#9400D3]' : 'border-neon-cyan';

  const TABS: { id: Tab; label: string; icon: React.ElementType; badge?: number; count?: number }[] = [
    { id: 'sigint',  label: 'AIR',    icon: Crosshair, count: acCount },
    { id: 'naval',   label: 'NAVAL/SPACE',  icon: Anchor,    count: Object.keys(ships).length + satList.length },
    { id: 'news',    label: cyberMode ? 'CYBER' : 'INTEL', icon: cyberMode ? Terminal : Radio, count: cyberMode ? activeAttacks.length : news.length },
    { id: 'alerts',  label: 'ALERTS', icon: Bell,      badge: unacknowledged },
  ];

  return (
    <div className="h-full flex flex-col text-slate-300">
      {/* Header */}
      <div className="px-3 py-2 border-b border-white/10 flex-shrink-0 bg-[#0A0E17]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-1.5">
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${cyberMode ? 'bg-[#9400D3]' : 'bg-neon-cyan'}`} />
            <span className={`font-mono text-[10px] font-bold tracking-widest ${accentTextClass}`}>
              {cyberMode ? 'CYBER COMMAND' : 'INTEL STREAM'}
            </span>
          </div>
          <span className="font-mono text-[8px] text-slate-600">
            {cyberMode ? `${activeAttacks.length} THREATS` : `${acCount.toLocaleString()} TRACKS LIVE`}
          </span>
        </div>
        {/* Tab row */}
        <div className="flex space-x-px">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex-1 flex flex-col items-center py-1 font-mono text-[8px] transition-all border-b-2 ${
                activeTab === tab.id
                  ? `${accentTextClass} ${borderTabClass} bg-white/5`
                  : 'text-slate-600 border-transparent hover:text-slate-400'
              }`}
            >
              <tab.icon size={10} className="mb-0.5" />
              <span className="text-center leading-none text-[7px] truncate max-w-full">{tab.label}</span>
              {tab.badge != null && tab.badge > 0 && (
                <span className="absolute -top-0.5 right-1 bg-neon-red text-white text-[7px] rounded-full w-3.5 h-3.5 flex items-center justify-center animate-pulse">
                  {tab.badge > 9 ? '9+' : tab.badge}
                </span>
              )}
              {tab.count != null && tab.count > 0 && tab.badge == null && (
                <span className="text-[7px] text-slate-700 tabular-nums">{tab.count.toLocaleString()}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content scrollable area */}
      <div className="flex-1 overflow-y-auto min-h-0">

        {/* ── AIR TAB ── */}
        {activeTab === 'sigint' && (
          <div>
            {/* Air subtabs */}
            <div className="flex border-b border-white/5 bg-black/20 p-1 space-x-1 shrink-0">
              <button
                onClick={() => setAirSubTab('live')}
                className={`flex-1 py-1 font-mono text-[8px] border transition-colors ${
                  airSubTab === 'live'
                    ? 'border-[#00F0FF]/40 text-neon-cyan bg-[#00F0FF]/5'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                LIVE SIGINT
              </button>
              <button
                onClick={() => setAirSubTab('atc')}
                className={`flex-1 py-1 font-mono text-[8px] border transition-colors ${
                  airSubTab === 'atc'
                    ? 'border-[#00F0FF]/40 text-neon-cyan bg-[#00F0FF]/5'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                ATC BOARD
              </button>
            </div>

            {airSubTab === 'live' ? (
              // Live air space
              <div>
                {acList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-slate-700 font-mono text-[10px] space-y-2">
                    <Crosshair size={24} className="animate-spin opacity-20" />
                    <span>AWAITING ADS-B FEED...</span>
                  </div>
                ) : acList.map(ac => {
                  const isEmergency = !!ac.emergency;
                  const isMil = ac.t === 'MIL';
                  const squawkAlert = ac.squawk && ['7700','7500','7600','7777'].includes(ac.squawk);
                  return (
                    <div
                      key={ac.hex}
                      className={`border-b border-white/[0.06] transition-colors hover:bg-white/[0.03] ${
                        isEmergency ? 'bg-[#FF3333]/06' : isMil ? 'bg-[#FFB800]/04' : ''
                      }`}
                      style={{ borderLeft: `2px solid ${isEmergency ? '#FF3333' : isMil ? '#FFB800' : 'transparent'}` }}
                    >
                      {/* Row header — Callsign + classification badge */}
                      <div className="flex items-center justify-between px-2 pt-1.5 pb-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-mono text-[10px] font-black tracking-wide ${
                            isEmergency ? 'text-red-400 animate-pulse' : isMil ? 'text-amber-400' : 'text-cyan-400'
                          }`}>
                            {ac.flight?.trim() || ac.hex}
                          </span>
                          <span className={`font-mono text-[7px] px-1 py-px border ${
                            isEmergency ? 'text-red-400 border-red-400/30 bg-red-400/10' :
                            isMil ? 'text-amber-400 border-amber-400/30 bg-amber-400/10' :
                            'text-slate-500 border-slate-600/30'
                          }`}>
                            {isEmergency ? 'EMRG' : isMil ? 'MIL' : 'CIV'}
                          </span>
                        </div>
                        <span className="font-mono text-[9px] tabular-nums text-slate-400">
                          {ac.alt_geom ? `FL${Math.round(ac.alt_geom / 100).toString().padStart(3,'0')}` : '——'}
                        </span>
                      </div>
                      {/* Data row — CAOC compact format */}
                      <div className="px-2 pb-1.5 font-mono text-[8px] flex gap-3 text-slate-500">
                        {squawkAlert && (
                          <span className="text-red-400 font-bold">{SQUAWK_LABELS[ac.squawk!] || `SQK ${ac.squawk}`}</span>
                        )}
                        <span>HDG <span className="text-slate-400">{ac.track != null ? `${Math.round(ac.track)}°` : '—'}</span></span>
                        <span>SPD <span className="text-slate-400">{ac.gs ? `${Math.round(ac.gs)}kt` : '—'}</span></span>
                        <span className="ml-auto text-slate-600">{ac.hex}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // ATC Schedule Board
              <div className="p-2 space-y-1.5">
                <div className="text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-2 font-mono flex items-center">
                  <Calendar size={10} className="mr-1.5 text-neon-cyan" />
                  Scheduled Flight Departures
                </div>
                <div className="border border-white/10 rounded overflow-hidden">
                  <table className="w-full font-mono text-[8px] text-left">
                    <thead>
                      <tr className="bg-white/5 text-slate-400 border-b border-white/10">
                        <th className="p-1">FLIGHT</th>
                        <th className="p-1">ROUTE</th>
                        <th className="p-1">SCHED</th>
                        <th className="p-1">GATE</th>
                        <th className="p-1">STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ATC_SCHEDULES.map((sched, idx) => (
                        <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="p-1 font-bold text-neon-cyan">{sched.flight}</td>
                          <td className="p-1 text-slate-300">{sched.route}</td>
                          <td className="p-1 text-slate-400">{sched.time}</td>
                          <td className="p-1 text-slate-400">{sched.gate}</td>
                          <td className="p-1">
                            <span className={`px-1 rounded-sm text-[7px] font-bold ${
                              sched.status === 'BOARDING' ? 'bg-neon-red/20 text-neon-red' :
                              sched.status === 'DELAYED' ? 'bg-neon-amber/20 text-neon-amber' :
                              sched.status === 'ON TIME' ? 'bg-neon-cyan/20 text-neon-cyan' :
                              'bg-slate-700 text-slate-400'
                            }`}>
                              {sched.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── NAVAL / SPACE TAB ── */}
        {activeTab === 'naval' && (
          <div>
            {/* Sea Subtabs */}
            <div className="flex border-b border-white/5 bg-black/20 p-1 space-x-1 shrink-0">
              <button
                onClick={() => setSeaSubTab('ships')}
                className={`flex-1 py-1 font-mono text-[8px] border transition-colors ${
                  seaSubTab === 'ships'
                    ? 'border-[#00F0FF]/40 text-neon-cyan bg-[#00F0FF]/5'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                NAVAL VESSELS
              </button>
              <button
                onClick={() => setSeaSubTab('satellites')}
                className={`flex-1 py-1 font-mono text-[8px] border transition-colors ${
                  seaSubTab === 'satellites'
                    ? 'border-[#00F0FF]/40 text-neon-cyan bg-[#00F0FF]/5'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                SPY SATELLITES
              </button>
            </div>

            {seaSubTab === 'ships' ? (
              // Ships list
              <div>
                {shipList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-slate-700 font-mono text-[10px] space-y-2">
                    <Anchor size={24} className="opacity-20" />
                    <span>ENABLE AIS LAYER</span>
                    <span className="text-[8px] text-slate-800">Toggle AIS Naval in Layers menu</span>
                  </div>
                ) : shipList.map(ship => (
                  <div key={ship.mmsi} className={`border-b border-white/5 px-2 py-1.5 hover:bg-white/[0.04] transition-colors border-l-2 ${cyberMode ? 'border-l-[#9400D3]/40' : 'border-l-[#00F0FF]/30'}`}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={`font-mono text-[10px] font-bold ${accentTextClass}`}>⚓ {ship.name?.trim() || `MMSI-${ship.mmsi}`}</span>
                    </div>
                    <div className="flex space-x-3 font-mono text-[8px] text-slate-600">
                      <span>SOG <span className="text-slate-400">{ship.sog != null ? `${ship.sog}kt` : '—'}</span></span>
                      <span>COG <span className="text-slate-400">{ship.cog != null ? `${Math.round(ship.cog)}°` : '—'}</span></span>
                      <span className="text-slate-700 tabular-nums">{ship.mmsi}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Satellites list
              <div>
                {satList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-slate-700 font-mono text-[10px] space-y-2">
                    <Orbit size={24} className="opacity-20 animate-spin" />
                    <span>AWAITING ORBIT PROPAGATION...</span>
                  </div>
                ) : satList.map((sat: any, idx) => {
                  const p = sat.properties;
                  return (
                    <div key={idx} className={`border-b border-white/5 px-2 py-1.5 hover:bg-white/[0.04] transition-colors border-l-2 ${cyberMode ? 'border-l-[#9400D3]/40' : 'border-l-purple-500/40'}`}>
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="font-mono text-[10px] font-bold text-purple-300">🛰 {p.name}</span>
                        <span className="font-mono text-[8px] text-slate-500">ALT {p.altitude}km</span>
                      </div>
                      <div className="flex space-x-3 font-mono text-[8px] text-slate-600">
                        <span>INC <span className="text-slate-400">{p.inclination}°</span></span>
                        <span>PERIOD <span className="text-slate-400">{Math.round(p.period / 60)}m</span></span>
                        <span className="text-slate-700">{p.country}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── NEWS / CYBER TAB ── */}
        {activeTab === 'news' && (
          <div>
            {cyberMode ? (
              // Cyber Mode Layout
              <div className="space-y-4 p-2">
                {/* Simulated live attacks log */}
                <div>
                  <div className="text-[8px] font-bold text-[#a855f7] tracking-widest mb-1.5 flex items-center space-x-1 uppercase font-mono">
                    <Terminal size={9} />
                    <span>Live Cyber Attack Stream</span>
                  </div>
                  <div className="bg-black/40 border border-[#9400D3]/20 rounded-sm p-1.5 font-mono text-[8px] space-y-2 max-h-60 overflow-y-auto">
                    {activeAttacks.length === 0 ? (
                      <span className="text-slate-600 italic">No attacks logged. Listening...</span>
                    ) : activeAttacks.map((attack, i) => (
                      <div key={i} className="border-b border-[#9400D3]/10 pb-1.5 last:border-b-0">
                        <div className="flex justify-between text-slate-500">
                          <span>{attack.timestamp}</span>
                          <span className="text-[#a855f7]">Port {attack.port}</span>
                        </div>
                        <div className="text-slate-300 font-bold truncate">
                          {attack.attacker} → {attack.target}
                        </div>
                        <div className="text-slate-400 truncate">
                          {attack.type}
                        </div>
                        <div className="text-slate-600">
                          Src: {attack.attacker_ip} | Dst: {attack.target_ip}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cyber news list */}
                <div>
                  <div className="text-[8px] font-bold text-[#a855f7] tracking-widest mb-1.5 flex items-center space-x-1 uppercase font-mono">
                    <Globe size={9} />
                    <span>Hacker News OSINT</span>
                  </div>
                  <div className="space-y-2">
                    {cyberNews.length === 0 ? (
                      <div className="text-slate-600 italic text-[9px] font-mono p-1">No security warnings found...</div>
                    ) : cyberNews.map((item, i) => (
                      <div key={i} className="border-b border-[#9400D3]/10 pb-1.5">
                        <a href={item.link} target="_blank" rel="noreferrer"
                           className="font-mono text-[9px] text-slate-300 hover:text-[#a855f7] transition-colors leading-tight flex items-start space-x-1">
                          <ChevronRight size={8} className="flex-shrink-0 mt-0.5 text-[#a855f7]" />
                          <span>{item.title}</span>
                        </a>
                        <span className="text-[7px] text-slate-600 font-mono block mt-0.5">{item.published}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              // Standard News Layout
              <div>
                {news.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-slate-700 font-mono text-[10px] space-y-2">
                    <Radio size={24} className="animate-pulse opacity-20" />
                    <span>SCANNING 15 FREQUENCIES...</span>
                  </div>
                ) : news.map((item: any, i: number) => (
                  <div key={item.id || i} className="border-b border-white/5 px-3 py-2 hover:bg-white/[0.04] transition-colors group">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-mono text-[7px] text-slate-700 uppercase tracking-widest">{item.source}</span>
                      <span className="font-mono text-[7px] text-slate-700">{item.published?.slice(0, 10)}</span>
                    </div>
                    <a
                      href={item.link} target="_blank" rel="noreferrer"
                      className="font-mono text-[9px] text-slate-300 hover:text-neon-amber transition-colors leading-tight flex items-start space-x-1"
                    >
                      <ChevronRight size={8} className="flex-shrink-0 mt-0.5 text-neon-amber/60" />
                      <span>{item.title}</span>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ALERTS TAB ── */}
        {activeTab === 'alerts' && (
          <div>
            {alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-slate-700 font-mono text-[10px] space-y-2">
                <Bell size={24} className="opacity-20" />
                <span>NO ACTIVE ALERTS</span>
              </div>
            ) : alerts.map((alert, idx) => (
              <div
                key={`${alert.id}-${idx}`}
                onClick={() => acknowledge(alert.id)}
                className={`border-b border-white/5 px-2 py-2 cursor-pointer hover:bg-white/[0.04] transition-all border-l-2 ${alert.acknowledged ? 'opacity-30' : ''}`}
                style={{ borderLeftColor: severityColor[alert.severity] }}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-mono text-[8px] font-bold" style={{ color: severityColor[alert.severity] }}>
                    {alert.severity}
                  </span>
                  <span className="font-mono text-[7px] text-slate-700">{alert.source}</span>
                </div>
                <div className="font-mono text-[9px] text-slate-300 leading-tight">{alert.message}</div>
                {!alert.acknowledged && (
                  <div className="font-mono text-[7px] text-slate-700 mt-0.5">click to acknowledge</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer — domain counts + classification banner */}
      <div className="flex-shrink-0 bg-[#0A0E17]">
        <div className="border-t border-white/10 px-3 py-1 flex items-center justify-between">
          <div className="font-mono text-[8px] text-slate-600 flex gap-3">
            <span>AIR <span className="text-slate-400">{acCount.toLocaleString()}</span></span>
            <span>SEA <span className="text-slate-400">{Object.keys(ships).length}</span></span>
            <span>NEWS <span className="text-slate-400">{cyberMode ? cyberNews.length : news.length}</span></span>
          </div>
          <div className={`font-mono text-[8px] ${unacknowledged > 0 ? 'text-red-400 animate-pulse' : 'text-slate-700'}`}>
            {unacknowledged > 0 ? `${unacknowledged} UNACK'D` : 'ALL CLEAR'}
          </div>
        </div>
        <div className={`classification-banner ${cyberMode ? 'text-[#9400D3]/50 border-[#9400D3]/15' : ''}`}>
          UNCLASSIFIED // OSINT
        </div>
      </div>
    </div>
  );
}
