import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Web Audio API Synthesizer ---
const SynthAudio = {
  ctx: null, sirenOsc: null, sirenInterval: null, ambientOsc: null,
  init() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === 'suspended') this.ctx.resume();
  },
  playSiren() {
    this.init();
    if (this.sirenOsc) return;
    this.sirenOsc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    this.sirenOsc.connect(gain);
    gain.connect(this.ctx.destination);
    this.sirenOsc.type = 'square';
    gain.gain.value = 0.05;
    this.sirenOsc.frequency.value = 770;
    this.sirenOsc.start();
    let high = true;
    this.sirenInterval = setInterval(() => {
      if(this.sirenOsc) this.sirenOsc.frequency.setTargetAtTime(high ? 960 : 770, this.ctx.currentTime, 0.05);
      high = !high;
    }, 400);
  },
  stopSiren() {
    if (this.sirenOsc) { try{this.sirenOsc.stop(); this.sirenOsc.disconnect();}catch(e){} this.sirenOsc = null; }
    if (this.sirenInterval) { clearInterval(this.sirenInterval); this.sirenInterval = null; }
  },
  playAmbient() {
    this.init();
    if (this.ambientOsc) return;
    this.ambientOsc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    filter.type = 'lowpass';
    filter.frequency.value = 150;
    this.ambientOsc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    this.ambientOsc.type = 'sawtooth';
    this.ambientOsc.frequency.value = 40;
    gain.gain.value = 0.4;
    this.ambientOsc.start();
  },
  stopAmbient() {
    if (this.ambientOsc) { try{this.ambientOsc.stop(); this.ambientOsc.disconnect();}catch(e){} this.ambientOsc = null; }
  },
  stopAll() { this.stopSiren(); this.stopAmbient(); }
};

// --- SVG Vehicle Icons ---
const CarIcon = ({ color }) => (
  <svg viewBox="0 0 24 48" className={`w-full h-full ${color}`}>
    <path fill="currentColor" d="M4 10c0-2 4-8 8-8s8 6 8 8v24c0 4-4 6-8 6s-8-2-8-6V10z" />
    <rect fill="rgba(0,0,0,0.3)" x="6" y="12" width="12" height="10" rx="2" />
    <rect fill="rgba(255,255,255,0.2)" x="7" y="38" width="2" height="4" />
    <rect fill="rgba(255,255,255,0.2)" x="15" y="38" width="2" height="4" />
  </svg>
);

const TruckIcon = ({ color }) => (
  <svg viewBox="0 0 32 64" className={`w-full h-full ${color}`}>
    <rect fill="currentColor" x="4" y="2" width="24" height="12" rx="2" />
    <rect fill="currentColor" x="2" y="16" width="28" height="44" rx="2" />
    <rect fill="rgba(0,0,0,0.4)" x="6" y="4" width="20" height="6" rx="1" />
  </svg>
);

const BikeIcon = ({ color }) => (
  <svg viewBox="0 0 16 32" className={`w-full h-full ${color}`}>
    <rect fill="currentColor" x="6" y="2" width="4" height="28" rx="2" />
    <circle fill="black" cx="8" cy="8" r="3" />
    <circle fill="black" cx="8" cy="24" r="3" />
  </svg>
);

const AmbulanceIcon = () => (
  <svg viewBox="0 0 32 64" className="w-full h-full text-white">
    <rect fill="white" x="4" y="4" width="24" height="56" rx="4" />
    <path fill="red" d="M11 28h10v4h-10zM14 25h4v10h-4z" />
    <rect fill="#3b82f6" x="8" y="8" width="16" height="4" rx="1" className="animate-pulse" />
    <rect fill="rgba(0,0,0,0.2)" x="8" y="14" width="16" height="10" rx="1" />
  </svg>
);

// --- Simulation Logic ---
const VEHICLE_TYPES = [
  { type: 'car', color: 'text-blue-400', width: 22, height: 42, speed: 4 },
  { type: 'truck', color: 'text-orange-500', width: 28, height: 60, speed: 3.5 },
  { type: 'bike', color: 'text-green-400', width: 14, height: 32, speed: 4.5 }
];
const DIRECTIONS = ['N', 'S', 'E', 'W']; 
const LANES = [1, 2, 3];
const JUNCTION_CENTERS_X = [400, 1000, 1600];
const HIGHWAY_Y = 400;
const ROAD_WIDTH = 120;
const LANE_WIDTH = 40;
const STOP_LINE_DIST = 120;
const DEMO_TOTAL_FRAMES = 1350;

function generateDemoTimeline() {
  const frames = [];
  const s = {
    tick: 0,
    activePhase: 'normal',
    vehicles: [],
    signals: [
      { N: 'RED', S: 'RED', E: 'GREEN', W: 'GREEN' },
      { N: 'GREEN', S: 'GREEN', E: 'RED', W: 'RED' },
      { N: 'RED', S: 'RED', E: 'GREEN', W: 'GREEN' }
    ],
    signalTimers: [0, 40, 0],
    emergencyTriggered: false,
    ambulanceETAs: [null, null, null]
  };

  const getStartPoint = (dir, lane, jIdx) => {
    const jx = JUNCTION_CENTERS_X[jIdx];
    if (dir === 'N') return { x: jx - ROAD_WIDTH + (lane-1)*LANE_WIDTH + 20, y: 0, angle: 180 };
    if (dir === 'S') return { x: jx + ROAD_WIDTH - (lane-1)*LANE_WIDTH - 20, y: 800, angle: 0 };
    if (dir === 'W') return { x: 0, y: HIGHWAY_Y + ROAD_WIDTH - (lane-1)*LANE_WIDTH - 20, angle: 90 };
    if (dir === 'E') return { x: 2000, y: HIGHWAY_Y - ROAD_WIDTH + (lane-1)*LANE_WIDTH + 20, angle: 270 };
    return {x:0, y:0, angle:0};
  };

  const uuid = () => Math.random().toString(36).substr(2, 9);

  for (let i = 0; i < DEMO_TOTAL_FRAMES; i++) {
    s.tick = i;
    const sec = Math.floor(i / 30);
    if (sec < 10) s.activePhase = 'normal';
    else if (sec >= 10 && sec < 20) s.activePhase = 'heavy';
    else if (sec >= 20) {
      if (!s.emergencyTriggered) {
        s.emergencyTriggered = true;
        s.vehicles.push({
          id: uuid(), dir: 'W', lane: 3, targetLane: 3, jIdx: 0,
          type: 'ambulance', color: 'text-white', width: 28, length: 56,
          x: getStartPoint('W', 3, 0).x, y: getStartPoint('W', 3, 0).y,
          speed: 9, maxSpeed: 9, baseAngle: 90, visualAngle: 90,
          isAmbulance: true, shiftingOffset: 0
        });
        s.vehicles.forEach(v => {
          if (v.dir === 'W' && v.targetLane === 3 && !v.isAmbulance) { v.targetLane = Math.random() < 0.5 ? 1 : 2; }
        });
      }
      s.activePhase = 'emergency';
    }

    let amb = s.vehicles.find(v => v.isAmbulance);
    const dur = s.activePhase === 'heavy' ? 120 : 80;
    
    s.ambulanceETAs = [null, null, null];
    for (let j = 0; j < 3; j++) {
      let isForced = false;
      if (amb) {
        const dX = JUNCTION_CENTERS_X[j] - (amb.x + amb.length/2);
        if (dX > -150) { 
          const eta = dX / (amb.speed * 30);
          s.ambulanceETAs[j] = Math.max(0, eta).toFixed(1);
          if (eta <= 5.0) {
            isForced = true;
            s.signals[j] = { N: 'RED', S: 'RED', E: 'EMERGENCY_GREEN', W: 'EMERGENCY_GREEN' };
          }
        } else s.ambulanceETAs[j] = "PASSED";
      }
      if (!isForced) {
        s.signalTimers[j]++;
        if (s.signalTimers[j] > dur) {
          s.signalTimers[j] = 0;
          if (s.signals[j].N === 'GREEN') s.signals[j] = { N: 'RED', S: 'RED', E: 'GREEN', W: 'GREEN' };
          else s.signals[j] = { N: 'GREEN', S: 'GREEN', E: 'RED', W: 'RED' };
        }
      }
    }

    let spawnRate = (s.activePhase === 'heavy') ? 0.12 : 0.05;
    if (Math.random() < spawnRate) {
      const dir = DIRECTIONS[Math.floor(Math.random() * 4)];
      const ln = LANES[Math.floor(Math.random() * 3)];
      if (!(s.activePhase === 'emergency' && dir === 'W' && ln === 3)) {
         const jIdx = (dir === 'N' || dir === 'S') ? Math.floor(Math.random() * 3) : 0;
         const sp = getStartPoint(dir, ln, jIdx);
         const td = VEHICLE_TYPES[Math.floor(Math.random() * 3)];
         s.vehicles.push({
           id: uuid(), dir, lane: ln, targetLane: ln, jIdx,
           type: td.type, color: td.color, width: td.width, length: td.height,
           x: sp.x, y: sp.y, speed: td.speed, maxSpeed: td.speed, baseAngle: sp.angle, visualAngle: sp.angle, isAmbulance: false, shiftingOffset: 0
         });
      }
    }

    const activeBatch = [];
    for (const v of s.vehicles) {
      let isShifting = false;
      if (v.lane !== v.targetLane) {
        isShifting = true;
        const diff = v.targetLane - v.lane;
        const sSpd = 0.8;
        const steer = 25 * Math.sign(diff);
        if (v.dir === 'N') { v.x += Math.sign(diff) * sSpd; v.visualAngle = v.baseAngle - steer; }
        if (v.dir === 'S') { v.x -= Math.sign(diff) * sSpd; v.visualAngle = v.baseAngle - steer; }
        if (v.dir === 'E') { v.y += Math.sign(diff) * sSpd; v.visualAngle = v.baseAngle + steer; }
        if (v.dir === 'W') { v.y += Math.sign(diff) * sSpd; v.visualAngle = v.baseAngle - steer; }
        v.shiftingOffset += sSpd;
        if (v.shiftingOffset >= Math.abs(diff * LANE_WIDTH)) {
          v.lane = v.targetLane; v.shiftingOffset = 0;
          const ex = getStartPoint(v.dir, v.lane, v.jIdx);
          if (v.dir === 'N' || v.dir === 'S') v.x = ex.x; else v.y = ex.y;
          v.visualAngle = v.baseAngle;
        }
      } else v.visualAngle = v.baseAngle;

      let canGo = true;
      let dStop = 9999;
      let upJ = -1;
      const nx = v.dir === 'W' ? v.x + v.length/2 : (v.dir === 'E' ? v.x - v.length/2 : v.x);
      const ny = v.dir === 'N' ? v.y + v.length/2 : (v.dir === 'S' ? v.y - v.length/2 : v.y);

      if (v.dir === 'N' || v.dir === 'S') {
        upJ = v.jIdx;
        const sLY = v.dir === 'N' ? HIGHWAY_Y - STOP_LINE_DIST : HIGHWAY_Y + STOP_LINE_DIST;
        const d = v.dir === 'N' ? sLY - ny : ny - sLY;
        if (d >= 0 && d < 120) dStop = d;
      } else {
        for (let k = 0; k < 3; k++) {
          const sLX = v.dir === 'W' ? JUNCTION_CENTERS_X[k] - STOP_LINE_DIST : JUNCTION_CENTERS_X[k] + STOP_LINE_DIST;
          const d = v.dir === 'W' ? sLX - nx : nx - sLX;
          if (d >= 0 && d < dStop) { dStop = d; upJ = k; }
        }
      }
      if (upJ !== -1 && dStop < 70 && !v.isAmbulance) {
        if (s.signals[upJ][v.dir] === 'RED') {
          canGo = false;
          if (dStop < 1) v.speed = 0;
        }
      }

      const others = s.vehicles.filter(ov => ov.dir === v.dir && ov.targetLane === v.targetLane && ov.id !== v.id);
      for (const o of others) {
          let gap = 999;
          if (v.dir === 'N' && o.y > v.y) gap = (o.y - o.length/2) - (v.y + v.length/2);
          if (v.dir === 'S' && o.y < v.y) gap = (v.y - v.length/2) - (o.y + o.length/2);
          if (v.dir === 'W' && o.x > v.x) gap = (o.x - o.length/2) - (v.x + v.length/2);
          if (v.dir === 'E' && o.x < v.x) gap = (v.x - v.length/2) - (o.x + o.length/2);
          if (gap > 0 && gap < 20) canGo = false;
      }

      const mS = isShifting ? (v.maxSpeed * 0.4) : v.maxSpeed;
      if (canGo) { v.speed = Math.min(v.speed + 0.3, mS); }
      else { v.speed = Math.max(v.speed - 0.8, 0); }

      if (v.dir === 'N') v.y += v.speed; if (v.dir === 'S') v.y -= v.speed;
      if (v.dir === 'W') v.x += v.speed; if (v.dir === 'E') v.x -= v.speed;
      if (v.x >= -100 && v.x <= 2100 && v.y >= -100 && v.y <= 900) activeBatch.push(v);
    }
    s.vehicles = activeBatch;
    frames.push({
      tick: s.tick, activePhase: s.activePhase,
      vehicles: JSON.parse(JSON.stringify(s.vehicles)),
      signals: JSON.parse(JSON.stringify(s.signals)),
      emergencyTriggered: s.emergencyTriggered,
      ambulanceETAs: [...s.ambulanceETAs]
    });
  }
  return frames;
}

export default function AdvancedSimulation() {
  const [timeline, setTimeline] = useState([]);
  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [soundEnabled, setSoundEnabled] = useState(false);
  
  useEffect(() => { setTimeline(generateDemoTimeline()); }, []);

  useEffect(() => {
    if (!isPlaying || timeline.length === 0) return;
    const interval = setInterval(() => {
      setFrameIndex(prev => {
        if (prev >= timeline.length - 1) { setIsPlaying(false); return timeline.length - 1; }
        return prev + 1;
      });
    }, (1000 / 30) / playbackSpeed);
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, timeline.length]);

  useEffect(() => {
    if (!timeline[frameIndex]) return;
    if (soundEnabled && isPlaying) {
      SynthAudio.playAmbient();
      if (timeline[frameIndex].emergencyTriggered) SynthAudio.playSiren();
      else SynthAudio.stopSiren();
    } else SynthAudio.stopAll();
    return () => SynthAudio.stopAll();
  }, [frameIndex, isPlaying, soundEnabled, timeline]);

  const handleRestart = () => { setFrameIndex(0); setIsPlaying(true); };

  if (timeline.length === 0) return <div className="h-screen w-screen flex items-center justify-center bg-dark-950 text-cyan-400 font-black animate-pulse uppercase tracking-[0.3em]">Calibrating Neural Network...</div>;

  const { vehicles, signals, emergencyTriggered, ambulanceETAs } = timeline[frameIndex];
  const timeSec = Math.floor(frameIndex / 30);
  const isFinished = frameIndex === timeline.length - 1;

  return (
    <div className="w-full h-full flex flex-col p-4 bg-dark-950 font-sans text-slate-200 overflow-hidden select-none">
      
      {/* Header Panel */}
      <div className="flex-shrink-0 flex items-center justify-between bg-dark-900 border border-white/5 p-4 rounded-3xl shadow-2xl mb-4 z-10 w-full animate-in slide-in-from-top-4 duration-500">
        <div>
          <h2 className="text-2xl font-black bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent mb-1 tracking-tighter uppercase">Q-Traffic Nexus v5</h2>
          <button onClick={() => setSoundEnabled(!soundEnabled)} 
                  className={`px-4 py-1.5 rounded-full text-[9px] font-black border transition-all ${soundEnabled ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10 shadow-[0_0_15px_cyan]' : 'border-zinc-800 text-zinc-600'}`}>
            {soundEnabled ? '🔊 AUDIO EMITTING' : '🔈 AUDIO MUTED'}
          </button>
        </div>
        
        <div className="flex flex-col items-center flex-1 max-w-xl mx-8">
             <div className="text-[10px] uppercase font-black tracking-widest text-zinc-600 mb-1">Temporal Scrub Axis</div>
             <input type="range" min="0" max={DEMO_TOTAL_FRAMES - 1} value={frameIndex} 
                    onChange={(e) => { setFrameIndex(Number(e.target.value)); setIsPlaying(false); }}
                    className="w-full accent-cyan-400 cursor-ew-resize h-1 bg-white/5 rounded-full" />
             <div className="text-xs font-mono mt-2 text-cyan-400 font-black tabular-nums">{timeSec}s <span className="text-zinc-800 mx-2">/</span> 45s</div>
        </div>
        
        <div className="flex items-center gap-4">
            <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5">
                {[0.5, 1.0, 2.0].map(s => (
                  <button key={s} onClick={() => setPlaybackSpeed(s)} 
                          className={`px-4 py-1.5 text-[10px] font-black rounded-xl transition-all ${playbackSpeed === s ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' : 'text-zinc-600 hover:text-white'}`}>{s}X</button>
                ))}
            </div>
            <button onClick={() => setIsPlaying(!isPlaying)} 
                    className={`px-10 py-4 rounded-[2rem] font-black text-xs transition-all tracking-widest ${isPlaying ? 'bg-red-500/10 text-red-500 border border-red-500' : 'bg-cyan-500 text-black shadow-[0_0_40px_rgba(6,182,212,0.4)]'}`}>
              {isPlaying ? 'PAUSE' : 'INITIALIZE'}
            </button>
        </div>
      </div>

      {/* Visualizer Area */}
      <div className="flex-1 relative bg-black border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl flex items-center justify-center">
        
        <div className="relative origin-center" style={{ width: 2000, height: 800, transform: 'scale(min(1, max(0.4, min(100vw/2100, 100vh/900))))' }}>
            
            {/* Roads */}
            <div className="absolute top-[400px] -translate-y-[50%] bg-zinc-900/50" style={{ width: 2000, height: ROAD_WIDTH*2 }} />
            <div className="absolute bg-yellow-400/30" style={{ top: HIGHWAY_Y - 1, left: 0, width: 2000, height: 2 }} />
            
            {[40, 80, -40, -80].map(off => (
               <div key={off} className="absolute border-t border-dashed border-white/5" style={{ top: HIGHWAY_Y + off, left: 0, width: 2000 }} />
            ))}

            {JUNCTION_CENTERS_X.map((jx, i) => (
              <React.Fragment key={`avenue-${i}`}>
                <div className="absolute top-0 bottom-0 bg-zinc-900/50" style={{ width: ROAD_WIDTH*2, left: jx - ROAD_WIDTH }} />
                <div className="absolute bg-yellow-400/20" style={{ left: jx - 1, top: 0, height: 800, width: 2 }} />
                
                {/* Visual Stop Lines */}
                <div className="absolute bg-white/40" style={{ left: jx - 120, top: HIGHWAY_Y - 120, width: 120, height: 4 }} />
                <div className="absolute bg-white/40" style={{ left: jx, top: HIGHWAY_Y + 120, width: 120, height: 4 }} />
                <div className="absolute bg-white/40" style={{ left: jx + 120, top: HIGHWAY_Y - 120, width: 4, height: 120 }} />
                <div className="absolute bg-white/40" style={{ left: jx - 120 - 4, top: HIGHWAY_Y, width: 4, height: 120 }} />

                <TrafficLight x={jx - ROAD_WIDTH - 25} y={HIGHWAY_Y - STOP_LINE_DIST - 15} signal={signals[i].N} />
                <TrafficLight x={jx + ROAD_WIDTH + 15} y={HIGHWAY_Y + STOP_LINE_DIST + 5} signal={signals[i].S} />
                <TrafficLight x={jx + STOP_LINE_DIST + 5} y={HIGHWAY_Y - ROAD_WIDTH - 25} signal={signals[i].E} horizontal />
                <TrafficLight x={jx - STOP_LINE_DIST - 15} y={HIGHWAY_Y + ROAD_WIDTH + 15} signal={signals[i].W} horizontal />
                
                {emergencyTriggered && ambulanceETAs[i] && ambulanceETAs[i] !== "PASSED" && (
                    <div className="absolute font-mono text-center shadow-[0_0_20px_rgba(34,211,238,0.4)] bg-zinc-900/90 backdrop-blur-xl border border-cyan-500/40 px-3 py-1 rounded-2xl z-50 animate-in fade-in zoom-in-50" 
                         style={{ left: jx - 40, top: HIGHWAY_Y - 200, width: 80 }}>
                        <div className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">ETA</div>
                        <div className="text-xl text-cyan-400 font-bold tabular-nums">{ambulanceETAs[i]}<span className="text-xs text-zinc-700 ml-0.5">s</span></div>
                    </div>
                )}
              </React.Fragment>
            ))}

            {vehicles.map(v => (
             <div
               key={v.id}
               className={`absolute transform transition-transform duration-100 ease-linear`}
               style={{
                 width: v.width, height: v.length,
                 left: v.x - v.width/2, top: v.y - v.length/2,
                 transform: `rotate(${v.visualAngle}deg)`,
                 zIndex: v.isAmbulance ? 100 : 10,
                 filter: v.isAmbulance ? 'drop-shadow(0 0 20px #fff)' : 'none'
               }}
             >
                {v.type === 'ambulance' ? <AmbulanceIcon /> : 
                 v.type === 'truck' ? <TruckIcon color={v.color} /> : 
                 v.type === 'bike' ? <BikeIcon color={v.color} /> : 
                 <CarIcon color={v.color} />}
             </div>
            ))}
            
            {emergencyTriggered && (
               <div className="absolute top-[420px] left-0 h-[40px] w-full bg-cyan-500/5 pointer-events-none border-y border-cyan-500/5" style={{ zIndex: 5 }} />
            )}
        </div>

        <AnimatePresence>
          {isFinished && (
            <motion.div initial={{ opacity:0, scale: 0.95 }} animate={{ opacity:1, scale: 1 }} exit={{ opacity:0 }}
                        className="absolute inset-x-20 top-10 bottom-10 bg-black/60 backdrop-blur-3xl border border-white/10 rounded-[4rem] p-16 shadow-[0_0_100px_#000] z-[200]">
              <h1 className="text-7xl font-black text-center mb-16 text-white tracking-tighter uppercase italic">System Summary</h1>
              <div className="grid grid-cols-2 gap-10 mb-16 max-w-5xl mx-auto">
                   {[
                     { l: 'Efficiency Gain', v: '+48%', d: 'Synchronized Routing Engine', c: 'text-cyan-400' },
                     { l: 'Emergency Path', v: 'CLEAR', d: 'Predictive Lane Transition', c: 'text-red-500' },
                     { l: 'Congestion Δ', v: '-32%', d: 'Inter-lane Flow Balancing', c: 'text-green-500' },
                     { l: 'Process IQ', v: 'Stable', d: 'Adaptive Neural Shifting', c: 'text-zinc-600' }
                   ].map((it, idx) => (
                     <div key={idx} className="bg-zinc-900/50 p-12 rounded-[3.5rem] border border-white/5 text-center">
                        <div className="text-[10px] uppercase text-zinc-600 font-black mb-3 tracking-[0.3em]">{it.l}</div>
                        <div className={`text-7xl font-black ${it.c} tracking-tighter mb-4`}>{it.v}</div>
                        <div className="text-[10px] text-zinc-700 font-bold uppercase tracking-widest">{it.d}</div>
                     </div>
                   ))}
              </div>
              <button onClick={handleRestart} className="block w-full max-w-xl mx-auto py-8 bg-cyan-500 text-black font-black text-2xl rounded-full hover:brightness-110 active:scale-95 transition-all shadow-2xl shadow-cyan-500/20 uppercase tracking-[0.2em]">Relaunch Protocol</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function TrafficLight({ x, y, signal, horizontal = false }) {
  const isRed = signal === 'RED';
  const isGreen = signal === 'GREEN' || signal === 'EMERGENCY_GREEN';
  const isEmerg = signal === 'EMERGENCY_GREEN';

  return (
    <div className={`absolute flex ${horizontal ? 'flex-row' : 'flex-col'} gap-[4px] p-2 bg-[#050505] rounded-2xl border border-zinc-900 shadow-2xl`}
         style={{ left: x, top: y, transform: horizontal ? 'rotate(90deg)' : 'none', zIndex: 50 }}>
      {/* 4 bulbs: Red, Yellow, Green, Emergency */}
      <div className={`w-3.5 h-3.5 rounded-full ${isRed ? 'bg-red-500 shadow-[0_0_15px_#ef4444]' : 'bg-red-950/20'}`} />
      <div className="w-3.5 h-3.5 rounded-full bg-orange-950/10" />
      <div className={`w-3.5 h-3.5 rounded-full ${isGreen ? 'bg-green-500 shadow-[0_0_15px_#22c55e]' : 'bg-green-950/20'}`} />
      <div className={`w-3.5 h-3.5 rounded-full ${isEmerg ? 'bg-cyan-400 shadow-[0_0_20px_#06b6d4] animate-pulse border border-white/20' : 'bg-cyan-950/10'}`} />
    </div>
  );
}
