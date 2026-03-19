import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useTrafficStore from '../store/trafficStore'
import axios from 'axios'
import { switchScenario } from '../api/trafficApi'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function MediaUploadPanel() {
  const [activeTab, setActiveTab] = useState('simulation') // 'simulation', 'image', 'videos', 'camera'
  
  // Image State
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [imageLoading, setImageLoading] = useState(false)
  
  // Videos State
  const [videoFiles, setVideoFiles] = useState([null, null, null, null]) // North, South, East, West
  const [videosLoading, setVideosLoading] = useState(false)
  
  // Camera State
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraLoading, setCameraLoading] = useState(false)
  
  const { setScenario, updateFromCombined } = useTrafficStore()
  
  // Camera Polling Loop
  useEffect(() => {
    let timeoutId;
    if (cameraActive) {
      const pollCamera = async () => {
        try {
          const res = await axios.get(`${BASE_URL}/camera/stats`)
          // Update store directly or format it to match /combined
          // We need slightly different mapping for /camera/stats vs /combined
          // For simplicity, we just inject the camera stats into the store
          useTrafficStore.setState((state) => ({
            vehicleCount: res.data.traffic.vehicle_count,
            laneCounts: res.data.traffic.lane_counts,
            density: res.data.traffic.density,
            emergencyDetected: res.data.traffic.emergency_detected,
            signals: res.data.signals.optimized_timings || [],
            stats: res.data.stats || {},
            // pause updating route/emergency panel specifically, just stick to basic
          }))
        } catch(e) { console.error(e) }
        timeoutId = setTimeout(pollCamera, 1500)
      }
      pollCamera()
    }
    return () => clearTimeout(timeoutId)
  }, [cameraActive])


  // --- Submit Handlers ---

  const handleImageSubmit = async () => {
    if (!imageFile) return
    setImageLoading(true)
    const formData = new FormData()
    formData.append('file', imageFile)
    try {
      const res = await axios.post(`${BASE_URL}/upload/image`, formData)
      setImagePreview(res.data.detection.image_base64)
      
      // Update global store
      useTrafficStore.setState({
        vehicleCount: res.data.detection.vehicle_count,
        laneCounts: res.data.detection.lane_counts,
        density: res.data.detection.density,
        emergencyDetected: res.data.detection.emergency_detected,
        signals: res.data.signals.optimized_timings || [],
      })
    } catch(e) { console.error(e) }
    setImageLoading(false)
  }

  const handleVideosSubmit = async () => {
    const validFiles = videoFiles.filter(Boolean)
    if (validFiles.length === 0) return
    
    setVideosLoading(true)
    const formData = new FormData()
    validFiles.forEach(f => formData.append('files', f))
    
    try {
      const res = await axios.post(`${BASE_URL}/upload/videos`, formData)
      useTrafficStore.setState({
        laneCounts: res.data.lane_counts,
        signals: res.data.signals.optimized_timings || [],
        emergencyDetected: res.data.emergency_detected,
      })
    } catch(e) { console.error(e) }
    setVideosLoading(false)
  }

  const toggleCamera = () => {
    setCameraActive(!cameraActive)
  }

  // --- UI Render ---

  return (
    <div className="glass rounded-2xl h-full flex flex-col overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-white/10 text-xs font-bold uppercase tracking-wide">
        <button onClick={() => setActiveTab('simulation')} 
          className={`flex-1 py-3 transition-colors ${activeTab === 'simulation' ? 'bg-neon-blue/20 text-neon-blue border-b-2 border-neon-blue' : 'text-slate-400 hover:text-white'}`}>
          Simulate
        </button>
        <button onClick={() => setActiveTab('image')} 
          className={`flex-1 py-3 transition-colors ${activeTab === 'image' ? 'bg-neon-purple/20 text-neon-purple border-b-2 border-neon-purple' : 'text-slate-400 hover:text-white'}`}>
          Image
        </button>
        <button onClick={() => setActiveTab('videos')} 
          className={`flex-1 py-3 transition-colors ${activeTab === 'videos' ? 'bg-neon-amber/20 text-neon-amber border-b-2 border-neon-amber' : 'text-slate-400 hover:text-white'}`}>
          4-Way Video
        </button>
        <button onClick={() => setActiveTab('camera')} 
          className={`flex-1 py-3 transition-colors ${activeTab === 'camera' ? 'bg-neon-red/20 text-neon-red border-b-2 border-neon-red' : 'text-slate-400 hover:text-white'}`}>
          Live Cam
        </button>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          
          {/* SIMULATION TAB */}
          {activeTab === 'simulation' && (
            <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} className="flex flex-col gap-3">
              <p className="text-xs text-slate-400 mb-2">Automated system testing with simulated data.</p>
              {['normal', 'heavy', 'emergency'].map(type => (
                <button key={type} onClick={() => switchScenario(type).then(() => setScenario(type))}
                  className="p-3 border border-white/10 rounded-xl bg-dark-700 hover:bg-white/5 text-left capitalize font-bold text-sm">
                  {type === 'emergency' ? '🚑 ' : type === 'heavy' ? '🚛 ' : '🚙 '} 
                  {type} Traffic Scenario
                </button>
              ))}
            </motion.div>
          )}

          {/* IMAGE TAB */}
          {activeTab === 'image' && (
            <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} className="flex flex-col gap-4">
              <p className="text-xs text-slate-400">Upload a single 3-lane image for YOLOv8 processing.</p>
              
              <div className="border border-dashed border-white/20 rounded-xl p-6 text-center bg-dark-700/50 hover:bg-white/5 cursor-pointer relative">
                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => {
                    setImageFile(e.target.files[0])
                    setImagePreview(URL.createObjectURL(e.target.files[0]))
                  }} 
                />
                <div className="text-2xl mb-2">📸</div>
                <div className="text-xs font-bold text-slate-300">
                  {imageFile ? imageFile.name : "Click to Upload Image"}
                </div>
              </div>

              {imagePreview && (
                <div className="rounded-xl overflow-hidden border border-white/10 relative">
                  <img src={imagePreview} className="w-full h-auto object-cover" alt="Preview" />
                  {imageLoading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-neon-purple border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              )}

              <button onClick={handleImageSubmit} disabled={!imageFile || imageLoading}
                className="bg-neon-purple text-black font-black py-3 rounded-xl disabled:opacity-50 hover:brightness-110">
                {imageLoading ? "Running YOLOv8..." : "ANALYZE IMAGE"}
              </button>
            </motion.div>
          )}

          {/* VIDEOS TAB */}
          {activeTab === 'videos' && (
            <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} className="flex flex-col gap-4">
              <p className="text-xs text-slate-400">Upload up to 4 videos representing 4 sides of an intersection.</p>
              
              <div className="grid grid-cols-2 gap-3">
                {['North', 'South', 'East', 'West'].map((dir, i) => (
                  <div key={dir} className="border border-white/10 rounded-xl p-4 text-center relative hover:bg-white/5">
                    <input type="file" accept="video/*" className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={e => {
                        const newFiles = [...videoFiles]
                        newFiles[i] = e.target.files[0]
                        setVideoFiles(newFiles)
                      }}
                    />
                    <div className="text-xl mb-1">🎥</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{dir}</div>
                    <div className="text-[10px] text-neon-amber truncate mt-1">
                      {videoFiles[i] ? videoFiles[i].name : "Upload"}
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={handleVideosSubmit} disabled={videoFiles.every(v => v === null) || videosLoading}
                className="bg-neon-amber text-black font-black py-3 rounded-xl disabled:opacity-50 hover:brightness-110 mt-2">
                {videosLoading ? "Extracting & Analyzing..." : "CALCULATE 4-WAY TIMING"}
              </button>
            </motion.div>
          )}

          {/* CAMERA TAB */}
          {activeTab === 'camera' && (
            <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} className="flex flex-col gap-4 h-full">
              <p className="text-xs text-slate-400">Live MJPEG stream with YOLOv8 bounding boxes.</p>
              
              <div className="flex-1 rounded-xl overflow-hidden border border-white/10 bg-black relative flex items-center justify-center min-h-[160px]">
                {cameraActive ? (
                  <img src={`${BASE_URL}/camera/stream`} className="w-full h-full object-cover" alt="Live Camera" />
                ) : (
                  <div className="text-slate-600 text-sm font-mono flex flex-col items-center">
                    <span className="text-4xl mb-2">📹</span>
                    CAMERA OFFLINE
                  </div>
                )}
                
                {/* Recording indicator */}
                {cameraActive && (
                  <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 px-2 py-1 rounded backdrop-blur">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[10px] font-mono font-bold text-red-500">LIVE</span>
                  </div>
                )}
              </div>

              <button onClick={toggleCamera}
                className={`font-black py-3 rounded-xl hover:brightness-110 ${cameraActive ? 'bg-white text-black' : 'bg-neon-red text-white'}`}>
                {cameraActive ? "STOP CAMERA" : "ACTIVATE WEBCAM"}
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
