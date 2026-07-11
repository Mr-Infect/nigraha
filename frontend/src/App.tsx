import { useEffect, useState } from 'react';
import LeftPanel from './components/panels/LeftPanel';
import RightPanel from './components/panels/RightPanel';
import BottomPanel from './components/panels/BottomPanel';
import MapCanvas from './components/map/MapCanvas';
import LayerControl from './components/ui/LayerControl';
import { useWebSocket } from './services/websocket';
import { useLayerStore } from './stores/useLayerStore';
import { useAlertStore } from './stores/useAlertStore';
import { useADSBStore } from './stores/useADSBStore';
import { useCyberStore } from './stores/useCyberStore';
import { ChevronRight, ChevronLeft, Shield, AlertTriangle, Layers } from 'lucide-react';

function App() {
  const { connect } = useWebSocket();
  const { showLeftPanel, showRightPanel, toggleLeftPanel, toggleRightPanel } = useLayerStore();
  const { unacknowledged } = useAlertStore();
  const aircraft = useADSBStore(state => state.aircraft);
  const [wsConnected, setWsConnected] = useState(false);
  const [zuluTime, setZuluTime] = useState('');
  const [showLayers, setShowLayers] = useState(false);
  const { cyberMode } = useCyberStore();

  useEffect(() => {
    connect();
  }, []);

  useEffect(() => {
    const tick = () => {
      setZuluTime(new Date().toISOString().slice(11, 19) + 'Z');
      setWsConnected(Object.keys(aircraft).length > 0);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [aircraft]);

  const threatLevel = unacknowledged > 3 ? 4 : unacknowledged > 1 ? 3 : unacknowledged > 0 ? 2 : 1;
  const threatColors: Record<number, string> = { 1: '#00F0FF', 2: '#00FF88', 3: '#FFB800', 4: '#FF3333' };
  const threatLabel = ['', 'LOW', 'GUARDED', 'ELEVATED', 'CRITICAL'][threatLevel];

  // Dynamic colors based on Cyber Mode
  const accentTextClass = cyberMode ? 'text-[#a855f7]' : 'text-neon-cyan';
  const borderStyle = { borderColor: cyberMode ? 'rgba(148,0,211,0.3)' : 'rgba(0,240,255,0.2)' };
  
  const PANEL_W = 288; // w-72 = 18rem = 288px

  return (
    <div className={`relative w-screen h-screen overflow-hidden bg-[#0A0E17] text-slate-300 flex flex-col select-none ${cyberMode ? 'cyber-mode-active' : ''}`}>

      {/* ── CLASSIFICATION BANNER ── */}
      <div className={`classification-banner shrink-0 ${cyberMode ? 'text-[#9400D3]/60 border-[#9400D3]/20 bg-[#9400D3]/05' : ''}`}>
        {cyberMode ? '⚠ CYBER SURVEILLANCE ACTIVE — UNCLASSIFIED // OSINT' : 'UNCLASSIFIED // OPEN SOURCE INTELLIGENCE (OSINT) // FOR ANALYTICAL USE'}
      </div>

      {/* ── C2 COMMAND CONSOLE HEADER ── */}
      <header className="h-11 shrink-0 border-b flex items-stretch z-50 bg-[#080C15]"
              style={{ borderColor: cyberMode ? 'rgba(148,0,211,0.4)' : 'rgba(0,240,255,0.18)',
                       boxShadow: cyberMode ? '0 2px 16px rgba(148,0,211,0.12)' : '0 2px 16px rgba(0,240,255,0.06)' }}>

        {/* Logo block */}
        <div className="flex items-center px-4 border-r"
             style={{ borderColor: cyberMode ? 'rgba(148,0,211,0.25)' : 'rgba(0,240,255,0.12)', minWidth: '160px' }}>
          <Shield size={13} className={accentTextClass} />
          <div className="ml-2">
            <div className={`font-mono font-black text-[11px] tracking-[0.3em] leading-none ${accentTextClass}`}
                 style={{ textShadow: cyberMode ? '0 0 14px rgba(148,0,211,0.7)' : '0 0 14px rgba(0,240,255,0.6)' }}>
              {cyberMode ? 'HACKSYS' : 'NIGRAHA'}
            </div>
            <div className="font-mono text-[7px] text-slate-600 tracking-[0.2em] mt-0.5">
              {cyberMode ? 'CYBER C2' : 'TACTICAL C2'}
            </div>
          </div>
        </div>

        {/* Domain counters */}
        <div className="flex items-center px-3 gap-4 border-r"
             style={{ borderColor: cyberMode ? 'rgba(148,0,211,0.25)' : 'rgba(0,240,255,0.12)' }}>
          {[
            { label: 'AIR', value: Object.keys(aircraft).length, color: '#00F0FF' },
            { label: 'SEA', value: 0, color: '#00FF88' },
            { label: 'SPC', value: 11, color: '#c084fc' },
            { label: 'CYBER', value: cyberMode ? (unacknowledged || 0) : 0, color: '#FF3333' },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex flex-col items-center" style={{ minWidth: '32px' }}>
              <span className="font-mono text-[14px] font-black tabular-nums leading-none" style={{ color }}>
                {value.toLocaleString()}
              </span>
              <span className="font-mono text-[7px] text-slate-600 tracking-widest mt-0.5">{label}</span>
            </div>
          ))}
        </div>

        {/* Threat level / DEFCON indicator */}
        <div className="flex items-center px-4 border-r"
             style={{ borderColor: cyberMode ? 'rgba(148,0,211,0.25)' : 'rgba(0,240,255,0.12)' }}>
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-1.5 mb-1">
              <AlertTriangle size={9} style={{ color: cyberMode ? '#9400D3' : threatColors[threatLevel] }}
                             className={threatLevel >= 3 || cyberMode ? 'animate-pulse' : ''} />
              <span className="font-mono text-[7px] text-slate-500 tracking-widest">THREAT</span>
            </div>
            <div className="flex gap-px">
              {[1, 2, 3, 4].map(lvl => (
                <div key={lvl} className="w-6 h-1.5 transition-all duration-500"
                     style={{
                       backgroundColor: cyberMode
                         ? (lvl <= 3 ? '#9400D3' : 'rgba(148,0,211,0.15)')
                         : (lvl <= threatLevel ? threatColors[threatLevel] : 'rgba(255,255,255,0.07)'),
                       boxShadow: (!cyberMode && lvl <= threatLevel) ? `0 0 4px ${threatColors[threatLevel]}66` : 'none',
                     }} />
              ))}
            </div>
            <span className="font-mono text-[8px] font-bold mt-1"
                  style={{ color: cyberMode ? '#a855f7' : threatColors[threatLevel] }}>
              {cyberMode ? 'CYBER ELEVATED' : threatLabel}
            </span>
          </div>
        </div>

        {/* WS status + mission clock */}
        <div className="flex items-center ml-auto px-4 gap-4">
          {/* Feed status */}
          <div className={`flex items-center gap-1.5 font-mono text-[9px] ${wsConnected ? accentTextClass : 'text-red-400'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${wsConnected ? 'animate-pulse' : ''}`}
                 style={{ backgroundColor: wsConnected ? (cyberMode ? '#9400D3' : '#00F0FF') : '#FF3333',
                          boxShadow: wsConnected ? `0 0 6px ${cyberMode ? '#9400D3' : '#00F0FF'}` : 'none' }} />
            {wsConnected ? 'FEEDS LIVE' : 'CONNECTING'}
          </div>

          <div className="h-5 w-px bg-white/8" />

          {/* UTC clock */}
          <div className="flex flex-col items-end">
            <span className="font-mono text-[13px] font-black tabular-nums text-slate-100 leading-none"
                  style={{ letterSpacing: '0.05em' }}>{zuluTime}</span>
            <span className="font-mono text-[7px] text-slate-600 tracking-widest">UTC / ZULU</span>
          </div>
        </div>
      </header>

      {/* ── MAIN WORKSPACE ── */}
      <div className="flex-1 relative overflow-hidden">

        {/* Map fills entire area */}
        <div className="absolute inset-0 z-0">
          <MapCanvas />
        </div>

        {/* Grid overlay */}
        <div className="absolute inset-0 pointer-events-none z-[5]"
             style={{
               backgroundImage: cyberMode
                 ? 'linear-gradient(rgba(148,0,211,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(148,0,211,0.025) 1px,transparent 1px)'
                 : 'linear-gradient(rgba(0,240,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,240,255,0.025) 1px,transparent 1px)',
               backgroundSize: '80px 80px'
             }} />

        {/* Scanline */}
        <div className="absolute inset-0 pointer-events-none z-[5] overflow-hidden">
          <div className="w-full h-px animate-scanline" 
               style={{
                 backgroundImage: cyberMode
                   ? 'linear-gradient(to right, transparent, rgba(148,0,211,0.15), transparent)'
                   : 'linear-gradient(to right, transparent, rgba(0,240,255,0.15), transparent)'
               }} />
        </div>

        {/* ── LEFT PANEL ── */}
        <button
          onClick={toggleLeftPanel}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-40 pointer-events-auto
                     flex flex-col items-center justify-center w-4 h-16 transition-all duration-300
                     bg-[#0A0E17]/80 border-y border-r"
          style={{ 
            left: showLeftPanel ? `${PANEL_W}px` : '0',
            borderColor: cyberMode ? 'rgba(148,0,211,0.3)' : 'rgba(0,240,255,0.3)'
          }}
        >
          {showLeftPanel
            ? <ChevronLeft size={10} className={accentTextClass} />
            : <ChevronRight size={10} className={accentTextClass} />}
        </button>

        <div className={`absolute top-0 left-0 h-full z-30 pointer-events-auto transition-transform duration-300 ease-in-out`}
             style={{ width: `${PANEL_W}px`, transform: showLeftPanel ? 'translateX(0)' : `translateX(-${PANEL_W}px)` }}>
          <div className="h-full bg-[#0A0E17]/97 border-r"
               style={{ ...borderStyle, boxShadow: '4px 0 24px rgba(0,0,0,0.7)' }}>
            <LeftPanel />
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <button
          onClick={toggleRightPanel}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-40 pointer-events-auto
                     flex flex-col items-center justify-center w-4 h-16 transition-all duration-300
                     bg-[#0A0E17]/80 border-y border-l"
          style={{ 
            right: showRightPanel ? `${PANEL_W}px` : '0',
            borderColor: cyberMode ? 'rgba(148,0,211,0.3)' : 'rgba(255,184,0,0.3)'
          }}
        >
          {showRightPanel
            ? <ChevronRight size={10} className={cyberMode ? 'text-[#a855f7]' : 'text-neon-amber'} />
            : <ChevronLeft size={10} className={cyberMode ? 'text-[#a855f7]' : 'text-neon-amber'} />}
        </button>

        <div className="absolute top-0 right-0 h-full z-30 pointer-events-auto transition-transform duration-300 ease-in-out"
             style={{ width: `${PANEL_W}px`, transform: showRightPanel ? 'translateX(0)' : `translateX(${PANEL_W}px)` }}>
          <div className="h-full bg-[#0A0E17]/97 border-l"
               style={{ ...borderStyle, boxShadow: '-4px 0 24px rgba(0,0,0,0.7)' }}>
            <RightPanel />
          </div>
        </div>

        {/* ── LAYER CONTROL ── */}
        <div className="absolute top-3 z-40 pointer-events-auto transition-all duration-300"
             style={{ right: showRightPanel ? `${PANEL_W + 12}px` : '44px' }}>
          <button
            onClick={() => setShowLayers(v => !v)}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 font-mono text-[9px] transition-all border mb-1
              ${showLayers 
                ? (cyberMode ? 'bg-[#9400D3]/15 border-[#9400D3]/50 text-[#a855f7]' : 'bg-[#00F0FF]/15 border-[#00F0FF]/50 text-neon-cyan')
                : 'bg-[#0A0E17]/80 border-white/15 text-slate-400 hover:text-slate-200 hover:border-white/30'}`}
          >
            <Layers size={10} />
            <span className="tracking-widest">LAYERS</span>
          </button>
          {showLayers && <LayerControl />}
        </div>

      </div>

      {/* ── BOTTOM PANEL ── */}
      <div className="shrink-0 z-20">
        <BottomPanel />
      </div>

    </div>
  );
}

export default App;
