import { useState, useEffect } from 'react';
import { useAlertStore } from '../../stores/useAlertStore';
import { useADSBStore } from '../../stores/useADSBStore';
import { useCyberStore } from '../../stores/useCyberStore';
import { Play, Pause, SkipBack, SkipForward, MapPin, Clock, Ghost } from 'lucide-react';

const MGRS_ZONES = ['38T MN 1234 5678', '38T NM 8765 4321', '44U NQ 3344 2211'];

export default function BottomPanel() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [timeValue, setTimeValue] = useState(100);
  const [mgrsIdx, setMgrsIdx] = useState(0);
  const [zuluTime, setZuluTime] = useState('');
  const { alerts } = useAlertStore();
  const aircraft = useADSBStore(state => state.aircraft);
  const { cyberMode, toggleCyberMode } = useCyberStore();

  const latestAlerts = alerts.filter(a => !a.acknowledged).slice(0, 3);
  const emergencies = Object.values(aircraft).filter(a => a.emergency);

  useEffect(() => {
    const tick = () => setZuluTime(new Date().toISOString().replace('T', ' ').slice(0, 19) + 'Z');
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setMgrsIdx(i => (i + 1) % MGRS_ZONES.length), 5000);
    return () => clearInterval(t);
  }, []);

  const accentColor = cyberMode ? '#9400D3' : '#00F0FF';
  const textClass = cyberMode ? 'text-[#a855f7]' : 'text-neon-cyan';
  const borderClass = cyberMode ? 'border-[#9400D3]/30' : 'border-[#00F0FF]/20';
  const bgClass = cyberMode ? 'bg-[#9400D3]/10 text-[#a855f7] border-[#9400D3]/30' : 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30';

  return (
    <div className={`w-full bg-[#0A0E17]/95 backdrop-blur-xl border-t transition-colors duration-300 ${borderClass} shadow-[0_-4px_20px_rgba(0,0,0,0.5)]`}>
      {/* Alert Ticker Row */}
      <div className="flex items-center border-b border-white/5 h-8 overflow-hidden">
        {/* Emergency flash */}
        {emergencies.length > 0 && !cyberMode && (
          <div className="flex-shrink-0 bg-neon-red/20 border-r border-neon-red/30 px-3 h-full flex items-center space-x-2 animate-pulse">
            <span className="text-neon-red font-mono text-[9px] font-bold">⚠ {emergencies.length} EMERGENCY</span>
          </div>
        )}

        {/* Alert ticker */}
        <div className="flex-1 overflow-hidden relative">
          <div className="flex space-x-8 animate-marquee whitespace-nowrap">
            {latestAlerts.length > 0
              ? latestAlerts.map((alert, i) => (
                <span key={i} className="font-mono text-[9px] inline-flex items-center space-x-2">
                  <span className={cyberMode ? 'text-[#a855f7]' : 'text-neon-amber'}>[{alert.severity}]</span>
                  <span className="text-slate-300">{alert.message}</span>
                  <span className="text-slate-600">•</span>
                </span>
              ))
              : <span className="font-mono text-[9px] text-slate-600">NO ACTIVE ALERTS — ALL SYSTEMS NOMINAL</span>
            }
          </div>
        </div>

        {/* ZULU clock */}
        <div className="flex-shrink-0 border-l border-white/10 px-3 h-full flex items-center space-x-2">
          <Clock size={9} className={textClass} />
          <span className={`font-mono text-[9px] font-bold ${textClass}`}>{zuluTime}</span>
        </div>
      </div>

      {/* Controls Row */}
      <div className="flex items-center space-x-4 px-4 py-2">
        {/* Playback Controls */}
        <div className={`flex items-center space-x-1 flex-shrink-0 ${textClass}`}>
          <button className="p-1 hover:bg-white/10 rounded transition-colors"><SkipBack size={12} /></button>
          <button className={`p-1.5 hover:bg-white/10 rounded transition-colors border ${bgClass}`}
            onClick={() => setIsPlaying(!isPlaying)}>
            {isPlaying ? <Pause size={12} /> : <Play size={12} />}
          </button>
          <button className="p-1 hover:bg-white/10 rounded transition-colors"><SkipForward size={12} /></button>
        </div>

        {/* Time label */}
        <div className="font-mono text-[9px] text-slate-500 w-14 flex-shrink-0">
          {timeValue === 100 ? 'LIVE' : `T-${100 - timeValue}m`}
        </div>

        {/* Slider */}
        <div className="flex-1 relative flex items-center h-6">
          <div className="absolute w-full h-px bg-white/10"></div>
          {/* Tick marks */}
          {[0, 25, 50, 75, 100].map(v => (
            <div key={v} className="absolute w-px h-2 bg-white/20" style={{ left: `${v}%` }}></div>
          ))}
          <input
            type="range" min="0" max="100" value={timeValue}
            onChange={(e) => setTimeValue(Number(e.target.value))}
            className="w-full absolute appearance-none bg-transparent cursor-pointer z-10
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3
              [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-sm"
            style={{
              WebkitAppearance: 'none',
            }}
          />
          {/* Custom track slider thumb color via style */}
          <style>{`
            input[type=range]::-webkit-slider-thumb {
              background: ${accentColor} !important;
              box-shadow: 0 0 8px ${accentColor} !important;
            }
          `}</style>
        </div>

        {/* LIVE badge */}
        <div className={`flex-shrink-0 font-mono text-[9px] font-bold px-2 py-1 border transition-colors duration-300 ${
          timeValue === 100 ? bgClass : 'text-slate-600 border-white/10'
        }`}>
          {timeValue === 100 ? '● LIVE' : '⏸ REPLAY'}
        </div>

        {/* MGRS Display */}
        <div className="flex-shrink-0 border border-white/10 px-2 py-1 flex items-center space-x-2 bg-white/5">
          <MapPin size={9} className={textClass} />
          <div className="flex flex-col">
            <span className="font-mono text-[7px] text-slate-600">MGRS GRID</span>
            <span className={`font-mono text-[9px] ${textClass}`}>{MGRS_ZONES[mgrsIdx]}</span>
          </div>
        </div>

        {/* Floating Ghost Symbol to toggle Cyber mode */}
        <button
          onClick={toggleCyberMode}
          className={`flex-shrink-0 border p-2 rounded-sm transition-all duration-300 ${
            cyberMode 
              ? 'bg-[#9400D3]/20 border-[#9400D3] text-[#a855f7] shadow-[0_0_12px_#9400D3]' 
              : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/30'
          }`}
          title="Toggle Cyber Mode"
        >
          <Ghost size={14} className={cyberMode ? 'animate-pulse' : ''} />
        </button>
      </div>
    </div>
  );
}
