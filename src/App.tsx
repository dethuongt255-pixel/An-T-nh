/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider } from './context';
import { Screen1 } from './components/Screen1';
import { Screen2 } from './components/Screen2';
import { Screen3 } from './components/Screen3';
import { Screen4 } from './components/Screen4';
import { ColorPicker } from './components/ColorPicker';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [isUnlocked, setIsUnlocked] = useState(false);

  return (
    <AppProvider>
      <div className="flex items-center justify-center min-h-screen bg-gray-900 overflow-hidden font-sans selection:bg-pink-200">
        {/* Phone Container - Full screen viewport */}
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
          <div className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scrollbar-hide scroll-smooth">
            <Screen2 />
            <Screen3 />
            <Screen4 />
          </div>

          {/* Home Indicator (iOS style) */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1/3 h-1 bg-black/20 rounded-full pointer-events-none z-30"></div>
          
          {/* Color Picker Tool */}
          <ColorPicker />
          
        </div>
      </div>
    </AppProvider>
  );
}

