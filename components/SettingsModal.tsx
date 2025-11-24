

import React, { useState } from 'react';
import { AppSettings } from '../types';
import { getCoordinatesFromAddress } from '../services/weatherService';

interface Props {
  settings: AppSettings;
  onSave: (s: AppSettings) => void;
  isOpen: boolean;
  onClose: () => void;
  t: any;
}

const COMMON_CROPS = [
  "Wheat (Gehu)", "Rice (Paddy)", "Tomato", "Potato", "Cotton", "Sugarcane", "Maize", "Chilli", "Onion", "General/Other"
];

export const SettingsModal: React.FC<Props> = ({ settings, onSave, isOpen, onClose, t }) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState('');

  const handleSave = () => {
      onSave(localSettings);
      onClose();
  };

  const fixUrl = (url: string) => {
      if (!url) return '';
      let fixed = url.trim();
      if (!fixed.startsWith('http')) fixed = 'https://' + fixed;
      return fixed.replace(/\/$/, '');
  };

  const handleAutoLocation = () => {
     if (!navigator.geolocation) {
         setGeoError("Not supported");
         return;
     }
     setIsLocating(true);
     setGeoError('');
     
     navigator.geolocation.getCurrentPosition(
         (pos) => {
             setLocalSettings(prev => ({
                 ...prev,
                 location: {
                     mode: 'auto',
                     latitude: pos.coords.latitude,
                     longitude: pos.coords.longitude,
                     address: "GPS Detected Location"
                 }
             }));
             setIsLocating(false);
         },
         () => {
             setGeoError("GPS Failed");
             setIsLocating(false);
         }
     );
  };

  const handleAddressSearch = async () => {
      setIsLocating(true);
      const res = await getCoordinatesFromAddress(localSettings.location.address);
      setIsLocating(false);
      
      if (res) {
          setLocalSettings(prev => ({
              ...prev,
              location: {
                  mode: 'manual',
                  latitude: res.lat,
                  longitude: res.lon,
                  address: res.name
              }
          }));
      } else {
          setGeoError("Not found");
      }
  };

  const InputGroup = ({ label, children }: { label: string, children: React.ReactNode }) => (
    <div className="space-y-1.5">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">{label}</label>
        {children}
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex justify-between items-center">
             <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <span className="bg-green-100 dark:bg-green-900 text-green-600 p-1.5 rounded-lg text-sm">⚙️</span>
                {t.settings}
             </h2>
             <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
             </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
          
          {/* SECTION 1: ROBOT CONNECTION */}
          <div className="space-y-4">
               <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-gray-800 pb-2">📡 {t.robotConnection}</h3>
               
               {/* Demo Mode Toggle */}
               <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl border border-amber-100 dark:border-amber-800/50">
                  <div>
                      <p className="text-sm font-bold text-gray-800 dark:text-white">Demo Mode (Simulation)</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Run app without hardware</p>
                  </div>
                  <button 
                    onClick={() => setLocalSettings(prev => ({...prev, demoMode: !prev.demoMode}))}
                    className={`w-12 h-6 rounded-full relative transition-colors ${localSettings.demoMode ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                  >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${localSettings.demoMode ? 'left-7' : 'left-1'}`}></div>
                  </button>
               </div>

               <div className={`space-y-4 transition-opacity duration-300 ${localSettings.demoMode ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                    <InputGroup label={t.controllerIp}>
                        <input
                            type="text"
                            value={localSettings.controlUrl}
                            onChange={(e) => setLocalSettings({ ...localSettings, controlUrl: e.target.value })}
                            onBlur={(e) => setLocalSettings({ ...localSettings, controlUrl: fixUrl(e.target.value) })}
                            className={`w-full p-3 bg-gray-50 dark:bg-gray-800 border rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none dark:text-white transition-all font-mono ${localSettings.controlUrl && !localSettings.controlUrl.startsWith('http') ? 'border-amber-300' : 'border-gray-200 dark:border-gray-700'}`}
                            placeholder="https://your-ngrok-url.app"
                        />
                        {localSettings.controlUrl && !localSettings.controlUrl.startsWith('http') && (
                            <p className="text-[10px] text-amber-600 font-bold">⚠️ Missing 'https://'. Will Auto-fix on save.</p>
                        )}
                    </InputGroup>
                    
                    <InputGroup label={t.streamUrl}>
                        <input
                            type="text"
                            value={localSettings.streamUrl}
                            onChange={(e) => setLocalSettings({ ...localSettings, streamUrl: e.target.value })}
                            onBlur={(e) => setLocalSettings({ ...localSettings, streamUrl: fixUrl(e.target.value) })}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none dark:text-white transition-all font-mono"
                        />
                    </InputGroup>
               </div>
          </div>

          {/* SECTION 2: FARM & WEATHER */}
          <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-gray-800 pb-2">🌦️ {t.farmLocation}</h3>
              
              <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30">
                  <div className="flex gap-2 mb-3">
                      <button 
                        onClick={handleAutoLocation}
                        disabled={isLocating}
                        className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors"
                      >
                          {isLocating ? <span className="animate-spin">⏳</span> : `📍 ${t.autoGps}`}
                      </button>
                  </div>
                  
                  <div className="relative flex items-center">
                      <input 
                        type="text" 
                        value={localSettings.location.address}
                        onChange={(e) => setLocalSettings({...localSettings, location: {...localSettings.location, address: e.target.value, mode: 'manual'}})}
                        placeholder={t.enterLocation}
                        className="w-full p-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white pr-10 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <button 
                        onClick={handleAddressSearch}
                        className="absolute right-1 p-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 rounded-md text-gray-500 transition-colors"
                      >
                         🔍
                      </button>
                  </div>
                  {geoError && <p className="text-red-500 text-xs mt-1 font-bold">{geoError}</p>}
                  
                  <div className="mt-3 grid grid-cols-2 gap-2">
                       <div className="bg-white/50 dark:bg-black/20 p-2 rounded border border-blue-100 dark:border-blue-900/30">
                          <span className="block text-[10px] text-gray-500">Latitude</span>
                          <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-300">{localSettings.location.latitude.toFixed(4)}</span>
                       </div>
                       <div className="bg-white/50 dark:bg-black/20 p-2 rounded border border-blue-100 dark:border-blue-900/30">
                          <span className="block text-[10px] text-gray-500">Longitude</span>
                          <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-300">{localSettings.location.longitude.toFixed(4)}</span>
                       </div>
                  </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                  <InputGroup label={t.fieldSize}>
                      <input 
                          type="number"
                          value={localSettings.fieldSizeAcres}
                          onChange={(e) => setLocalSettings({...localSettings, fieldSizeAcres: parseFloat(e.target.value) || 1})}
                          className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white font-bold"
                       />
                  </InputGroup>
                  <InputGroup label={t.targetMoisture}>
                      <div className="relative">
                          <input
                             type="number" max="100" min="0"
                             value={localSettings.targetMoisture}
                             onChange={(e) => setLocalSettings({ ...localSettings, targetMoisture: parseInt(e.target.value) })}
                             className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white font-bold"
                           />
                      </div>
                  </InputGroup>
              </div>
          </div>

          {/* SECTION 3: CROP PROFILE */}
          <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-gray-800 pb-2">🌱 {t.cropProfile}</h3>
              
              <InputGroup label={t.selectCrop}>
                <select
                  value={localSettings.plantType}
                  onChange={(e) => setLocalSettings({...localSettings, plantType: e.target.value})}
                  className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-green-500"
                >
                  {COMMON_CROPS.map(crop => <option key={crop} value={crop}>{crop}</option>)}
                </select>
              </InputGroup>
          </div>
          
           {/* SECTION 4: APPEARANCE */}
           <div className="space-y-4 pb-4">
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-gray-800 pb-2">🎨 {t.appearance}</h3>
               <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                  <button onClick={() => { setLocalSettings({...localSettings, theme: 'light'}); document.documentElement.classList.remove('dark'); }} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${localSettings.theme === 'light' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{t.lightMode}</button>
                  <button onClick={() => { setLocalSettings({...localSettings, theme: 'dark'}); document.documentElement.classList.add('dark'); }} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${localSettings.theme === 'dark' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>{t.darkMode}</button>
               </div>
           </div>

        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex gap-3 shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
          <button onClick={onClose} className="flex-1 py-3.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 transition-colors">{t.cancel}</button>
          <button onClick={handleSave} className="flex-[2] py-3.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg shadow-green-200 dark:shadow-green-900/30 transition-all active:scale-95">{t.save}</button>
        </div>
      </div>
    </div>
  );
};