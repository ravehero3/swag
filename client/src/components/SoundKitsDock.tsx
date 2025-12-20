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
    <div className="relative w-full flex justify-center py-8">
      <div
        ref={dockRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative flex items-end gap-2 px-3 py-3 rounded-xl bg-gray-900/80 backdrop-blur-lg border border-gray-700/50 overflow-visible"
      >
        {items.map((item, index) => {
          const scale = getScale(index);
          const baseSize = 56;
          const size = baseSize * scale;
          const translateY = -(size - baseSize) / 2;

          return (
            <div
              key={item.id}
              className="dock-icon flex items-end justify-center transition-all duration-200 ease-out"
              onMouseEnter={() => setHoveredIndex(index)}
              style={{
                transform: `translateY(${translateY}px)`,
                width: `${baseSize}px`,
                height: `${baseSize}px`,
              }}
            >
              <button
                onClick={item.onClick}
                className="relative flex items-center justify-center rounded-md bg-black/80 shadow-lg cursor-pointer hover:shadow-2xl transition-shadow overflow-hidden"
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                  border: 'none',
                  padding: 0,
                }}
              >
                <img 
                  src={item.image} 
                  alt={item.name}
                  style={{ 
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }} 
                />
                {hoveredIndex === index && (
                  <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-gray-800/90 text-white text-sm rounded-lg whitespace-nowrap backdrop-blur-sm">
                    {item.name}
                    {!item.isFree && <div className="text-xs text-gray-300">{item.price} CZK</div>}
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
