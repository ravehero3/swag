import React, { useState, useRef, useEffect } from 'react';

interface SoundKitDockItem {
  id: number;
  name: string;
  image: string;
  price: number;
  isFree: boolean;
  onClick: () => void;
}

interface SoundKitsDockProps {
  items: SoundKitDockItem[];
}

interface Particle {
  id: number;
  x: number;
  y: number;
  angle: number;
  distance: number;
}

const SoundKitsDock: React.FC<SoundKitsDockProps> = ({ items }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [hasAnimated, setHasAnimated] = useState(false);
  const dockRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          // Create particle explosion
          const newParticles: Particle[] = [];
          for (let i = 0; i < 30; i++) {
            newParticles.push({
              id: i,
              x: 0,
              y: 0,
              angle: (i / 30) * Math.PI * 2,
              distance: 150 + Math.random() * 100,
            });
          }
          setParticles(newParticles);
          
          // Clear particles after 2 seconds
          setTimeout(() => {
            setParticles([]);
          }, 2000);
          
          setHasAnimated(true);
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [hasAnimated]);

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  const getScale = (index: number) => {
    if (hoveredIndex === null) return 1;
    
    const distance = Math.abs(index - hoveredIndex);
    
    if (distance === 0) {
      return 2; // Hovered item: 2x
    } else if (distance === 1) {
      return 1.25; // Adjacent items: 1.25x for smoother transition
    } else {
      return 1; // Other items: 1x
    }
  };

  return (
    <div ref={containerRef} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '64px', paddingTop: '0px', background: 'transparent', overflow: 'visible', position: 'relative' }}>
      <style>{`
        @keyframes particleExplode {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(var(--tx), var(--ty)) scale(0);
            opacity: 0;
          }
        }
        .particle {
          animation: particleExplode 2s ease-out forwards;
          pointer-events: none;
        }
      `}</style>
      
      {/* Particles */}
      {particles.map((particle) => {
        const endX = Math.cos(particle.angle) * particle.distance;
        const endY = Math.sin(particle.angle) * particle.distance;
        return (
          <div
            key={particle.id}
            className="particle"
            style={{
              position: 'absolute',
              left: '50%',
              top: '200px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#fff',
              transform: 'translate(-50%, -50%)',
              '--tx': `${endX}px`,
              '--ty': `${endY}px`,
            } as any}
          />
        );
      })}

      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', overflowX: 'visible', overflowY: 'visible', padding: '20px 0', marginTop: '200px' }}>
        <div
          ref={dockRef}
          onMouseLeave={handleMouseLeave}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px',
            height: '64px',
            borderRadius: '12px',
            backgroundColor: 'rgba(31, 41, 55, 0.8)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(107, 114, 128, 0.5)',
            overflow: 'visible',
            position: 'relative',
            minWidth: 'fit-content',
          }}
        >
          {items.map((item, index) => {
            const scale = getScale(index);
            const baseSize = 56;
            const size = baseSize * scale;
            const translateY = -(size - baseSize) / 2;

            return (
              <div
                key={item.id}
                className="dock-icon"
                onMouseEnter={() => setHoveredIndex(index)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: `${size}px`,
                  height: `${size}px`,
                  transform: `translateY(${translateY}px)`,
                  transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), height 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), z-index 0.1s',
                  flexShrink: 0,
                  willChange: 'transform, width, height, z-index',
                  zIndex: hoveredIndex === index ? 9999 : 1,
                  pointerEvents: 'auto',
                }}
              >
                <button
                  onClick={item.onClick}
                  style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    border: 'none',
                    padding: 0,
                    borderRadius: '8px',
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    transition: 'box-shadow 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), height 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    willChange: 'width, height, box-shadow',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.8)';
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.5)';
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(0, 0, 0, 0.4)';
                  }}
                >
                  <img 
                    src={item.image} 
                    alt={item.name}
                    style={{ 
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      display: 'block',
                      padding: '4px',
                    }} 
                  />
                  {hoveredIndex === index && (
                    <div style={{
                      position: 'absolute',
                      top: '-48px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      padding: '6px 12px',
                      backgroundColor: 'rgba(31, 41, 55, 0.9)',
                      color: 'white',
                      fontSize: '14px',
                      borderRadius: '8px',
                      whiteSpace: 'nowrap',
                      backdropFilter: 'blur(10px)',
                      pointerEvents: 'none',
                      zIndex: 100,
                    }}>
                      {item.name}
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mirrored Reflection */}
      <div style={{ 
        width: '100%', 
        display: 'flex', 
        justifyContent: 'center', 
        overflowX: 'auto', 
        overflowY: 'visible',
        opacity: 0.3,
        pointerEvents: 'none',
        maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1), rgba(0,0,0,0))',
        WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1), rgba(0,0,0,0))',
      }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px',
            height: '64px',
            borderRadius: '12px',
            backgroundColor: 'rgba(31, 41, 55, 0.8)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(107, 114, 128, 0.5)',
            overflow: 'visible',
            position: 'relative',
            minWidth: 'fit-content',
            transform: 'scaleY(-1)',
          }}
        >
          {items.map((item, index) => {
            const scale = getScale(index);
            const baseSize = 56;
            const size = baseSize * scale;
            const translateY = -(size - baseSize) / 2;

            return (
              <div
                key={`mirror-${item.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: `${size}px`,
                  height: `${size}px`,
                  transform: `translateY(${translateY}px)`,
                  transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), height 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    borderRadius: '8px',
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <img 
                    src={item.image} 
                    alt=""
                    style={{ 
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      display: 'block',
                      padding: '4px',
                    }} 
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SoundKitsDock;
