import React, { useState } from 'react'
import Dashboard from './components/Dashboard'
import AdvancedSimulation from './components/AdvancedSimulation'
import AIVision from './components/AIVision'

function App() {
  const [view, setView] = useState('dashboard')

  return (
    <div className="h-screen w-screen bg-dark-900 text-slate-200 font-sans overflow-hidden flex flex-col">
      {/* Top Navbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-black/50 z-50 flex-shrink-0">
        <h1 className="font-black tracking-widest text-lg bg-gradient-to-r from-neon-blue to-neon-purple text-transparent bg-clip-text">
          Q-TRAFFIC AI CORE
        </h1>
        <div className="flex gap-2">
          <button 
            onClick={() => setView('dashboard')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${view === 'dashboard' ? 'bg-neon-blue text-black' : 'bg-white/5 hover:bg-white/10 text-white'}`}
          >
            Live Dashboard (Backend)
          </button>
          <button 
            onClick={() => setView('advanced-sim')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${view === 'advanced-sim' ? 'bg-neon-purple text-black' : 'bg-white/5 hover:bg-white/10 text-white'}`}
          >
            Standalone Simulator
          </button>
          <button 
            onClick={() => setView('ai-vision')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${view === 'ai-vision' ? 'bg-cyan-500 text-black' : 'bg-white/5 hover:bg-white/10 text-white'}`}
          >
            Real-Time AI Vision
          </button>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        {view === 'dashboard' ? <Dashboard /> : view === 'advanced-sim' ? <AdvancedSimulation /> : <AIVision />}
      </div>
    </div>
  )
}

export default App
