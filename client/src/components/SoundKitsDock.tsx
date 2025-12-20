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
  const [mouseX, setMouseX] = useState<number | null>(null);
  const dockRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dockRef.current) {
      const rect = dockRef.current.getBoundingClientRect();
      setMouseX(e.clientX - rect.left);
    }
  };

  const handleMouseLeave = () => {
    setMouseX(null);
    setHoveredIndex(null);
  };

  const getScale = (index: number) => {
    if (mouseX === null) return 1;
    
    const dockRect = dockRef.current?.getBoundingClientRect();
    if (!dockRect || !dockRef.current) return 1;

    const iconElements = dockRef.current.querySelectorAll('.dock-icon');
    if (!iconElements[index]) return 1;

    const iconRect = iconElements[index].getBoundingClientRect();
    const iconCenter = iconRect.left + iconRect.width / 2 - dockRect.left;
    const distance = Math.abs(mouseX - iconCenter);
    
    const maxDistance = 150;
    const maxScale = 2.5;
    const minScale = 1;
    
    if (distance > maxDistance) return minScale;
    
    const scale = maxScale - ((maxScale - minScale) * (distance / maxDistance));
    return scale;
  };

  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', paddingBottom: '64px', paddingTop: '32px', background: 'transparent', overflowX: 'auto' }}>
      <div
        ref={dockRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '8px',
          padding: '12px',
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
                alignItems: 'flex-end',
                justifyContent: 'center',
                width: `${baseSize}px`,
                height: `${baseSize}px`,
                transform: `translateY(${translateY}px)`,
                transition: 'transform 0.2s ease-out',
                flexShrink: 0,
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
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  transition: 'box-shadow 0.2s ease-out',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.8)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.5)';
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
  );
};

export default SoundKitsDock;
