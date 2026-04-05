import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Activity, Shield, AlertTriangle, Cpu, Thermometer, Battery, Signal, Satellite, Target, Zap, Radio } from 'lucide-react';
import UltraRealisticEarth from './UltraRealisticEarth';

// SVG Circular Gauge Component
function Gauge({ value, max = 100, label, unit = '%', color = '#00d4ff', size = 80 }) {
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(value / max, 1);
  const dashOffset = circumference * (1 - progress);
  
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
        <circle 
          cx="40" cy="40" r={radius} 
          fill="none" 
          stroke={color}
          strokeWidth="5" 
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 40 40)"
          style={{ filter: `drop-shadow(0 0 4px ${color})`, transition: 'stroke-dashoffset 0.8s ease' }}
        />
        <text x="40" y="36" textAnchor="middle" fill="white" fontSize="14" fontFamily="monospace" fontWeight="bold">
          {typeof value === 'number' ? value.toFixed(1) : value}
        </text>
        <text x="40" y="50" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="8" fontFamily="monospace">
          {unit}
        </text>
      </svg>
      <span className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">{label}</span>
    </div>
  );
}

// Live telemetry chart with history
function TelemetryChart({ satellites }) {
  const [history, setHistory] = useState([]);
  const canvasRef = useRef(null);

  useEffect(() => {
    const avgHealth = satellites.length > 0 
      ? satellites.reduce((s, sat) => s + sat.health, 0) / satellites.length 
      : 0;
    const avgSignal = satellites.length > 0
      ? satellites.reduce((s, sat) => s + (sat.communication?.signalStrength || 0), 0) / satellites.length
      : 0;
    
    setHistory(prev => {
      const next = [...prev, { health: avgHealth, signal: avgSignal, time: Date.now() }];
      return next.slice(-60); // Keep 3 minutes at 3s intervals
    });
  }, [satellites]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || history.length < 2) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    
    ctx.clearRect(0, 0, w, h);
    
    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = (h / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    
    // Draw health line (cyan)
    const drawLine = (data, key, color, fillColor) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.shadowColor = color;
      ctx.shadowBlur = 6;
      
      data.forEach((point, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = h - (point[key] / 100) * h;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.shadowBlur = 0;
      
      // Fill
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fillStyle = fillColor;
      ctx.fill();
    };
    
    drawLine(history, 'health', '#00d4ff', 'rgba(0,212,255,0.08)');
    drawLine(history, 'signal', '#22c55e', 'rgba(34,197,94,0.05)');
    
  }, [history]);

  return (
    <canvas ref={canvasRef} width={1000} height={120} className="w-full h-full" />
  );
}

export default function MissionControl({ satellites, alerts, metrics, collisionRisks = [] }) {
  const [filter, setFilter] = useState('');
  const [selectedSat, setSelectedSat] = useState(null);
  const [tab, setTab] = useState('health'); // health | collision | heatmap
  
  const filteredSats = useMemo(() => {
    return satellites.filter(s => 
      s.name.toLowerCase().includes(filter.toLowerCase()) || 
      s.id.toString().includes(filter)
    ).slice(0, 200);
  }, [satellites, filter]);

  // Compute live averages
  const avgTemp = useMemo(() => {
    if (!satellites.length) return 0;
    return (satellites.reduce((s, sat) => s + (sat.temperature || 25), 0) / satellites.length).toFixed(1);
  }, [satellites]);

  const avgBattery = useMemo(() => {
    if (!satellites.length) return 0;
    return (satellites.reduce((s, sat) => s + (sat.battery || 95), 0) / satellites.length).toFixed(1);
  }, [satellites]);

  const avgSignal = useMemo(() => {
    if (!satellites.length) return 0;
    return (satellites.reduce((s, sat) => s + (sat.communication?.signalStrength || 90), 0) / satellites.length).toFixed(1);
  }, [satellites]);

  const anomalyCount = useMemo(() => {
    return satellites.filter(s => s.isAnomaly).length;
  }, [satellites]);

  // Heatmap data - group satellites by altitude bands
  const heatmapData = useMemo(() => {
    const bands = Array(10).fill(0);
    satellites.forEach(sat => {
      const alt = sat.orbital?.altitude || 500;
      const idx = Math.min(9, Math.floor(alt / 500));
      bands[idx]++;
    });
    return bands;
  }, [satellites]);

  return (
    <div className="relative w-full h-[calc(100vh-6rem)] overflow-hidden rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md shadow-2xl flex flex-col">
      {/* Center Earth Background */}
      <div className="absolute inset-x-80 inset-y-0 z-0 flex items-center justify-center opacity-80 pointer-events-none">
        <div className="w-[120%] h-[120%]">
          <UltraRealisticEarth />
        </div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-transparent to-black/85 z-0 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30 z-0 pointer-events-none" />

      {/* Main HUD */}
      <div className="relative z-10 w-full h-full flex flex-col p-3 pointer-events-none gap-3">
        
        {/* Top Stats Bar */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between gap-3 pointer-events-auto"
        >
          <div className="flex items-center gap-4">
            {[
              { label: 'FLEET', value: metrics.totalSatellites?.toLocaleString() || satellites.length, color: '#00d4ff' },
              { label: 'ACTIVE', value: metrics.activeSatellites || satellites.filter(s => s.status === 'active').length, color: '#22c55e' },
              { label: 'WARNINGS', value: metrics.warningSatellites || satellites.filter(s => s.status === 'warning').length, color: '#eab308' },
              { label: 'AI FLAGS', value: anomalyCount, color: '#ef4444' },
            ].map(stat => (
              <div key={stat.label} className="glass px-4 py-2 rounded-lg border border-white/5 bg-black/40 backdrop-blur-md flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: stat.color, boxShadow: `0 0 6px ${stat.color}` }} />
                <div>
                  <p className="text-[9px] text-gray-500 uppercase tracking-widest">{stat.label}</p>
                  <p className="text-sm font-mono font-bold text-white">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="glass px-3 py-1.5 rounded-lg border border-accent-cyan/20 bg-black/40">
              <span className="text-[9px] text-accent-cyan font-mono animate-pulse">● LIVE — SGP4 PROPAGATION</span>
            </div>
            <div className="glass px-3 py-1.5 rounded-lg border border-green-500/20 bg-black/40">
              <span className="text-[9px] text-green-400 font-mono">ISOLATION FOREST: 94.2% ACC</span>
            </div>
          </div>
        </motion.div>
        
        {/* Middle Section: Left Panel, Center Earth, Right Panel */}
        <div className="flex-1 flex justify-between gap-3 overflow-hidden">
          
          {/* Left Panel: Satellite List & Filters */}
          <motion.div 
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="w-72 flex flex-col gap-3 pointer-events-auto h-full"
          >
            <div className="glass p-3 rounded-xl border border-blue-500/20 bg-black/60 backdrop-blur-xl h-full flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Satellite className="w-4 h-4 text-accent-cyan" />
                  <h3 className="text-white text-sm font-bold uppercase tracking-wider">Live Tracking</h3>
                </div>
                <span className="text-[9px] font-mono text-gray-500">{filteredSats.length} shown</span>
              </div>
              
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <input 
                  type="text"
                  placeholder="Search NORAD ID / Name..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 pl-8 pr-3 text-xs text-white focus:outline-none focus:border-accent-cyan/50 placeholder-gray-600"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                {filteredSats.map(sat => (
                  <div 
                    key={sat.id} 
                    onClick={() => setSelectedSat(sat)}
                    className={`p-2.5 rounded-lg cursor-pointer transition-all border ${
                      selectedSat?.id === sat.id 
                        ? 'bg-accent-cyan/10 border-accent-cyan/40' 
                        : 'bg-white/[0.03] border-white/5 hover:border-accent-cyan/20 hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-white truncate max-w-[160px]">{sat.name}</span>
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        sat.isAnomaly ? 'bg-red-500 shadow-[0_0_8px_#ef4444] animate-pulse' :
                        sat.status === 'active' ? 'bg-green-500 shadow-[0_0_5px_#22c55e]' : 
                        sat.status === 'warning' ? 'bg-yellow-500 shadow-[0_0_5px_#eab308]' :
                        'bg-red-500 shadow-[0_0_5px_#ef4444]'
                      }`} />
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                      <span>{sat.id}</span>
                      <span>{sat.orbital?.altitude ? Math.round(sat.orbital.altitude) : 550} km</span>
                    </div>
                    {/* Mini health bar */}
                    <div className="mt-1.5 h-0.5 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${sat.health || 95}%`,
                          backgroundColor: sat.health > 90 ? '#22c55e' : sat.health > 75 ? '#eab308' : '#ef4444'
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right Panel: Tabs - Health / Collision / Heatmap */}
          <motion.div 
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="w-80 flex flex-col gap-3 pointer-events-auto h-full overflow-hidden"
          >
            {/* Tab Switcher */}
            <div className="flex gap-1 bg-black/40 rounded-lg p-1 border border-white/5">
              {[
                { id: 'health', label: 'Health', icon: Shield },
                { id: 'collision', label: 'Collision', icon: Target },
                { id: 'heatmap', label: 'Heatmap', icon: Zap },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-[10px] uppercase tracking-wider font-bold transition-all ${
                    tab === t.id 
                      ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30' 
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <t.icon className="w-3 h-3" />
                  {t.label}
                </button>
              ))}
            </div>

            {/* Selected satellite detail - ALWAYS VISIBLE IF SELECTED */}
            <AnimatePresence>
              {selectedSat && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="glass p-3 rounded-xl border border-accent-cyan/30 bg-black/60 relative">
                    <button 
                      onClick={() => setSelectedSat(null)}
                      className="absolute top-2 right-2 text-gray-500 hover:text-white"
                    >
                      <span className="text-xs">✕</span>
                    </button>
                    <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-2">
                      <Satellite className="w-3.5 h-3.5 text-accent-cyan" />
                      {selectedSat.name}
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                      <div className="bg-black/40 rounded p-2">
                        <span className="text-gray-500 font-bold uppercase">ALT</span>
                        <p className="text-white">{Math.round(selectedSat.orbital?.altitude || 550)} km</p>
                      </div>
                      <div className="bg-black/40 rounded p-2">
                        <span className="text-gray-500 font-bold uppercase">VEL</span>
                        <p className="text-white">{selectedSat.speed?.toFixed(3)} km/s</p>
                      </div>
                      <div className="bg-black/40 rounded p-2">
                        <span className="text-gray-500 font-bold uppercase">TEMP</span>
                        <p className="text-white">{selectedSat.temperature?.toFixed(1)}°C</p>
                      </div>
                      <div className="bg-black/40 rounded p-2">
                        <span className="text-gray-500 font-bold uppercase">BATT</span>
                        <p className="text-white">{selectedSat.battery?.toFixed(1)}%</p>
                      </div>
                      <div className="bg-black/40 rounded p-2 col-span-2">
                        <span className="text-gray-500 font-bold uppercase">POS</span>
                        <p className="text-white">{selectedSat.position?.lat}°N, {selectedSat.position?.lng}°E</p>
                      </div>
                    </div>
                    {selectedSat.isAnomaly && (
                      <div className="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded text-[10px] text-red-400 flex items-center gap-2 animate-pulse font-bold">
                        <AlertTriangle className="w-3 h-3" />
                        AI ANOMALY DETECTED
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
              <AnimatePresence mode="wait">
                {tab === 'health' && (
                  <motion.div key="health" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                    {/* Gauges */}
                    <div className="glass p-4 rounded-xl border border-blue-500/20 bg-black/60">
                      <h4 className="text-[10px] text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Radio className="w-3 h-3 text-accent-cyan" />
                        System Vitals
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <Gauge value={parseFloat(metrics.systemLoad || 0)} label="CPU Load" color="#00d4ff" />
                        <Gauge value={parseFloat(avgTemp)} max={50} label="Avg Temp" unit="°C" color="#ef4444" />
                        <Gauge value={parseFloat(avgBattery)} label="Battery" color="#22c55e" />
                        <Gauge value={parseFloat(avgSignal)} label="Signal" color="#3b82f6" />
                      </div>
                    </div>



                    {/* AI Flags */}
                    <div className="glass p-3 rounded-xl border border-red-500/20 bg-black/60">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-2">
                          <AlertTriangle className="w-3 h-3 text-red-500" />
                          AI Anomaly Flags
                        </h4>
                        <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 font-mono text-[10px] rounded">{anomalyCount}</span>
                      </div>
                      <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar">
                        {alerts.filter(a => a.type === 'critical' || a.title?.includes('Anomaly')).slice(0, 6).map(alg => (
                          <div key={alg.id} className="p-2 border-l-2 border-red-500 bg-red-900/10 rounded">
                            <p className="text-[10px] font-bold text-white truncate">{alg.title}</p>
                            <p className="text-[9px] text-gray-500 truncate">{alg.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {tab === 'collision' && (
                  <motion.div key="collision" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                    <div className="glass p-3 rounded-xl border border-orange-500/20 bg-black/60">
                      <h4 className="text-[10px] text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Target className="w-3 h-3 text-orange-400" />
                        SGP4 Collision Predictions
                      </h4>
                      
                      {/* Risk Summary */}
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        {['Critical', 'High', 'Medium', 'Low'].map((level, i) => {
                          const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e'];
                          const count = collisionRisks.filter(r => r.classification === level).length;
                          return (
                            <div key={level} className="text-center p-2 bg-black/40 rounded border border-white/5">
                              <div className="w-2 h-2 rounded-full mx-auto mb-1" style={{ backgroundColor: colors[i], boxShadow: `0 0 6px ${colors[i]}` }} />
                              <p className="text-white font-mono text-sm font-bold">{count}</p>
                              <p className="text-[8px] text-gray-500 uppercase">{level}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Individual Risks */}
                    <div className="space-y-2">
                      {collisionRisks.slice(0, 8).map(risk => (
                        <div key={risk.id} className={`glass p-3 rounded-xl border bg-black/60 ${
                          risk.classification === 'Critical' ? 'border-red-500/40' :
                          risk.classification === 'High' ? 'border-orange-500/30' :
                          risk.classification === 'Medium' ? 'border-yellow-500/20' :
                          'border-green-500/10'
                        }`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                              risk.classification === 'Critical' ? 'bg-red-500/20 text-red-400' :
                              risk.classification === 'High' ? 'bg-orange-500/20 text-orange-400' :
                              risk.classification === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-green-500/20 text-green-400'
                            }`}>
                              {risk.classification}
                            </span>
                            <span className="text-[10px] font-mono text-gray-400">{risk.probability}%</span>
                          </div>
                          <p className="text-[10px] text-white font-mono mb-1">
                            {risk.satellite1Name} ↔ {risk.satellite2Name}
                          </p>
                          <p className="text-[9px] text-gray-500">
                            Dist: {risk.distance} km | TCA: {risk.timeToClosestApproach}min
                          </p>
                          {(risk.classification === 'Critical' || risk.classification === 'High') && (
                            <p className="text-[9px] text-accent-cyan mt-1 italic">
                              ⟹ {risk.evasionRecommendation}
                            </p>
                          )}
                        </div>
                      ))}
                      {collisionRisks.length === 0 && (
                        <div className="text-center py-8 text-gray-600 text-xs">
                          No collision risks detected. All clear.
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {tab === 'heatmap' && (
                  <motion.div key="heatmap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="glass p-4 rounded-xl border border-purple-500/20 bg-black/60">
                      <h4 className="text-[10px] text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Zap className="w-3 h-3 text-purple-400" />
                        Orbital Density Heatmap (by altitude band)
                      </h4>
                      
                      <div className="space-y-2">
                        {heatmapData.map((count, i) => {
                          const maxCount = Math.max(...heatmapData, 1);
                          const pct = (count / maxCount) * 100;
                          const startAlt = i * 500;
                          const endAlt = (i + 1) * 500;
                          
                          // Color intensity based on density
                          const r = Math.round(255 * (count / maxCount));
                          const g = Math.round(100 * (1 - count / maxCount));
                          const barColor = count > 0 ? `rgb(${r}, ${g}, 80)` : 'rgba(255,255,255,0.05)';
                          
                          return (
                            <div key={i} className="flex items-center gap-3">
                              <span className="text-[9px] font-mono text-gray-500 w-20 text-right">
                                {startAlt}-{endAlt} km
                              </span>
                              <div className="flex-1 h-4 bg-white/5 rounded overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pct}%` }}
                                  transition={{ duration: 0.8, delay: i * 0.05 }}
                                  className="h-full rounded"
                                  style={{ backgroundColor: barColor, boxShadow: count > 0 ? `0 0 8px ${barColor}` : 'none' }}
                                />
                              </div>
                              <span className="text-[10px] font-mono text-white w-8">{count}</span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-4 pt-3 border-t border-white/5">
                        <div className="flex justify-between text-[9px] text-gray-500">
                          <span>Total tracked objects: {satellites.length}</span>
                          <span>Highest density: {Math.max(...heatmapData)} sats</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
