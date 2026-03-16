import React, { useState, useEffect } from 'react';
import { Battery, Wifi, Signal } from 'lucide-react';
import { useAppContext } from '../context';

export const Screen1: React.FC = () => {
  const { themeColor } = useAppContext();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const strTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    return strTime;
  };

  const formatDate = (date: Date) => {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const dayName = days[date.getDay()];
    return `${month}-${day} ${dayName}`;
  };

  return (
    <div 
      className="w-full h-full flex flex-col relative overflow-hidden shrink-0 snap-center"
      style={{ backgroundColor: themeColor }}
    >
      {/* Top Widget Area (18%) */}
      <div className="h-[18%] w-full flex flex-col items-center justify-center pt-8 px-6 text-[#8a7b80]">
        <div className="flex justify-between w-full items-center">
          <div className="text-sm font-medium tracking-wider">
            {formatDate(time)}
          </div>
          <div className="flex items-center gap-2">
            <Signal size={16} />
            <Wifi size={16} />
            <Battery size={18} />
          </div>
        </div>
        <div className="w-full mt-2 flex justify-between items-center text-xs">
          <span>good lucky</span>
          <div className="flex gap-2">
            <span className="text-sm">🐱</span>
            <span className="text-sm">✨</span>
          </div>
        </div>
      </div>

      {/* Clock Area (15%) */}
      <div className="h-[15%] w-full flex items-center justify-center">
        <div className="text-7xl sm:text-8xl md:text-9xl leading-none font-bold text-white drop-shadow-md tracking-tighter" style={{ fontFamily: "'Inter', sans-serif" }}>
          {formatTime(time)}
        </div>
      </div>

      {/* Image Area (67%) */}
      <div className="h-[67%] w-full relative">
        <img 
          src="https://i.postimg.cc/76G0KLjK/1f07cbad37b7a9c438facc053ef6271d.jpg" 
          alt="Anime Character" 
          className="w-full h-full object-cover object-top"
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
  );
};
