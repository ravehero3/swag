'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getCzechColorPlural } from '@/lib/czech-pluralization';

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
  sizes?: Record<string, number>;
  colorCount?: number;
  isSaved?: boolean;
  onToggleSave?: (id: string) => void;
}

export default function ProductCard({
  id,
  name,
  slug,
  price,
  images,
  sizes = {},
  colorCount = 1,
  isSaved = false,
  onToggleSave,
}: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [hoveredSize, setHoveredSize] = useState<string | null>(null);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const router = useRouter();

  const availableSizes = Object.entries(sizes)
    .filter(([_, stock]) => stock > 0)
    .map(([size, _]) => size);
  
  const allSizes = Object.entries(sizes).map(([size, stock]) => ({ size, stock }));

  const handleSizeClick = (e: React.MouseEvent, size: string) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/produkty/${slug}?size=${size}`);
  };

  const handleHeartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleSave) {
      setShowHeartAnimation(true);
      onToggleSave(id);
      setTimeout(() => setShowHeartAnimation(false), 600);
    }
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? Math.min(images.length - 1, 2) : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev >= Math.min(images.length - 1, 2) ? 0 : prev + 1));
  };

  const displayImage = images[currentImageIndex] || images[0];
  const maxImages = Math.min(images.length, 3);

  return (
    <>
    <Link
      href={`/produkty/${slug}`}
      className="block bg-white border border-black relative"
      style={{ marginRight: '-1px', marginBottom: '-1px', marginTop: '-1px' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setCurrentImageIndex(0);
      }}
    >
      <div className="relative overflow-hidden aspect-product flex items-center justify-center bg-white" style={{ padding: '0 40px' }}>
        <img
          src={displayImage}
          alt={name}
          className="object-contain w-full h-full"
          style={{ transform: 'scale(1.1)' }}
        />
        
        {onToggleSave && (
          <button
            onClick={handleHeartClick}
            className={`absolute z-10 heart-icon ${showHeartAnimation ? 'liked' : ''}`}
            style={{ top: '4px', right: '4px', opacity: 1, width: '22px', height: '22px' }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill={isSaved ? 'black' : 'white'}
              stroke="black"
              strokeWidth="1.75"
            >
              <path 
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>
        )}

        {/* Navigation Arrows - Show on hover if multiple images */}
        {isHovered && maxImages > 1 && (
          <>
            <button
              onClick={handlePrevImage}
              className="absolute z-10 hover:opacity-70 transition-opacity"
              style={{ 
                left: '8px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                padding: '4px',
                cursor: 'pointer'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="black" strokeWidth="1">
                <path d="M10 12L6 8L10 4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            
            <button
              onClick={handleNextImage}
              className="absolute z-10 hover:opacity-70 transition-opacity"
              style={{ 
                right: '8px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                padding: '4px',
                cursor: 'pointer'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="black" strokeWidth="1">
                <path d="M6 4L10 8L6 12" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </>
        )}
      </div>
      
      <div className="product-info-container text-center relative md:absolute md:bottom-16 md:left-0 md:right-0 pt-1 md:pt-0 md:py-0">
        {/* Title or Dot Indicators */}
        {isHovered && maxImages > 1 ? (
          <div 
            className="flex justify-center gap-1"
            style={{ marginBottom: '4px', height: '18px', alignItems: 'center' }}
          >
            {Array.from({ length: maxImages }).map((_, index) => (
              <div
                key={index}
                style={{
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  backgroundColor: index === currentImageIndex ? '#000000' : '#999999',
                  border: 'none',
                  padding: 0,
                  transition: 'background-color 0.2s'
                }}
              />
            ))}
          </div>
        ) : (
          <h3 
            className="uppercase"
            style={{
              fontFamily: '"Helvetica Neue Condensed Bold", "Helvetica Neue", Helvetica, Arial, sans-serif',
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '0.03em',
              fontStretch: 'condensed',
              lineHeight: '1.4',
              marginBottom: '2px',
              textShadow: '-1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white'
            }}
          >
            {name}
          </h3>
        )}
        
        {isHovered && allSizes.length > 0 ? (
          <div 
            className="flex justify-center gap-1 flex-wrap px-2"
            style={{ marginBottom: '2px' }}
          >
            {allSizes.map(({ size, stock }) => {
              const isAvailable = stock > 0;
              const isHoveredSize = hoveredSize === size;
              return (
                <button
                  key={size}
                  onClick={(e) => isAvailable && handleSizeClick(e, size)}
                  onMouseEnter={() => isAvailable && setHoveredSize(size)}
                  onMouseLeave={() => setHoveredSize(null)}
                  className="transition-colors"
                  style={{
                    fontFamily: 'BB-Regular, "Helvetica Neue", Helvetica, Arial, sans-serif',
                    fontSize: '11px',
                    fontWeight: 400,
                    padding: '2px 6px',
                    minWidth: '28px',
                    color: isAvailable ? '#000' : '#999999',
                    textDecoration: isAvailable ? 'none' : 'line-through',
                    textDecorationColor: isAvailable ? 'transparent' : '#999999',
                    textDecorationThickness: '1px',
                    textUnderlineOffset: '2px',
                    position: 'relative',
                    background: isAvailable && isHoveredSize ? 'white' : 'transparent',
                    border: isAvailable && isHoveredSize ? '1px solid black' : '1px solid transparent',
                    cursor: isAvailable ? 'pointer' : 'default'
                  }}
                >
                  {size}
                </button>
              );
            })}
          </div>
        ) : !isHovered ? (
          <p 
            className="text-small"
            style={{ marginBottom: '2px', textShadow: '-1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white' }}
          >
            {colorCount} {getCzechColorPlural(colorCount)}
          </p>
        ) : null}
        
        {/* Price or Color Squares */}
        {isHovered && colorCount > 0 ? (
          <div className="flex justify-center gap-1">
            {[...Array(Math.min(colorCount, 5))].map((_, i) => (
              <div
                key={i}
                style={{
                  width: '16px',
                  height: '16px',
                  border: '1px solid #000000',
                  backgroundColor: '#ffffff',
                  borderRadius: '2px',
                }}
              />
            ))}
          </div>
        ) : (
          <p className="text-small" style={{ textShadow: '-1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white' }}>{price} Kč</p>
        )}
      </div>
    </Link>
    <style jsx>{`
      .heart-icon {
        transition: transform 0.1s ease;
        cursor: pointer;
      }

      .heart-icon.liked {
        animation: scalePop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }

      @keyframes scalePop {
        0% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.3);
        }
        100% {
          transform: scale(1);
        }
      }

      .heart-icon path {
        transition: fill 0.2s ease;
      }

      .product-info-container {
        margin-top: -32px;
      }

      @media (min-width: 768px) {
        .product-info-container {
          margin-top: 0;
        }
      }
    `}</style>
    </>
  );
}
