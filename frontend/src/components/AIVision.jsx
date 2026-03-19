import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { uploadImage } from '../api/trafficApi'
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function AIVision() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [activeMode, setActiveMode] = useState('image') // 'image' or 'camera'

  const handleFileChange = (e) => {
    const selected = e.target.files[0]
    if (selected) {
      setFile(selected)
      setPreview(URL.createObjectURL(selected))
      setResult(null)
    }
  }

  const handleSubmit = async () => {
    if (!file) return
    setLoading(true)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const data = await uploadImage(formData)
      setResult(data)
    } catch (err) {
      console.error(err)
      alert("Detection failed. Ensure backend is running with YOLOv8.")
    }
    setLoading(false)
  }

  const handleSampleClick = async (type) => {
    setLoading(true);
    const url = `/demo/traffic_${type}.png`;
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const filename = `traffic_${type}.png`;
      const sampleFile = new File([blob], filename, { type: 'image/png' });
      
      setFile(sampleFile);
      setPreview(url);
      setResult(null);

      // Automatically trigger detection for samples
      const formData = new FormData();
      formData.append('file', sampleFile);
      const data = await uploadImage(formData);
      setResult(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="h-full flex flex-col p-6 lg:p-10 gap-8 bg-dark-950 overflow-y-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-neon-blue to-cyan-400 bg-clip-text text-transparent tracking-tighter uppercase">AI Vision Terminal</h1>
          <p className="text-slate-500 font-mono text-sm mt-1 tracking-widest uppercase italic">Real-time YOLOv8 Object Detection Layer</p>
        </div>
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 flex-shrink-0">
          <button 
            onClick={() => setActiveMode('image')}
            className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${activeMode === 'image' ? 'bg-neon-blue text-black shadow-lg shadow-neon-blue/20' : 'text-slate-400 hover:text-white'}`}
          >
            SNAPSHOT UPLOAD
          </button>
          <button 
            onClick={() => setActiveMode('camera')}
            className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${activeMode === 'camera' ? 'bg-neon-red text-white shadow-lg shadow-neon-red/20' : 'text-slate-400 hover:text-white'}`}
          >
            LIVE AI FEED
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-0">
        
        {/* Left: Input/Preview (7 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="flex-1 bg-black border border-white/10 rounded-[2.5rem] overflow-hidden relative shadow-2xl flex items-center justify-center min-h-[400px]">
            {activeMode === 'image' ? (
              <>
                {result ? (
                  <img src={result.detection.image_base64} className="w-full h-full object-contain" alt="YOLO Result" />
                ) : preview ? (
                  <img src={preview} className="w-full h-full object-contain opacity-50" alt="Preview" />
                ) : (
                  <div className="flex flex-col items-center gap-4 text-slate-600">
                    <div className="text-6xl">📸</div>
                    <div className="text-sm font-mono tracking-widest uppercase">Select Image for Neural Processing</div>
                    <input type="file" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                  </div>
                )}
                {loading && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                        <div className="w-12 h-12 border-4 border-neon-blue border-t-transparent rounded-full animate-spin" />
                        <div className="text-neon-blue font-black text-sm tracking-widest animate-pulse">RUNNING INFERENCE...</div>
                    </div>
                )}
              </>
            ) : (
                <div className="w-full h-full relative">
                    <img src={`${BASE_URL}/camera/stream`} className="w-full h-full object-cover" alt="Live Stream" />
                    <div className="absolute top-6 left-6 flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-red-500/50">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-xs font-black text-red-500 tracking-widest">LIVE YOLO_STREAM_V8</span>
                    </div>
                </div>
            )}
          </div>

          {activeMode === 'image' && (
            <div className="flex flex-col gap-6">
               <div className="flex gap-4">
                  <button onClick={() => { setFile(null); setPreview(null); setResult(null); }} className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold text-slate-400 hover:bg-white/10 italic tracking-widest uppercase">Clear System</button>
                  <button onClick={handleSubmit} disabled={!file || loading} className="flex-[3] py-4 bg-neon-blue text-black font-black rounded-2xl shadow-xl shadow-neon-blue/20 hover:scale-[1.02] transition-transform disabled:opacity-50 tracking-[0.2em] uppercase">Initiate Detection</button>
               </div>

               {/* Quick Demo Snapshots */}
               <div className="flex flex-col gap-2">
                  <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Quick Demo Snapshots</div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { type: 'normal', label: 'Low Volume', emoji: '🚙' },
                      { type: 'heavy', label: 'Congestion', emoji: '🚛' },
                      { type: 'emergency', label: 'Emergency', emoji: '🚑' }
                    ].map(s => (
                      <button key={s.type} onClick={() => handleSampleClick(s.type)} 
                        className="flex items-center justify-center gap-2 p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                        <span className="text-lg">{s.emoji}</span> {s.label}
                      </button>
                    ))}
                  </div>
               </div>
            </div>
          )}
        </div>

        {/* Right: Data/Stats (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Real-time Counter Stats */}
            <div className="bg-dark-900 border border-white/5 rounded-[2rem] p-8 flex flex-col gap-6">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em]">Detection Metadata</h3>
                
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5">
                        <span className="text-xs font-bold text-slate-400">Total Vehicles</span>
                        <span className="text-2xl font-black text-neon-blue">{result ? result.detection.vehicle_count : (activeMode === 'camera' ? 'LIVE' : '0')}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                        {['Car', 'Truck', 'Bike', 'Ambulance'].map(cls => {
                            const count = result?.detection.vehicles.filter(v => v.type.toLowerCase() === cls.toLowerCase()).length || 0;
                            return (
                                <div key={cls} className="p-4 bg-black/40 rounded-2xl border border-white/5">
                                    <div className="text-[10px] text-slate-600 font-bold uppercase mb-1">{cls}s</div>
                                    <div className="text-lg font-black text-slate-200">{result ? count : '--'}</div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className="h-px bg-white/5 my-2" />

                <div>
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Signal Recommendation</h3>
                    <div className="grid grid-cols-3 gap-2">
                        {result ? result.signals.optimized_timings.map(s => (
                            <div key={s.lane} className="flex flex-col items-center gap-1">
                                <div className={`w-8 h-8 rounded-full ${s.signal === 'GREEN' ? 'bg-green-500 shadow-[0_0_15px_#22c55e]' : 'bg-red-500/20'} mb-1`} />
                                <span className="text-[10px] font-bold text-slate-500">L{s.lane}</span>
                                <span className="text-xs font-black text-white">{s.green_time}s</span>
                            </div>
                        )) : (
                            <div className="col-span-3 text-center py-6 text-slate-700 text-xs font-mono italic">Awaiting neural input...</div>
                        )}
                    </div>
                </div>
            </div>

            {/* AI Capability Card */}
            <div className="bg-gradient-to-br from-neon-blue/10 to-transparent border border-neon-blue/20 rounded-[2rem] p-8 flex flex-col gap-4">
                <div className="text-xs font-black text-neon-blue tracking-widest uppercase">Object Detection Model</div>
                <div className="text-2xl font-black text-white leading-tight mt-1">YOLOv8 Nano (Pre-trained)</div>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                    Utilizing state-of-the-art computer vision to identify, track, and categorize urban traffic participants with over 94% accuracy in real-time.
                </p>
                <div className="flex gap-2 flex-wrap mt-2">
                    {['TensorFlow', 'OpenCV', 'PyTorch', 'FastHub'].map(t => (
                        <span key={t} className="px-3 py-1 bg-black/40 border border-white/5 rounded-full text-[9px] font-bold text-slate-500 uppercase">{t}</span>
                    ))}
                </div>
            </div>

        </div>

      </div>
    </div>
  )
}
