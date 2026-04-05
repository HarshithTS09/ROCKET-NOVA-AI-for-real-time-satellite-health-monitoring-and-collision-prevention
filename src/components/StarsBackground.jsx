import { useMemo } from 'react'
import { motion } from 'framer-motion'

function StarsBackground() {
  const stars = useMemo(() => {
    return Array.from({ length: 150 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 1.5 + 0.5,
      delay: Math.random() * 5,
      duration: Math.random() * 3 + 2,
    }))
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Stars */}
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute rounded-full bg-white/40"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
          }}
          animate={{
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: star.duration,
            delay: star.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Very subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.01] via-transparent to-space-black/80" />

      {/* Grid overlay - very subtle */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.008) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.008) 1px, transparent 1px)
          `,
          backgroundSize: '150px 150px',
        }}
      />

      {/* Add subtle radial gradient from corners */}
      <div className="absolute inset-0 opacity-20"
           style={{
             background: 'radial-gradient(circle at 25% 25%, rgba(0, 85, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(0, 212, 255, 0.1) 0%, transparent 50%)'
           }} />
    </div>
  )
}

export default StarsBackground
