'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronsRight, Check } from 'lucide-react';

interface SwipeSliderProps {
  label: string;
  onSuccess: () => void;
  disabled?: boolean;
  color?: 'emerald' | 'amber' | 'blue' | 'purple';
}

export function SwipeSlider({
  label,
  onSuccess,
  disabled = false,
  color = 'blue',
}: SwipeSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);

  const colorStyles = {
    blue: {
      trackBg: 'bg-blue-900/30 dark:bg-blue-950/60 border-blue-500/40',
      handleBg: 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/30',
      fillBg: 'bg-blue-500/20',
      textColor: 'text-blue-300',
    },
    emerald: {
      trackBg: 'bg-emerald-900/30 dark:bg-emerald-950/60 border-emerald-500/40',
      handleBg: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/30',
      fillBg: 'bg-emerald-500/20',
      textColor: 'text-emerald-300',
    },
    amber: {
      trackBg: 'bg-amber-900/30 dark:bg-amber-950/60 border-amber-500/40',
      handleBg: 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-500/30',
      fillBg: 'bg-amber-500/20',
      textColor: 'text-amber-300',
    },
    purple: {
      trackBg: 'bg-purple-900/30 dark:bg-purple-950/60 border-purple-500/40',
      handleBg: 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-500/30',
      fillBg: 'bg-purple-500/20',
      textColor: 'text-purple-300',
    },
  }[color];

  const handleDragStart = (clientX: number) => {
    if (disabled || isCompleted) return;
    setIsDragging(true);
    startXRef.current = clientX;
  };

  const handleDragMove = useCallback((clientX: number) => {
    if (!isDragging || !trackRef.current || isCompleted) return;
    const trackWidth = trackRef.current.clientWidth;
    const handleWidth = 52;
    const maxDrag = trackWidth - handleWidth;

    const delta = clientX - startXRef.current;
    const newPos = Math.max(0, Math.min(delta, maxDrag));
    setSliderPosition(newPos);

    if (newPos >= maxDrag * 0.88) {
      setIsCompleted(true);
      setIsDragging(false);
      setSliderPosition(maxDrag);
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try { navigator.vibrate?.(50); } catch {}
      }
      onSuccess();
    }
  }, [isDragging, isCompleted, onSuccess]);

  const handleDragEnd = useCallback(() => {
    if (!isDragging || isCompleted) return;
    setIsDragging(false);
    // Snap back
    setSliderPosition(0);
  }, [isDragging, isCompleted]);

  useEffect(() => {
    const onTouchMove = (e: TouchEvent) => {
      if (isDragging) {
        handleDragMove(e.touches[0].clientX);
      }
    };
    const onTouchEnd = () => {
      if (isDragging) {
        handleDragEnd();
      }
    };
    const onMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleDragMove(e.clientX);
      }
    };
    const onMouseUp = () => {
      if (isDragging) {
        handleDragEnd();
      }
    };

    if (isDragging) {
      window.addEventListener('touchmove', onTouchMove, { passive: true });
      window.addEventListener('touchend', onTouchEnd);
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }

    return () => {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  return (
    <div
      ref={trackRef}
      className={`relative w-full h-14 rounded-2xl select-none overflow-hidden border backdrop-blur-xs flex items-center shadow-inner transition-colors ${
        colorStyles.trackBg
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}`}
    >
      {/* Progress fill */}
      <div
        className={`absolute left-0 top-0 bottom-0 ${colorStyles.fillBg} transition-all duration-75`}
        style={{ width: `${sliderPosition + 52}px` }}
      />

      {/* Label */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-12">
        <span className={`text-xs sm:text-sm font-bold tracking-wide flex items-center gap-1.5 ${colorStyles.textColor}`}>
          {isCompleted ? 'Đã xác nhận!' : label}
          {!isCompleted && (
            <span className="inline-flex animate-pulse">
              <ChevronsRight className="w-4 h-4 opacity-70" />
            </span>
          )}
        </span>
      </div>

      {/* Draggable Handle */}
      <div
        className={`absolute left-1 top-1 bottom-1 w-12 rounded-xl flex items-center justify-center shadow-lg transition-transform duration-75 ${
          colorStyles.handleBg
        }`}
        style={{
          transform: `translateX(${sliderPosition}px)`,
          transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
        onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
        onMouseDown={(e) => handleDragStart(e.clientX)}
      >
        {isCompleted ? (
          <Check className="w-6 h-6 animate-scale-in" />
        ) : (
          <ChevronsRight className="w-6 h-6" />
        )}
      </div>
    </div>
  );
}
