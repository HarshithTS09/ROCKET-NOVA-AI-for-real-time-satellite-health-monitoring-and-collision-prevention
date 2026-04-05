import { motion } from 'framer-motion'
import { ArrowRight, Activity } from 'lucide-react'
import UltraRealisticEarth from './UltraRealisticEarth'

function HeroSection({ metrics, satellites = [] }) {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pointer-events-none overflow-hidden pt-10">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-space-blue/10 to-space-black pointer-events-none z-0" />

      {/* 3D Earth - Centered */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
        className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none mix-blend-screen z-0 opacity-80 overflow-hidden"
      >
        <div className="w-[120vw] h-[120vw] sm:w-[100vw] sm:h-[100vw] md:w-[100vh] md:h-[100vh] lg:w-[110vh] lg:h-[110vh] flex items-center justify-center mt-[5vh]">
          <UltraRealisticEarth />
        </div>
      </motion.div>

      {/* Content - Fully Centered over Earth space */}
      <div className="relative z-10 w-full max-w-5xl flex flex-col items-center justify-center text-center px-4 pointer-events-auto mt-[-5vh]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="flex flex-col items-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-cyan/10 border border-accent-cyan/20 mb-6">
            <div className="w-2 h-2 rounded-full bg-accent-cyan animate-pulse" />
            <span className="text-xs font-mono text-accent-cyan uppercase tracking-wider">Mission Control Active</span>
          </div>

          <h1 className="text-6xl md:text-8xl xl:text-9xl font-light leading-[1.1] tracking-tight mb-6">
            <span className="block text-white">ROCKET</span>
            <span className="block bg-gradient-to-r from-accent-cyan via-white to-accent-cyan bg-clip-text text-transparent animate-gradient"
                  style={{ backgroundSize: '200% auto', animation: 'gradient 6s ease infinite' }}
            >NOVA</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-300 font-light max-w-2xl mb-10 leading-relaxed">
            AI-powered satellite constellation management & collision avoidance system
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <motion.a
              href="#dashboard"
              onClick={(e) => {
                e.preventDefault()
                window.dispatchEvent(new CustomEvent('navigate', { detail: 'dashboard' }))
              }}
              className="px-8 py-3 bg-white text-black font-semibold rounded-full flex items-center gap-2 hover:bg-gray-100 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.3)]"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <Activity className="w-4 h-4" />
              View Live Dashboard
            </motion.a>
            <motion.button
              onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'traffic' }))}
              className="px-8 py-3 bg-transparent border border-white/20 text-white rounded-full flex items-center gap-2 hover:bg-white/5 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <ArrowRight className="w-4 h-4" />
              Space Traffic
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Quick stats preview - Bottom Centered */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 1 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 pointer-events-auto"
      >
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8">
          {[
            { label: 'Satellites', value: metrics?.totalSatellites || 47, unit: '' },
            { label: 'Active', value: metrics?.activeSatellites || 34, unit: '' },
            { label: 'System Health', value: metrics?.averageHealth || 97.4, unit: '%' },
            { label: 'Collision Risk', value: '0.24', unit: '%' }
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1 + i * 0.1 }}
              className="glass px-6 py-4 rounded-xl flex flex-col items-center justify-center min-w-[140px] border border-white/5 bg-black/40 backdrop-blur-md"
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                {stat.label === 'Active' && <div className="w-1.5 h-1.5 bg-accent-green rounded-full animate-pulse" />}
                {stat.label === 'System Health' && <div className="w-1.5 h-1.5 bg-accent-cyan rounded-full" />}
                {stat.label === 'Collision Risk' && <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" />}
                <span className="text-[10px] text-gray-400 uppercase tracking-widest">{stat.label}</span>
              </div>
              <p className="text-2xl font-mono font-bold text-white flex items-baseline">
                {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                {stat.unit && <span className="text-sm font-normal text-gray-400 ml-0.5">{stat.unit}</span>}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}

export default HeroSection
