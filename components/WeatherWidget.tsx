
import React from 'react';
import { WeatherData, IrrigationAdvice } from '../types';
import { getWeatherIcon } from '../services/weatherService';

interface Props {
  weather: WeatherData | null;
  irrigation: IrrigationAdvice | null;
  loading: boolean;
}

export const WeatherWidget: React.FC<Props> = ({ weather, irrigation, loading }) => {
  if (loading) return <div className="h-40 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse"></div>;
  if (!weather) return null;

  const isStormy = weather.weatherCode >= 95 || weather.windSpeed > 35;
  const isRainSoon = weather.nextRainHour !== undefined && weather.nextRainHour < 6;

  return (
    <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-3xl p-5 text-white shadow-lg relative overflow-hidden">
      
      {/* Background patterns */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/20 to-transparent"></div>

      <div className="relative z-10">
        
        {/* Alerts Banner */}
        {isStormy && (
             <div className="mb-3 bg-red-500/90 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-bold animate-pulse shadow-md border border-red-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
                STORM ALERT - HIGH WIND
             </div>
        )}
        
        {isRainSoon && !isStormy && (
             <div className="mb-3 bg-yellow-400/90 text-yellow-900 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-bold shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                Rain in {weather.nextRainHour} hours
             </div>
        )}

        {/* Main Weather */}
        <div className="flex justify-between items-start mb-4">
            <div>
                <div className="flex items-center gap-2">
                     <span className="text-4xl">{getWeatherIcon(weather.weatherCode)}</span>
                     <div>
                         <h2 className="text-3xl font-bold">{Math.round(weather.temperature)}°C</h2>
                         <p className="text-blue-100 text-xs font-medium">Feels like {Math.round(weather.temperature + 2)}°</p>
                     </div>
                </div>
            </div>
            <div className="text-right space-y-1">
                <div className="flex items-center justify-end gap-1 text-blue-100 text-xs">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                    {weather.windSpeed} km/h
                </div>
                <div className="flex items-center justify-end gap-1 text-blue-100 text-xs">
                    <span className="font-bold">{weather.humidity}%</span> Humidity
                </div>
            </div>
        </div>

        {/* Irrigation Advice Card (Nested) */}
        {irrigation && (
            <div className={`rounded-xl p-3 backdrop-blur-md border border-white/20 ${irrigation.action === 'WAIT' ? 'bg-black/20' : 'bg-white/20'}`}>
                <div className="flex justify-between items-start mb-1">
                     <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Water Advisory</span>
                     {irrigation.action === 'IRRIGATE' ? (
                        <span className="bg-white text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full">ADD WATER</span>
                     ) : (
                        <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">STOP</span>
                     )}
                </div>
                
                {irrigation.action === 'IRRIGATE' ? (
                    <div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold">{irrigation.litersPerAcre.toLocaleString()}</span>
                            <span className="text-xs">Liters/acre</span>
                        </div>
                        <p className="text-[10px] text-blue-50 mt-1 opacity-90">{irrigation.reason}</p>
                    </div>
                ) : (
                    <p className="text-sm font-medium mt-1 leading-tight">{irrigation.reason}</p>
                )}
            </div>
        )}
      </div>
    </div>
  );
};
