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

const SoundKitsDock: React.FC<SoundKitsDockProps> = ({ items }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const dockRef = useRef<HTMLDivElement>(null);

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
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '64px', paddingTop: '1000px', background: 'transparent', overflow: 'visible' }}>
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
