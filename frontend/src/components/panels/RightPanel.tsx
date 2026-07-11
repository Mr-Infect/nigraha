import { useState } from 'react';
import { useADSBStore } from '../../stores/useADSBStore';
import { useAISStore } from '../../stores/useAISStore';
import { useCyberStore } from '../../stores/useCyberStore';
import { Target, Database, Shield, Hash, Download, BarChart3, Crosshair, Server } from 'lucide-react';

type Tab = 'orb' | 'dossier' | 'bda' | 'stats';

const ORB_TREE = [
  {
    id: 'ru-vdv', name: '1st GUARDS TANK ARMY', country: 'RU', status: 'ACTIVE',
    units: [
      { name: '4th Guards Tank Division', units: ['12th Tank Regiment', '13th Tank Regiment', '423rd Motor Rifle Regiment'] },
      { name: '2nd Guards Motor Rifle Div', units: ['1st MR Regiment', '15th MR Regiment'] },
    ]
  },
  {
    id: 'cn-pla', name: 'PLA EASTERN THEATER CMD', country: 'CN', status: 'ELEVATED',
    units: [
      { name: '71st Group Army', units: ['178th Combined Arms Brigade', '181st Combined Arms Brigade'] },
      { name: 'PLA Naval Forces', units: ['East Sea Fleet Carrier Group', 'Submarine Flotilla 22'] },
    ]
  },
];

const CYBER_THREATS_TREE = [
  {
    id: 'apt-28', name: 'APT28 (FANCY BEAR)', country: 'RU', status: 'CRITICAL',
    units: [
      { name: 'Targeting Sectors', units: ['Government & Defense Agencies', 'Energy Grid Systems', 'Aerospace Networks'] },
      { name: 'Primary Malware Cascades', units: ['SoreFang Payload', 'Drovorub Rootkit'] },
    ]
  },
  {
    id: 'apt-41', name: 'APT41 (DOUBLE DRAGON)', country: 'CN', status: 'ELEVATED',
    units: [
      { name: 'Targeting Sectors', units: ['Telecommunications Networks', 'High-Tech R&D Hubs', 'Defense Contractors'] },
      { name: 'Primary Malware Cascades', units: ['ShadowPad RAT', 'Cobalt Strike Beacons'] },
    ]
  },
];

export default function RightPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('orb');
  const [expandedOrb, setExpandedOrb] = useState<string | null>(null);
  const aircraft = useADSBStore(state => state.aircraft);
  const ships = useAISStore(state => state.ships);
  const { cyberMode, activeAttacks } = useCyberStore();

  const acCount = Object.keys(aircraft).length;
  const shipCount = Object.keys(ships).length;
  const emergencyCount = Object.values(aircraft).filter(a => a.emergency).length;

  const textClass = cyberMode ? 'text-[#a855f7]' : 'text-neon-amber';
  const borderTabClass = cyberMode ? 'border-[#9400D3]' : 'border-neon-amber';
  
  const TABS = [
    { id: 'orb' as Tab, label: cyberMode ? 'THREATS' : 'ORB', icon: cyberMode ? Server : Database },
    { id: 'dossier' as Tab, label: 'DOSSIER', icon: Target },
    { id: 'bda' as Tab, label: cyberMode ? 'SYS DEF' : 'BDA', icon: Shield },
    { id: 'stats' as Tab, label: 'STATS', icon: BarChart3 },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-3 py-2 border-b border-white/10 flex-shrink-0 bg-[#0A0E17]">
        <div className="flex items-center space-x-2 mb-2">
          <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${cyberMode ? 'bg-[#9400D3]' : 'bg-neon-amber'}`} />
          <span className={`font-mono text-[10px] font-bold tracking-widest ${textClass}`}>
            {cyberMode ? 'CYBER SECURITY HUB' : 'MILINT DATABASE'}
          </span>
        </div>
        <div className="flex space-x-1">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-1 px-1 py-1 font-mono text-[9px] transition-all border ${
                activeTab === tab.id
                  ? `${textClass} ${borderTabClass} bg-white/5`
                  : 'text-slate-500 border-transparent hover:text-slate-300'
              }`}>
              <tab.icon size={9} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">

        {/* Order of Battle / Cyber threats */}
        {activeTab === 'orb' && (
          <div className="p-2 font-mono">
            {cyberMode ? (
              // Cyber APT Groups
              CYBER_THREATS_TREE.map(group => (
                <div key={group.id} className="mb-2">
                  <div
                    className={`flex items-center justify-between p-2 border cursor-pointer transition-all ${
                      expandedOrb === group.id ? 'border-[#9400D3]/50 bg-[#9400D3]/10' : 'border-white/10 hover:border-white/20'
                    }`}
                    onClick={() => setExpandedOrb(expandedOrb === group.id ? null : group.id)}
                  >
                    <div>
                      <div className="text-[10px] font-bold text-[#a855f7]">{group.name}</div>
                      <div className="text-[8px] text-slate-500">[{group.country}] • APT TARGETING</div>
                    </div>
                    <div className="text-[9px] px-1.5 py-0.5 border border-neon-red/50 text-neon-red bg-neon-red/10 font-bold">
                      {group.status}
                    </div>
                  </div>
                  {expandedOrb === group.id && (
                    <div className="border-l border-[#9400D3]/30 ml-2 pl-2 space-y-1 mt-1">
                      {group.units.map((sect, si) => (
                        <div key={si}>
                          <div className="text-[9px] text-slate-300 py-0.5 flex items-center">
                            <Crosshair size={8} className="mr-1.5 text-[#a855f7]/60" />{sect.name}
                          </div>
                          <div className="border-l border-white/10 ml-2 pl-2">
                            {sect.units.map((item, ui) => (
                              <div key={ui} className="text-[8px] text-slate-500 py-0.5 hover:text-slate-300 transition-colors">
                                — {item}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              // Standard military ORB
              ORB_TREE.map(army => (
                <div key={army.id} className="mb-2">
                  <div
                    className={`flex items-center justify-between p-2 border cursor-pointer transition-all ${
                      expandedOrb === army.id ? 'border-neon-amber/50 bg-neon-amber/10' : 'border-white/10 hover:border-white/20'
                    }`}
                    onClick={() => setExpandedOrb(expandedOrb === army.id ? null : army.id)}
                  >
                    <div>
                      <div className="text-[10px] font-bold text-neon-amber">{army.name}</div>
                      <div className="text-[8px] text-slate-500">[{army.country}] • {army.status}</div>
                    </div>
                    <div className={`text-[9px] px-1.5 py-0.5 border font-bold ${
                      army.status === 'ACTIVE' ? 'border-neon-red/50 text-neon-red bg-neon-red/10' :
                      'border-neon-amber/50 text-neon-amber bg-neon-amber/10'
                    }`}>{army.status}</div>
                  </div>
                  {expandedOrb === army.id && (
                    <div className="border-l border-neon-amber/30 ml-2 pl-2 space-y-1 mt-1">
                      {army.units.map((div, di) => (
                        <div key={di}>
                          <div className="text-[9px] text-slate-300 py-0.5 flex items-center">
                            <Crosshair size={8} className="mr-1.5 text-neon-amber/60" />{div.name}
                          </div>
                          <div className="border-l border-white/10 ml-2 pl-2">
                            {div.units.map((unit, ui) => (
                              <div key={ui} className="text-[8px] text-slate-500 py-0.5 hover:text-slate-300 transition-colors">
                                — {unit}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Target Dossier */}
        {activeTab === 'dossier' && (
          <div className="p-3 font-mono">
            <div className={`border p-3 mb-3 ${cyberMode ? 'border-[#9400D3]/30 bg-[#9400D3]/5' : 'border-neon-amber/30 bg-neon-amber/5'}`}>
              <div className={`text-[9px] tracking-widest mb-2 ${textClass}`}>
                {cyberMode ? 'NETWORK INTENSITY' : 'ADMIRALTY RATING'}
              </div>
              <div className="flex items-center space-x-3">
                <div className={`text-3xl font-bold ${textClass}`}>
                  {cyberMode ? 'B4' : 'A2'}
                </div>
                <div className="text-[8px] text-slate-400 leading-tight">
                  SOURCE: <span className="text-slate-200">{cyberMode ? 'Encrypted Intrusion Data' : 'Completely Reliable'}</span><br/>
                  INFO: <span className="text-slate-200">{cyberMode ? 'Highly Vulnerable Node' : 'Probably True'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-[10px]">
              {cyberMode ? (
                // Cyber Mode Dossier
                [
                  ['NODE ID', 'NIC GATEWAY SERVER', 'text-neon-cyan'],
                  ['LOCATION', 'New Delhi, India', 'text-slate-200'],
                  ['OS VERSION', 'RHEL 8.4 Enterprise', 'text-slate-200'],
                  ['IP SUBNET', '164.100.47.0/24', 'text-slate-200'],
                  ['ATTACK STATE', 'DDoS MITIGATION IN PROGRESS', 'text-[#a855f7] animate-pulse'],
                  ['SEVERITY', 'ELEVATED THREAT', 'text-neon-red font-bold'],
                ].map(([k, v, cls]) => (
                  <div key={k} className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-slate-500">{k}</span>
                    <span className={cls}>{v}</span>
                  </div>
                ))
              ) : (
                // Military Mode Dossier
                [
                  ['IDENT', 'SU-35S FLANKER-E', 'text-neon-cyan'],
                  ['TYPE', 'Air Superiority Fighter', 'text-slate-200'],
                  ['ROLE', 'SEAD / Air Superiority', 'text-slate-200'],
                  ['ORIGIN', 'Russia (RF)', 'text-slate-200'],
                  ['STATUS', 'ACTIVE TRACK', 'text-neon-amber animate-pulse'],
                  ['THREAT LVL', 'HIGH', 'text-neon-red font-bold'],
                ].map(([k, v, cls]) => (
                  <div key={k} className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-slate-500">{k}</span>
                    <span className={cls}>{v}</span>
                  </div>
                ))
              )}
            </div>

            <div className="mt-3">
              <div className="text-[8px] text-slate-500 mb-1 flex items-center"><Hash size={8} className="mr-1"/>SHA-256 SIGNATURE</div>
              <div className="text-[8px] break-all text-slate-500 bg-black/30 p-2 border border-white/10 font-mono">
                {cyberMode 
                  ? '7b5c3258aef46e8dbefbc726e6f9db1c5040e34c98fbcdef10e3049ba30d998f'
                  : 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
              </div>
            </div>

            <button 
              className={`mt-3 w-full border py-2 font-mono text-[10px] transition-all flex items-center justify-center space-x-2 ${
                cyberMode 
                  ? 'bg-[#9400D3]/10 hover:bg-[#9400D3]/20 text-[#a855f7] border-[#9400D3]/40' 
                  : 'bg-neon-amber/10 hover:bg-neon-amber/20 text-neon-amber border-neon-amber/40'
              }`}
            >
              <Download size={10} />
              <span>EXPORT BRIEF (.MD)</span>
            </button>
          </div>
        )}

        {/* BDA Workstation / System Defense */}
        {activeTab === 'bda' && (
          <div className="p-3 font-mono">
            <div className={`text-[9px] mb-3 tracking-widest ${cyberMode ? 'text-[#a855f7]' : 'text-neon-cyan'}`}>
              {cyberMode ? 'ACTIVE INTRUSION RESPONSES' : 'BATTLE DAMAGE ASSESSMENT'}
            </div>
            {cyberMode ? (
              // System Defense Active alerts
              [
                { site: 'Defense Gateway Firewall', date: '13:02:11', status: 'MITIGATING', conf: 'DDoS' },
                { site: 'NIC Subnet Router', date: '12:58:45', status: 'BLOCKED', conf: 'SQL Inject' },
                { site: 'DRDO Mail Server', date: '12:45:00', status: 'ANALYZING', conf: 'Spear Phishing' },
              ].map((item, i) => (
                <div key={i} className="border border-white/10 p-2 mb-2 hover:border-white/20 transition-colors">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-slate-200 font-bold">{item.site}</span>
                    <span className={`text-[8px] px-1 py-0.5 font-bold ${
                      item.status === 'MITIGATING' ? 'bg-[#9400D3]/20 text-[#a855f7]' :
                      item.status === 'BLOCKED' ? 'bg-neon-red/20 text-neon-red' :
                      'bg-neon-amber/20 text-neon-amber'
                    }`}>{item.status}</span>
                  </div>
                  <div className="flex justify-between text-[8px] text-slate-500">
                    <span>{item.date}</span>
                    <span>TYPE: {item.conf}</span>
                  </div>
                </div>
              ))
            ) : (
              // BDA Sites
              [
                { site: 'Kharkiv Rail Hub', date: '2025-07-10', status: 'DESTROYED', conf: 'HIGH' },
                { site: 'Mariupol Port Terminal', date: '2025-07-09', status: 'DAMAGED', conf: 'MEDIUM' },
                { site: 'Donetsk Airfield', date: '2025-07-08', status: 'OPERATIONAL', conf: 'LOW' },
              ].map((item, i) => (
                <div key={i} className="border border-white/10 p-2 mb-2 hover:border-white/20 transition-colors">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-slate-200 font-bold">{item.site}</span>
                    <span className={`text-[8px] px-1 py-0.5 font-bold ${
                      item.status === 'DESTROYED' ? 'bg-neon-red/20 text-neon-red' :
                      item.status === 'DAMAGED' ? 'bg-neon-amber/20 text-neon-amber' :
                      'bg-[#00F0FF]/20 text-neon-cyan'
                    }`}>{item.status}</span>
                  </div>
                  <div className="flex justify-between text-[8px] text-slate-500">
                    <span>{item.date}</span>
                    <span>CONF: {item.conf}</span>
                  </div>
                </div>
              ))
            )}
            <button className="w-full mt-2 border border-dashed border-white/20 py-2 text-[9px] text-slate-600 hover:text-slate-400 hover:border-white/30 transition-all">
              {cyberMode ? '+ NEW RESPONSE RULE' : '+ ADD BDA SITE'}
            </button>
          </div>
        )}

        {/* Stats */}
        {activeTab === 'stats' && (
          <div className="p-3 font-mono space-y-4">
            <div className={`text-[9px] tracking-widest mb-2 ${textClass}`}>
              {cyberMode ? 'CYBER SECURITY METRICS' : 'LIVE TELEMETRY STATS'}
            </div>

            {cyberMode ? (
              // Cyber Mode Stats
              [
                { label: 'Attacks Logged', value: activeAttacks.length, max: 50, color: '#9400D3' },
                { label: 'Mitigated Incidents', value: activeAttacks.length ? Math.floor(activeAttacks.length * 0.85) : 0, max: 50, color: '#39FF14' },
                { label: 'Intrusion Attempts/Min', value: 42, max: 100, color: '#FF3333' },
              ].map(stat => (
                <div key={stat.label}>
                  <div className="flex justify-between text-[9px] mb-1">
                    <span className="text-slate-400">{stat.label}</span>
                    <span className="font-bold" style={{ color: stat.color }}>{stat.value}</span>
                  </div>
                  <div className="h-1 bg-white/5 rounded overflow-hidden">
                    <div
                      className="h-full rounded transition-all duration-500"
                      style={{
                        width: `${Math.min(100, (stat.value / stat.max) * 100)}%`,
                        backgroundColor: stat.color,
                        boxShadow: `0 0 8px ${stat.color}`,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              // Standard Telemetry Stats
              [
                { label: 'Aircraft Tracks', value: acCount, max: 2000, color: '#00F0FF' },
                { label: 'Emergency Squawks', value: emergencyCount, max: 10, color: '#FF3333' },
                { label: 'Naval Vessels', value: shipCount, max: 500, color: '#00FF88' },
              ].map(stat => (
                <div key={stat.label}>
                  <div className="flex justify-between text-[9px] mb-1">
                    <span className="text-slate-400">{stat.label}</span>
                    <span className="font-bold" style={{ color: stat.color }}>{stat.value.toLocaleString()}</span>
                  </div>
                  <div className="h-1 bg-white/5 rounded overflow-hidden">
                    <div
                      className="h-full rounded transition-all duration-500"
                      style={{
                        width: `${Math.min(100, (stat.value / stat.max) * 100)}%`,
                        backgroundColor: stat.color,
                        boxShadow: `0 0 8px ${stat.color}`,
                      }}
                    />
                  </div>
                </div>
              ))
            )}

            <div className="border border-white/10 p-2 mt-4">
              <div className="text-[8px] text-slate-500 mb-2">INTELLIGENCE SUITE STATUS</div>
              {[
                ['ADS-B Core Feed', acCount > 0],
                ['AIS Core Stream', shipCount > 0],
                ['Hacker News Engine', true],
                ['Cyber Attack Matrix', true],
                ['Strategic Assets Layer', true],
              ].map(([label, ok]) => (
                <div key={label as string} className="flex justify-between text-[9px] py-0.5">
                  <span className="text-slate-400">{label as string}</span>
                  <span className={ok ? 'text-neon-cyan' : 'text-neon-red'}>{ok ? '● LIVE' : '○ OFFLINE'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
