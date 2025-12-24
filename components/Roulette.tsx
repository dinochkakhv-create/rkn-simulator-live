
import React, { useState, useEffect, useRef } from 'react';
import { SERVICES } from '../constants.tsx';
import { Service } from '../types';

interface RouletteProps {
  onSpinEnd: (service: Service) => void;
  isSpinning: boolean;
}

const Roulette: React.FC<RouletteProps> = ({ onSpinEnd, isSpinning }) => {
  const [rotation, setRotation] = useState(0);
  const wheelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isSpinning) {
      const extraDegrees = 3600 + Math.floor(Math.random() * 360); // 10 rotations + random
      const newRotation = rotation + extraDegrees;
      setRotation(newRotation);

      const timeout = setTimeout(() => {
        const actualDeg = newRotation % 360;
        const sectionDeg = 360 / SERVICES.length;
        const itemIndex = Math.floor(((360 - (actualDeg % 360)) % 360) / sectionDeg);
        onSpinEnd(SERVICES[itemIndex]);
      }, 4000);

      return () => clearTimeout(timeout);
    }
  }, [isSpinning]);

  const getLogoUrl = (slug: string, color: string) => {
    // If it's a generic icon like 'lock', we might want a different source or fallback
    // But Simple Icons has most. For others, we use white logos on the colored bg.
    const cleanColor = color.replace('#', '');
    return `https://cdn.simpleicons.org/${slug}/white`;
  };

  return (
    <div className="relative w-80 h-80 md:w-[480px] md:h-[480px] mx-auto">
      {/* Pointer with enhanced glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-8 z-30">
        <div className="w-0 h-0 border-l-[24px] border-l-transparent border-r-[24px] border-r-transparent border-t-[48px] border-t-red-600 drop-shadow-[0_0_15px_rgba(220,38,38,1)]" />
      </div>

      {/* Decorative Outer Shell */}
      <div className="absolute inset-[-20px] rounded-full border-[16px] border-gray-900 shadow-[0_0_80px_rgba(255,0,0,0.15)] pointer-events-none z-10" />
      <div className="absolute inset-[-8px] rounded-full border-2 border-red-600/20 pointer-events-none z-10" />

      {/* The Wheel Container */}
      <div
        ref={wheelRef}
        className="w-full h-full rounded-full overflow-hidden relative border-8 border-gray-800 bg-gray-950 transition-transform duration-[4000ms] cubic-bezier(0.1, 0, 0.1, 1)"
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        {SERVICES.map((service, index) => {
          const angle = 360 / SERVICES.length;
          const rotate = angle * index;
          const skew = 90 - angle;

          return (
            <div
              key={service.id}
              className="absolute top-0 right-0 w-1/2 h-1/2 origin-bottom-left"
              style={{
                transform: `rotate(${rotate}deg) skewY(-${skew}deg)`,
                backgroundColor: index % 2 === 0 ? '#0a0a0a' : '#141414',
                border: '1px solid #1a1a1a'
              }}
            >
              <div
                className="absolute flex flex-col items-center justify-center"
                style={{
                  transform: `skewY(${skew}deg) rotate(${angle / 2}deg) translate(50px, 50px)`,
                  width: '160px',
                  height: '110px'
                }}
              >
                {/* Brand Logo Icon Container */}
                <div 
                  className="w-14 h-14 md:w-20 md:h-20 rounded-2xl flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.5)] mb-3 border border-white/5 overflow-hidden group"
                  style={{ backgroundColor: service.color }}
                >
                  <img 
                    src={getLogoUrl(service.icon, service.color)} 
                    alt={service.name}
                    className="w-8 h-8 md:w-12 md:h-12 object-contain"
                    onError={(e) => {
                      // Fallback if logo not found
                      (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${service.name}&backgroundColor=${service.color.replace('#', '')}`;
                    }}
                  />
                </div>
                
                <span className="text-[10px] md:text-xs font-black text-white/70 uppercase tracking-tighter text-center w-full px-2 truncate drop-shadow-md">
                  {service.name}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Center Unit */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-gray-900 rounded-full border-4 border-gray-700 shadow-[0_0_40px_rgba(0,0,0,1)] flex items-center justify-center z-20">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-800 to-black flex items-center justify-center border border-gray-600 shadow-inner">
           <div className="w-4 h-4 bg-red-600 rounded-full animate-ping opacity-50" />
           <div className="absolute w-4 h-4 bg-red-600 rounded-full shadow-[0_0_20px_rgba(220,38,38,1)]" />
        </div>
      </div>
    </div>
  );
};

export default Roulette;
