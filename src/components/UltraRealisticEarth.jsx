import { motion } from 'framer-motion'

function UltraRealisticEarth() {
  return (
    <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
      {/* Deep Space / Stars background */}
      {Array.from({ length: 40 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white transition-opacity"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: Math.random() * 1.5 + 0.5,
            height: Math.random() * 1.5 + 0.5,
            opacity: Math.random() * 0.8 + 0.2,
            animation: `pulse ${Math.random() * 4 + 2}s infinite`
          }}
        />
      ))}

      {/* Outer Atmospheric Glow */}
      <div className="absolute w-[85%] h-[85%] rounded-full bg-cyan-500/10 blur-[40px]" />
      <div className="absolute w-[80%] h-[80%] rounded-full bg-blue-400/15 blur-[15px]" />

      {/* 3D Earth Container */}
      <div className="relative w-[70%] h-[70%] max-w-[600px] max-h-[600px] rounded-full shadow-[0_0_60px_rgba(0,180,255,0.2)] overflow-hidden">
        
        {/* Seamless Panning Night Earth Map */}
        <motion.div
          className="absolute top-0 bottom-0 left-0 flex h-full"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 120, ease: "linear", repeat: Infinity }}
          style={{ width: 'max-content' }}
        >
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/b/ba/The_earth_at_night.jpg" 
            alt="Earth at Night" 
            className="h-full w-auto max-w-none opacity-90 object-cover mix-blend-screen"
          />
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/b/ba/The_earth_at_night.jpg" 
            alt="Earth at Night Seamless" 
            className="h-full w-auto max-w-none opacity-90 object-cover mix-blend-screen"
          />
        </motion.div>

        {/* Volumetric Spherical Overlays */}
        <div 
          className="absolute inset-0 rounded-full"
          style={{
            boxShadow: `
              inset -35px -15px 60px rgba(0,0,0,0.95),
              inset 15px 0px 30px rgba(255, 255, 255, 0.1),
              inset 0px 0px 15px rgba(0, 150, 255, 0.3)
            `,
            background: 'radial-gradient(circle at 25% 30%, rgba(255,255,255,0.1) 0%, transparent 50%)'
          }}
        />

        {/* Orbit Rings */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none opacity-25">
          <ellipse 
            cx="50" cy="50" rx="49" ry="12" 
            fill="none" stroke="rgba(0, 212, 255, 0.5)" strokeWidth="0.2" strokeDasharray="2 3" 
            className="animate-[spin_40s_linear_infinite]" 
          />
          <ellipse 
            cx="50" cy="50" rx="12" ry="49" 
            fill="none" stroke="rgba(0, 212, 255, 0.3)" strokeWidth="0.2" strokeDasharray="1 4" 
            className="animate-[spin_50s_linear_infinite_reverse]" 
          />
          <circle cx="50" cy="50" r="49" fill="none" stroke="rgba(0, 255, 255, 0.15)" strokeWidth="0.4" />
        </svg>

        {/* Orbital Satellite Points */}
        {[0, 60, 120, 180, 240, 300].map((_, i) => (
          <motion.div 
            key={i} 
            className="absolute inset-0 w-full h-full"
            animate={{ rotateZ: 360 }}
            transition={{ duration: 30 + (i * 5), ease: "linear", repeat: Infinity, delay: i * -3 }}
          >
            <div className="absolute top-[10%] left-1/2 w-3 h-3 -translate-x-1/2 -translate-y-1/2">
              <div className="w-1 h-1 bg-accent-cyan rounded-full shadow-[0_0_8px_#00f0ff]" />
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Decorative Outer HUD */}
      <div className="absolute inset-[-3%] rounded-full border-[0.5px] border-cyan-500/15 border-dashed animate-[spin_60s_linear_infinite]" />
    </div>
  )
}

export default UltraRealisticEarth
