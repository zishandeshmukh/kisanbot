
import React, { useEffect, useState } from 'react';
import { MandiRecord } from '../types';
import { fetchMandiPrices } from '../services/marketService';

interface Props {
  location: string;
  cropType: string;
  t: any;
}

export const MarketView: React.FC<Props> = ({ location, cropType, t }) => {
  const [prices, setPrices] = useState<MandiRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  // Extract display name for location
  const displayLocation = (!location || location === "GPS Detected Location") ? "Major Hubs" : (location.split(',')[0] || "India");

  useEffect(() => {
    loadPrices();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, cropType, lastFetchTime]);

  const loadPrices = async () => {
    setLoading(true);
    try {
        const data = await fetchMandiPrices(location, cropType);
        setPrices(data);
    } catch (e) {
        console.error("Failed to load prices", e);
    } finally {
        setLoading(false);
    }
  };

  const handleRefresh = () => {
      setLastFetchTime(Date.now());
  };

  return (
    <div className="p-4 pb-24 animate-fade-in space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-600 p-6 rounded-3xl text-white shadow-lg relative overflow-hidden">
        {/* Decorative Circles */}
        <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full"></div>
        <div className="absolute top-12 left-4 w-12 h-12 bg-white/10 rounded-full"></div>

        <div className="relative z-10">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold">{t.marketTitle}</h2>
                    <div className="text-orange-100 opacity-90 text-sm mt-1 flex flex-col items-start gap-1">
                      <span>{t.marketSubtitle}</span>
                      <div className="flex items-center gap-2 bg-black/20 px-2 py-1 rounded-lg backdrop-blur-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                        <span className="font-bold underline truncate max-w-[150px]">
                            {displayLocation}
                        </span>
                      </div>
                    </div>
                </div>
                <button 
                    onClick={handleRefresh} 
                    disabled={loading}
                    className="bg-white/20 p-2.5 rounded-xl hover:bg-white/30 transition-colors disabled:opacity-50 active:scale-95 shadow-sm backdrop-blur-md"
                    title="Refresh Prices"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className={`w-6 h-6 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </button>
            </div>
            
            <div className="mt-4 flex items-center gap-2 text-xs font-medium text-orange-50">
                <span className="bg-white/20 px-2 py-1 rounded-md border border-white/10">{cropType}</span>
                <span>•</span>
                <span>Updated: {new Date().toLocaleTimeString()}</span>
            </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
           {[1,2,3,4].map(i => (
             <div key={i} className="h-28 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse"></div>
           ))}
        </div>
      ) : (
        <div className="space-y-3">
          {prices.length > 0 ? prices.map((item) => (
            <div key={item.id} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col gap-2 animate-slide-up">
              <div className="flex justify-between items-start">
                <div>
                   <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{item.marketName}</h3>
                   <span className="text-xs text-gray-500 dark:text-gray-400">{item.variety} Variety • {item.date}</span>
                </div>
                <div className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${item.trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                   {item.trend === 'up' ? '▲' : '▼'} {item.trend === 'up' ? 'Rising' : 'Falling'}
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 mt-2">
                 <PriceBox label={t.minPrice} price={item.minPrice} color="text-gray-500" />
                 <PriceBox label={t.modalPrice} price={item.modalPrice} color="text-green-600 font-black scale-110" bg="bg-green-50 dark:bg-green-900/20" />
                 <PriceBox label={t.maxPrice} price={item.maxPrice} color="text-gray-500" />
              </div>
            </div>
          )) : (
              <div className="text-center py-12 opacity-50 flex flex-col items-center">
                  <div className="text-4xl mb-2">🤷‍♂️</div>
                  <p>No market data available for <strong>{displayLocation}</strong>.</p>
                  <p className="text-xs mt-1">Try changing location in settings.</p>
                  <button onClick={handleRefresh} className="text-orange-500 font-bold mt-2 hover:underline">Retry</button>
              </div>
          )}
        </div>
      )}
      
      <p className="text-center text-[10px] text-gray-400 mt-4 leading-tight">
        *Rates are sourced from nearby APMC mandis based on your location settings.
      </p>
    </div>
  );
};

const PriceBox = ({ label, price, color, bg }: { label: string, price: number, color: string, bg?: string }) => (
  <div className={`flex flex-col items-center justify-center p-2 rounded-xl ${bg || 'bg-gray-50 dark:bg-gray-700/50'}`}>
     <span className="text-[10px] text-gray-400 uppercase font-bold">{label}</span>
     <span className={`text-lg ${color}`}>₹{price}</span>
  </div>
);
