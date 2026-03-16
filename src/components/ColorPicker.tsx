import React, { useState } from 'react';
import { Palette, X } from 'lucide-react';
import { useAppContext } from '../context';

const COLORS = [
  '#F9C6D4', '#FAF9F6', '#FFFFFF', '#F3B4C2',
  '#E6DDD8', '#D9CFC9', '#E0D1C8', '#E3DBD7', '#D8C9C6', '#E6CFD2', '#ECE8E6', '#D7CED4', '#E2CBD2',
  '#E9E3E1', '#E4DFDB', '#D9C2C2', '#EFE7E6', '#E7D9DB', '#EACFD5', '#F1ECEA', '#E6DDDC', '#DED5D2'
];

export const ColorPicker: React.FC = () => {
  const { themeColor, setThemeColor } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/80 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center text-pink-500 hover:scale-110 transition-transform z-40"
      >
        <Palette size={24} />
      </button>

      {isOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-start p-4 bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-xs relative animate-in slide-in-from-left-8">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
            
            <h3 className="text-xl font-bold mb-4 text-gray-800">Theme Color</h3>
            
            <div className="grid grid-cols-4 gap-3">
              {COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => {
                    setThemeColor(color);
                    setIsOpen(false);
                  }}
                  className={`w-12 h-12 rounded-full border-2 transition-transform hover:scale-110 ${
                    themeColor === color ? 'border-gray-800 scale-110 shadow-md' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
