import { useState } from 'react';
import { useLayerStore } from '../../stores/useLayerStore';
import { Layers, ChevronDown, ChevronRight, Activity, Eye, EyeOff } from 'lucide-react';

const DOMAIN_COLORS: Record<string, string> = {
  GEOINT: '#00F0FF',
  SIGINT: '#00FF88',
  OSINT: '#FFB800',
  MILINT: '#FF3333',
};

export default function LayerControl() {
  const { layers, layerGroups, toggleLayer } = useLayerStore();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const domains = [...new Set(layerGroups.map(g => g.domain))];

  const toggleDomain = (domain: string) => {
    setCollapsed(prev => ({ ...prev, [domain]: !prev[domain] }));
  };

  const activeCount = Object.values(layers).filter(Boolean).length;

  return (
    <div className="bg-[#0A0E17]/95 backdrop-blur-xl border border-[#00F0FF]/20 shadow-[0_0_30px_rgba(0,0,0,0.8)] w-60 relative">
      {/* Corner brackets */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-neon-cyan/70"></div>
      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-neon-cyan/70"></div>
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-neon-cyan/70"></div>
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-neon-cyan/70"></div>

      {/* Header */}
      <div className="px-3 py-2 border-b border-[#00F0FF]/20 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Layers size={12} className="text-neon-cyan" />
          <span className="font-mono text-[10px] font-bold text-neon-cyan tracking-widest uppercase">Data Layers</span>
        </div>
        <div className="flex items-center space-x-2">
          <Activity size={10} className="text-neon-cyan animate-pulse" />
          <span className="font-mono text-[9px] text-slate-500">{activeCount} ACTIVE</span>
        </div>
      </div>

      {/* Layer Groups by Domain */}
      <div className="overflow-y-auto max-h-80 py-1">
        {domains.map(domain => {
          const domainLayers = layerGroups.filter(g => g.domain === domain);
          const isCollapsed = collapsed[domain];
          const domainColor = DOMAIN_COLORS[domain] || '#00F0FF';
          const enabledInDomain = domainLayers.filter(l => layers[l.id]).length;

          return (
            <div key={domain} className="border-b border-white/5">
              {/* Domain Header */}
              <button
                className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-white/5 transition-colors group"
                onClick={() => toggleDomain(domain)}
              >
                <div className="flex items-center space-x-2">
                  {isCollapsed ? <ChevronRight size={10} style={{ color: domainColor }} /> : <ChevronDown size={10} style={{ color: domainColor }} />}
                  <span className="font-mono text-[9px] font-bold tracking-widest" style={{ color: domainColor }}>{domain}</span>
                </div>
                <span className="font-mono text-[8px] text-slate-600">{enabledInDomain}/{domainLayers.length}</span>
              </button>

              {/* Layer Toggles */}
              {!isCollapsed && domainLayers.map(layer => {
                const isEnabled = !!layers[layer.id];
                return (
                  <div
                    key={layer.id}
                    className={`flex items-center justify-between px-4 py-1.5 cursor-pointer transition-all hover:bg-white/5 ${isEnabled ? 'bg-white/5' : ''}`}
                    onClick={() => toggleLayer(layer.id)}
                  >
                    <div className="flex items-center space-x-2">
                      {isEnabled
                        ? <Eye size={9} style={{ color: domainColor }} />
                        : <EyeOff size={9} className="text-slate-600" />
                      }
                      <span className={`font-mono text-[9px] ${isEnabled ? 'text-slate-200' : 'text-slate-600'}`}>
                        {layer.label}
                      </span>
                    </div>
                    {/* Toggle pill */}
                    <div className={`w-7 h-3.5 rounded-full border relative transition-all ${isEnabled ? 'border-current' : 'border-slate-700'}`}
                         style={isEnabled ? { borderColor: domainColor } : {}}>
                      <div
                        className={`absolute top-0.5 w-2 h-2 rounded-full transition-all ${isEnabled ? 'right-0.5' : 'left-0.5 bg-slate-600'}`}
                        style={isEnabled ? { backgroundColor: domainColor, boxShadow: `0 0 6px ${domainColor}` } : {}}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 border-t border-white/5">
        <div className="font-mono text-[8px] text-slate-600 text-center tracking-widest">
          NIGRAHA LAYER MATRIX v2.0
        </div>
      </div>
    </div>
  );
}
