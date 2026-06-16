import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const [engineStarted, setEngineStarted] = useState(false);
  const [activeLights, setActiveLights] = useState(0);
  const [showSplash, setShowSplash] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);

  // RPM Gauge Generator function (Pura wahi copy paste karein jo pehle tha)
  const generateRPMGauge = () => {
    const marks = [];
    const cx = 150, cy = 150, r = 120;
    
    for (let val = 0; val <= 8; val++) {
      const angle = -120 + (val * 30);
      const rad = (angle * Math.PI) / 180;
      const x1 = cx + r * Math.cos(rad);
      const y1 = cy + r * Math.sin(rad);
      const x2 = cx + (r - 15) * Math.cos(rad);
      const y2 = cy + (r - 15) * Math.sin(rad);
      marks.push(<line key={`l${val}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#333" strokeWidth="3" strokeLinecap="round" />);
    }

    for (let i = 1; i <= 8; i++) {
      const angle = -120 + (i * 30);
      const rad = (angle * Math.PI) / 180;
      const lightR = 108;
      const lx = cx + lightR * Math.cos(rad);
      const ly = cy + lightR * Math.sin(rad);
      const isRed = i >= 6;
      const isActive = i <= activeLights;

      marks.push(
        <rect 
          key={`led${i}`}
          x="-7" y="-7" width="14" height="14" rx="2"
          transform={`translate(${lx}, ${ly}) rotate(${angle + 90})`}
          fill={isActive ? (isRed ? "#FF3300" : "#00AAFF") : "#1a1a1a"} 
          style={{ filter: isActive ? `drop-shadow(0 0 8px ${isRed ? '#FF3300' : '#00AAFF'})` : 'none', transition: 'all 0.1s ease-out' }}
        />
      );
    }
    return marks;
  }

  const handleEngineStart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.log("Audio blocked:", e));
    }
    setEngineStarted(true);
    
    let step = 1;
    const revUp = setInterval(() => {
      setActiveLights(step);
      step++;
      if (step > 8) {
        clearInterval(revUp);
        setTimeout(() => {
          let downStep = 8;
          const revDown = setInterval(() => {
            downStep--;
            setActiveLights(downStep);
            if (downStep <= 1) {
              clearInterval(revDown);
              setTimeout(() => {
                setShowSplash(false);
                onFinish(); // Parent ko signal dena
              }, 500);
            }
          }, 100);
        }, 800); 
      }
    }, 150);
  }

  return (
    <AnimatePresence>
      {showSplash && (
        <motion.div 
          key="splash"
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center overflow-hidden"
        >
          <audio ref={audioRef} src="/car-start.mp3" preload="auto" />
          
          <div className="relative z-10 w-72 h-72 md:w-96 md:h-96">
            <svg viewBox="0 0 300 300" className="w-full h-full drop-shadow-2xl">
              <circle cx="150" cy="150" r="145" fill="#080808" stroke="#222" strokeWidth="6" />
              <circle cx="150" cy="150" r="138" fill="#050505" />
              {generateRPMGauge()}
              <text x="150" y="175" textAnchor="middle" fill="#555" fontSize="9" fontWeight="bold" letterSpacing="2">RPM x1000</text>
            </svg>
          </div>

          <div className="text-3xl md:text-5xl font-black text-white relative z-10 mt-6">
            AUTO<span className="text-[#F5A623]">BROTHERS</span>
          </div>

          {!engineStarted ? (
            <motion.button 
              onClick={handleEngineStart}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative z-10 mt-8 w-36 h-36 md:w-44 md:h-44 rounded-full flex items-center justify-center cursor-pointer"
              style={{ background: "conic-gradient(from 0deg, #555, #222, #888, #333, #666, #111, #777, #222, #555)", padding: '8px' }}
            >
              <div className="w-full h-full rounded-full bg-[#111] flex flex-col items-center justify-center border-2 border-gray-800 shadow-inner">
                <div className="absolute w-20 h-20 bg-red-600 rounded-full blur-2xl opacity-30 hover:opacity-70 transition-opacity"></div>
                <span className="relative text-[10px] md:text-xs font-extrabold tracking-[0.3em] text-red-500" style={{ textShadow: '0 0 8px rgba(239, 68, 68, 0.8)' }}>ENGINE</span>
                <span className="relative text-[10px] md:text-xs font-extrabold tracking-[0.3em] text-red-500 mt-1" style={{ textShadow: '0 0 8px rgba(239, 68, 68, 0.8)' }}>START</span>
              </div>
            </motion.button>
          ) : (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-gray-400 mt-6 relative z-10 tracking-widest uppercase">
              Pakistan's Trusted Auto Parts
            </motion.p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}