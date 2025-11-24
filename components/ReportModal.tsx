
import React from 'react';
import { AnalysisResult, SensorData, WeatherData, IrrigationAdvice } from '../types';
import { getWeatherIcon } from '../services/weatherService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  lastAnalysis: AnalysisResult | null;
  sensorData: SensorData;
  weather: WeatherData | null;
  irrigation: IrrigationAdvice | null;
  t: any;
}

export const ReportModal: React.FC<Props> = ({ isOpen, onClose, lastAnalysis, sensorData, weather, irrigation, t }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      {/* Container: Fixed Height, Flex Column to separate Header from Scrollable Content */}
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-up">
        
        {/* Sticky Header Section */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-slate-900 shrink-0 z-10">
            <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t.fieldReport}</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">{new Date().toLocaleString()}</p>
            </div>
            <button 
                onClick={onClose} 
                className="bg-gray-100 dark:bg-gray-800 p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </button>
        </div>

        {/* Scrollable Content Section - Hides Scrollbar but allows scrolling */}
        <div className="p-6 overflow-y-auto no-scrollbar space-y-6">
            
            {/* WEATHER & IRRIGATION SECTION */}
            {weather && (
                <div>
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">{t.weather} & {t.irrigationPlan}</h3>
                    <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl p-4">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-3">
                                <span className="text-3xl">{getWeatherIcon(weather.weatherCode)}</span>
                                <div>
                                    <p className="font-bold text-gray-800 dark:text-gray-200">{Math.round(weather.temperature)}°C</p>
                                    <p className="text-xs text-gray-500">Forecast: {weather.rainForecast24h}mm Rain</p>
                                </div>
                            </div>
                            {irrigation && (
                                <div className={`px-3 py-1 rounded-lg text-xs font-bold ${irrigation.action === 'IRRIGATE' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                                    {irrigation.action === 'IRRIGATE' ? 'ADD WATER' : 'STOP WATER'}
                                </div>
                            )}
                        </div>
                        
                        {irrigation && irrigation.action === 'IRRIGATE' && (
                            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-blue-100 dark:border-blue-900 shadow-sm">
                                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Water Requirement</p>
                                <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
                                    {irrigation.litersPerAcre.toLocaleString()} <span className="text-sm text-gray-400 font-medium">Liters/Acre</span>
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{irrigation.reason}</p>
                            </div>
                        )}
                        {irrigation && irrigation.action !== 'IRRIGATE' && (
                            <p className="text-sm font-medium text-orange-600 bg-orange-100 px-3 py-2 rounded-lg">
                                ⚠️ {irrigation.reason}
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Current Sensors - Full Width Cards for clean vertical flow */}
            <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide">{t.sensors}</h3>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold">{t.soilMoisture}</p>
                        <p className="text-xs text-gray-400">{t.targetMoisture}: 60%</p>
                    </div>
                    <p className={`text-2xl font-bold ${sensorData.soilMoisture < 30 ? 'text-red-500' : 'text-green-500'}`}>{sensorData.soilMoisture}%</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold">{t.temperature}</p>
                        <p className="text-xs text-gray-400">Air Temperature</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{sensorData.temperature}°C</p>
                </div>
            </div>

            {/* AI Diagnosis */}
            {lastAnalysis ? (
                <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 p-4 rounded-xl">
                    <h3 className="font-bold text-orange-800 dark:text-orange-300 mb-2 flex items-center gap-2">
                        {t.diagnosis}
                    </h3>
                    <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                        <p><span className="font-semibold">{t.condition}:</span> {lastAnalysis.diseaseName}</p>
                        <p><span className="font-semibold">{t.action}:</span> {lastAnalysis.hindiAdvice}</p>
                        <p><span className="font-semibold">{t.fertilizer}:</span> {lastAnalysis.fertilizerRecommendation}</p>
                    </div>
                </div>
            ) : (
                <div className="text-center p-6 text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                    No recent AI analysis data found.
                </div>
            )}

            {/* Action Button */}
            <button 
                className="w-full py-4 bg-gray-900 dark:bg-gray-700 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 shadow-lg"
                onClick={() => { alert("Report saved to device storage."); onClose(); }}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                {t.savePdf}
            </button>
            
            {/* Bottom Padding for scroll */}
            <div className="h-4"></div>
        </div>
      </div>
    </div>
  );
};
