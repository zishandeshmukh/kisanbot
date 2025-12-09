
import React from 'react';
import { SensorData, SensorHistoryPoint, WeatherData, IrrigationAdvice } from '../types';
import { WeatherWidget } from './WeatherWidget';

interface Props {
  data: SensorData;
  history: SensorHistoryPoint[];
  weather: WeatherData | null;
  irrigation: IrrigationAdvice | null;
  loading: boolean;
  t: any;
}

export const SensorDashboard: React.FC<Props> = ({ data, history, weather, irrigation, loading, t }) => {

  // Robust Circular Progress with correct ViewBox
  const CircleProgress = ({ value, color }: { value: number, color: string }) => {
    const radius = 18;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;
    return (
      <div className="relative w-12 h-12">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 44 44">
          <circle cx="22" cy="22" r={radius} stroke="currentColor" strokeWidth="4" fill="transparent" className="text-gray-200 dark:text-gray-700" />
          <circle cx="22" cy="22" r={radius} stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className={color} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
           <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">{Math.round(value)}%</span>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full space-y-5 pb-6">
      <WeatherWidget weather={weather} irrigation={irrigation} loading={loading} />

      <div className="grid grid-cols-2 gap-4">
          {/* Moisture Card - Redesigned */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
              <div className="flex flex-col h-full justify-between z-10 relative">
                  <div className="flex justify-between items-start">
                       <div className={`p-2.5 rounded-full ${data.soilMoisture < 30 ? 'bg-amber-50 text-amber-500' : 'bg-emerald-50 text-emerald-500'}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
                       </div>
                       <CircleProgress value={data.soilMoisture} color={data.soilMoisture < 30 ? 'text-amber-500' : 'text-emerald-500'} />
                  </div>
                  <div>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.soilMoisture}</span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-2xl font-black text-gray-800 dark:text-gray-100">{Math.round(data.soilMoisture)}%</span>
                        <span className={`text-xs font-bold ${data.soilMoisture < 30 ? 'text-amber-500' : 'text-emerald-500'}`}>
                            {data.soilMoisture < 30 ? t.dry : t.good}
                        </span>
                      </div>
                  </div>
              </div>
          </div>

          {/* Battery Card - Redesigned to be cleaner */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
              <div className="flex flex-col h-full justify-between">
                  <div className="flex justify-between items-start">
                       <div className={`p-2.5 rounded-full ${data.batteryLevel && data.batteryLevel < 20 ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
                       </div>
                       <div className="text-right">
                           <span className={`text-xs font-bold px-2 py-1 rounded-md ${data.batteryLevel && data.batteryLevel < 20 ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                               {data.batteryLevel && data.batteryLevel < 20 ? t.low : t.ok}
                           </span>
                       </div>
                  </div>
                  
                  <div>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.battery}</span>
                      <div className="flex items-center gap-2 mt-1">
                           <span className="text-2xl font-black text-gray-800 dark:text-gray-100">{data.batteryLevel ? data.batteryLevel.toFixed(2) : '0.00'}%</span>
                      </div>
                      {/* CSS Battery Bar */}
                      <div className="mt-2 w-full h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ${data.batteryLevel && data.batteryLevel < 20 ? 'bg-red-500' : 'bg-blue-500'}`} 
                            style={{ width: `${data.batteryLevel || 0}%` }}
                          ></div>
                      </div>
                  </div>
              </div>
          </div>

          {/* Temperature */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center">
                     {/* Sun Icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.699-3.181a1 1 0 111.772.954l-1.339 2.509 1.898 2.53a1 1 0 01-1.6 1.6l-2.53-1.898-2.509 1.339a1 1 0 11-.954-1.772l3.181-1.699L11 3.323V3a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                  </div>
                  <span className="text-xs font-bold text-gray-400 uppercase">{t.temperature}</span>
              </div>
              <span className="text-3xl font-black text-gray-800 dark:text-gray-100">{data.temperature}°C</span>
          </div>

          {/* Humidity */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center">
                     {/* Droplets Icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>
                  </div>
                  <span className="text-xs font-bold text-gray-400 uppercase">{t.humidity}</span>
              </div>
              <span className="text-3xl font-black text-gray-800 dark:text-gray-100">{data.humidity}%</span>
          </div>

      </div>

      {/* Charts */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">{t.chartTitle}</h3>
          <SimpleChart data={history.map(h => h.soilMoisture)} color="#10b981" label={t.soilMoisture} />
          <div className="h-6"></div>
          <SimpleChart data={history.map(h => h.humidity)} color="#3b82f6" label={t.humidity} />
      </div>
    </div>
  );
};

const SimpleChart = ({ data, color, label }: { data: number[], color: string, label: string }) => {
    const displayData = data.length < 2 ? [0, 0] : data;
    const width = 100;
    const height = 25;
    const max = 100;
    const min = 0;
    
    const points = displayData.map((val, i) => {
        const x = (i / (displayData.length - 1)) * width;
        const y = height - ((val - min) / (max - min)) * height;
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className="flex flex-col w-full">
            <div className="flex justify-between items-center mb-2 px-1">
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></div>
                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">{label}</h4>
                </div>
            </div>
            <div className="w-full h-12 relative overflow-hidden">
                {/* Gradient Background for Chart */}
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id={`grad-${label}`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
                            <stop offset="100%" stopColor={color} stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <polygon points={`0,${height} ${points} ${width},${height}`} fill={`url(#grad-${label})`} />
                    <polyline fill="none" stroke={color} strokeWidth="2" points={points} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
                    <circle cx={(displayData.length - 1) / (displayData.length - 1) * width} cy={height - ((displayData[displayData.length - 1] - min) / (max - min)) * height} r="3" fill={color} className="animate-pulse" />
                </svg>
            </div>
        </div>
    );
};
