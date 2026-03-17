/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect } from 'react';
import { AppProvider, useAppContext } from './context';
import { Screen1 } from './components/Screen1';
import { Screen2 } from './components/Screen2';
import { Screen3 } from './components/Screen3';
import { Screen4 } from './components/Screen4';
import { Screen5 } from './components/Screen5';
import { Screen6 } from './components/Screen6';
import { ColorPicker } from './components/ColorPicker';
import { motion, AnimatePresence } from 'motion/react';
import { useLocalStorage } from './hooks/useLocalStorage';

const MainContent = () => {
  const { isSwipingDisabled } = useAppContext();
  const [isUnlocked, setIsUnlocked] = useLocalStorage('rp_app_isUnlocked', false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedScroll = localStorage.getItem('rp_app_scrollPosition');
    if (savedScroll && scrollContainerRef.current) {
      // Use a small timeout to ensure layout is complete before scrolling
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollLeft = parseInt(savedScroll, 10);
        }
      }, 100);
    }
  }, [isUnlocked]);

  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleScroll = () => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      if (scrollContainerRef.current) {
        localStorage.setItem('rp_app_scrollPosition', scrollContainerRef.current.scrollLeft.toString());
      }
    }, 150);
  };

  return (
    <div className="relative w-full h-[100dvh] bg-white overflow-hidden flex flex-col shadow-2xl origin-center">
      <AnimatePresence>
        {!isUnlocked && (
          <motion.div 
            key="lockscreen"
            className="absolute inset-0 z-50 bg-white"
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.8, bottom: 0 }}
            onDragEnd={(e, info) => {
              // Swipe up to unlock
              if (info.offset.y < -150 || info.velocity.y < -500) {
                setIsUnlocked(true);
              }
            }}
            exit={{ y: '-100%', opacity: 0, transition: { duration: 0.5, ease: [0.32, 0.72, 0, 1] } }}
          >
            <Screen1 />
            {/* Swipe up hint */}
            <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center justify-center text-white/80 animate-bounce pointer-events-none">
              <div className="w-12 h-1 bg-white/50 rounded-full mb-3"></div>
              <span className="text-sm font-medium tracking-wider drop-shadow-md">Vuốt lên để mở khóa</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Swipeable Screens Container (Main App) */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className={`flex w-full h-full overflow-x-auto snap-x snap-mandatory scrollbar-hide scroll-smooth ${isSwipingDisabled ? 'overflow-x-hidden touch-pan-y' : ''}`}
      >
        <Screen2 />
        <Screen3 />
        <Screen6 />
        <Screen5 />
        <Screen4 />
      </div>

      {/* Home Indicator (iOS style) */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1/3 h-1 bg-black/20 rounded-full pointer-events-none z-30"></div>
      
      {/* Color Picker Tool */}
      <ColorPicker />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <div className="flex items-center justify-center min-h-screen bg-gray-900 overflow-hidden font-sans selection:bg-pink-200">
        {/* Phone Container - Full screen viewport */}
        <MainContent />
      </div>
    </AppProvider>
  );
}

