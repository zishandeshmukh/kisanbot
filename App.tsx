<<<<<<< HEAD
import React, { useState, useEffect, useCallback, useRef } from 'react';
// RobotControls import removed as it is no longer used
=======

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RobotControls } from './components/RobotControls';
>>>>>>> 5fc062c51a3af11bd81c504d1c75f444d2f4beaa
import { VideoFeed } from './components/VideoFeed';
import { AnalysisResultModal } from './components/AnalysisResultModal';
import { SettingsModal } from './components/SettingsModal';
import { SensorDashboard } from './components/SensorDashboard';
import { ChatAssistant } from './components/ChatAssistant';
import { VoiceAssistant } from './components/VoiceAssistant'; 
import { ReportModal } from './components/ReportModal';
import { MarketView } from './components/MarketView';
import { DiaryView } from './components/DiaryView';
import { analyzePlantImage } from './services/geminiService';
import { getWeatherData, calculateIrrigation } from './services/weatherService';
import { addDiaryEntry } from './services/diaryService';
import { AppSettings, AnalysisResult, RobotCommand, SensorData, Language, SensorHistoryPoint, OfflineCapture, WeatherData, IrrigationAdvice } from './types';
import { getTranslation } from './utils/translations';

const DEFAULT_SETTINGS: AppSettings = {
  streamUrl: 'https://picsum.photos/640/480', 
  controlUrl: 'http://192.168.4.1',
  theme: 'light',
  targetMoisture: 60,
  plantType: 'General/Other',
  plantAge: 'Vegetative Stage',
  location: { mode: 'manual', latitude: 20.5937, longitude: 78.9629, address: 'India' },
  fieldSizeAcres: 1.0,
  demoMode: true, // Enabled by default for web deployment
  apiKey: '' // Default to empty string, service will check .env
};

const MOCK_INITIAL_SENSORS: SensorData = {
  temperature: 28,
  humidity: 65,
  soilMoisture: 45,
  obstacleDetected: false,
  batteryLevel: 85
};

type Tab = 'dashboard' | 'patrol' | 'market' | 'diary';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false); 
  const [language, setLanguage] = useState<Language>('hi'); 
  
  // Translation Hook
  const t = getTranslation(language);

  const [sensorData, setSensorData] = useState<SensorData>(MOCK_INITIAL_SENSORS);
  const [sensorHistory, setSensorHistory] = useState<SensorHistoryPoint[]>([]);
  
  // Weather State
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [irrigationAdvice, setIrrigationAdvice] = useState<IrrigationAdvice | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);

  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [pendingImage, setPendingImage] = useState<string | null>(null); 
  const [status, setStatus] = useState("🟢 System Ready");
  
  const [offlineQueue, setOfflineQueue] = useState<OfflineCapture[]>([]);
  const offlineQueueRef = useRef(offlineQueue);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Auto Patrol State
  const [isAutoPatrol, setIsAutoPatrol] = useState(false);
  const autoPatrolInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const [captureTrigger, setCaptureTrigger] = useState(0);
  const [isLightOn, setIsLightOn] = useState(false);
  
  // Defense Mode State
  const [isDefenseMode, setIsDefenseMode] = useState(false);
  const defenseInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

<<<<<<< HEAD
  // --- FILE UPLOAD REFS & HANDLERS ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,") to match expected format
        const base64Data = base64String.split(',')[1];
        setPendingImage(base64Data);
        setStatus("🖼️ Image Uploaded");
        // Auto-trigger analysis
        triggerAnalysis(base64Data);
      };
      reader.readAsDataURL(file);
    }
  };

=======
>>>>>>> 5fc062c51a3af11bd81c504d1c75f444d2f4beaa
  useEffect(() => {
    offlineQueueRef.current = offlineQueue;
  }, [offlineQueue]);

  // Load Settings
  useEffect(() => {
    const stored = localStorage.getItem('kisanBotSettings');
    if (stored) {
      setSettings(JSON.parse(stored));
    }
    
    const storedReport = localStorage.getItem('kisanBotLastReport');
    if (storedReport) setAnalysisResult(JSON.parse(storedReport));
    const storedQueue = localStorage.getItem('kisanBotOfflineQueue');
    if (storedQueue) setOfflineQueue(JSON.parse(storedQueue));

    window.addEventListener('online', () => { setIsOnline(true); setStatus("🟢 Network Restored"); });
    window.addEventListener('offline', () => { setIsOnline(false); setStatus("⚠️ Network Lost"); });
  }, []);

  useEffect(() => {
    if (settings.theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [settings.theme]);

  // --- WEATHER POLLING ---
  useEffect(() => {
    const fetchWeather = async () => {
        setIsWeatherLoading(true);
        const data = await getWeatherData(settings.location.latitude, settings.location.longitude);
        setWeather(data);
        setIsWeatherLoading(false);
    };
    fetchWeather();
    const interval = setInterval(fetchWeather, 900000); 
    return () => clearInterval(interval);
  }, [settings.location.latitude, settings.location.longitude]);

  // --- RE-CALCULATE IRRIGATION ---
  useEffect(() => {
    if (weather && sensorData) {
        const advice = calculateIrrigation(
            sensorData, 
            weather, 
            settings.plantType, 
            settings.fieldSizeAcres
        );
        setIrrigationAdvice(advice);
    }
  }, [weather, sensorData, settings.plantType, settings.fieldSizeAcres]);

  // Sensor Polling
  useEffect(() => {
    const interval = setInterval(async () => {
      // Simulation Mode (In production, fetch from settings.controlUrl + '/sensors')
      // For now, simulating realistic sensor drift
      updateSensors({
          temperature: parseFloat((28 + Math.random() * 2).toFixed(1)),
          humidity: Math.floor(60 + Math.random() * 10),
          soilMoisture: Math.max(0, Math.min(100, sensorData.soilMoisture + (Math.random() > 0.5 ? 1 : -1))),
          obstacleDetected: Math.random() > 0.98, 
          batteryLevel: Math.max(0, (sensorData.batteryLevel || 100) - 0.05)
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [sensorData.soilMoisture, sensorData.batteryLevel]);

  const updateSensors = (newData: SensorData) => {
    setSensorData(newData);
    setSensorHistory(prev => {
        const updated = [...prev, { timestamp: Date.now(), ...newData }];
        return updated.length > 50 ? updated.slice(updated.length - 50) : updated;
    });
  };

  const saveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('kisanBotSettings', JSON.stringify(newSettings));
  };

  // Helper to fix URLs
  const normalizeUrl = (url: string) => {
      if (!url) return '';
      if (!url.startsWith('http')) return 'http://' + url;
      return url.replace(/\/$/, ''); // Remove trailing slash
  };

  // --- CAMERA SERVO CONTROL ---
  const controlCameraServo = async (angle: number) => {
     if (settings.demoMode) {
         console.log(`[Demo Mode] Servo moved to ${angle}`);
         return;
     }
     try {
         if (!settings.streamUrl) return;
         const baseUrl = normalizeUrl(settings.streamUrl);
         await fetch(`${baseUrl}/pan?angle=${angle}`, { mode: 'no-cors' });
     } catch (e) {
         console.warn("Servo control failed (Invalid URL or Network)", e);
     }
  };

  // --- DEFENSE MODE LOGIC ---
  const toggleDefenseSiren = (active: boolean) => {
      if (active) {
          if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          const ctx = audioCtxRef.current;
          
          if (defenseInterval.current) clearInterval(defenseInterval.current);
          
          // Siren + Strobe Loop
          let toggle = false;
          defenseInterval.current = setInterval(() => {
              toggle = !toggle;
              setIsLightOn(toggle);
              
              if (toggle) {
                  // Oscillator Siren
                  if (ctx.state === 'suspended') ctx.resume();
                  const osc = ctx.createOscillator();
                  const gain = ctx.createGain();
                  osc.type = 'sawtooth';
                  osc.frequency.setValueAtTime(800, ctx.currentTime);
                  osc.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.3);
                  gain.gain.setValueAtTime(0.5, ctx.currentTime);
                  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
                  osc.connect(gain);
                  gain.connect(ctx.destination);
                  osc.start();
                  osc.stop(ctx.currentTime + 0.3);
              }
          }, 400);

      } else {
          if (defenseInterval.current) {
              clearInterval(defenseInterval.current);
              defenseInterval.current = null;
          }
          setIsLightOn(false);
      }
  };

  const sendRobotCommand = useCallback(async (cmd: RobotCommand) => {
    if (cmd === RobotCommand.Auto) { setIsAutoPatrol(true); setStatus("🚜 " + t.autoMode); return; }
    
    // Analyze Sequence: Center Camera -> Wait -> Snap
    if (cmd === RobotCommand.Analyze) { 
        setStatus("📸 Aligning Camera..."); 
        await controlCameraServo(90); // Center
        setTimeout(() => {
            setStatus("📸 Capturing...");
            setCaptureTrigger(Date.now()); 
        }, 800); // Wait for servo to move
        return; 
    }
    
    if (cmd === RobotCommand.Flashlight) setIsLightOn(prev => !prev);
    if (cmd === RobotCommand.DEFENSE) {
         const newDefenseState = !isDefenseMode;
         setIsDefenseMode(newDefenseState);
         toggleDefenseSiren(newDefenseState);
         setStatus(newDefenseState ? "🛡️ " + t.defenseActive : "✅ " + t.systemReady);
         return;
    }

    if (isAutoPatrol && cmd === RobotCommand.STOP) { setIsAutoPatrol(false); setStatus("🛑 " + t.manualMode); return; }
    if (isDefenseMode && cmd === RobotCommand.STOP) { 
        setIsDefenseMode(false); 
        toggleDefenseSiren(false);
        setStatus("✅ " + t.systemReady);
        return; 
    }
    
    if (sensorData.obstacleDetected && cmd === RobotCommand.FORWARD) {
        setStatus("⚠️ " + t.obstacle);
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        return;
    }
    if (cmd !== RobotCommand.STOP) setStatus(`📡 ${cmd}`);
    
    if (settings.demoMode) {
        // In Demo mode, pretend we sent it
        if (cmd === RobotCommand.STOP && !isAutoPatrol && !isDefenseMode) setTimeout(() => setStatus("✅ " + t.systemReady), 800);
        return;
    }

    // Send to ESP32 (Control)
    const baseUrl = settings.controlUrl.startsWith('http') ? settings.controlUrl : `http://${settings.controlUrl}`;
    
    try {
        await fetch(`${baseUrl}/${cmd}`, { mode: 'no-cors' });
    } catch (e) { console.error("Control Error", e); }
    
    if (cmd === RobotCommand.STOP && !isAutoPatrol && !isDefenseMode) setTimeout(() => setStatus("✅ " + t.systemReady), 800);
  }, [sensorData.obstacleDetected, isAutoPatrol, isDefenseMode, t, settings.controlUrl, settings.demoMode]);

  // --- AUTO PATROL (Updated for 360 shots) ---
  useEffect(() => {
    if (isAutoPatrol) {
        if (!autoPatrolInterval.current) {
            let step = 0;
            autoPatrolInterval.current = setInterval(() => {
                if (sensorData.obstacleDetected) return; 
                switch(step) {
                    case 0: sendRobotCommand(RobotCommand.FORWARD); break;
                    case 1: sendRobotCommand(RobotCommand.STOP); break;
                    case 2: setStatus("📸 Scan Left"); controlCameraServo(0); break;
                    case 3: setCaptureTrigger(Date.now()); break; // Snap Left
                    case 4: setStatus("📸 Scan Right"); controlCameraServo(180); break;
                    case 5: setCaptureTrigger(Date.now()); break; // Snap Right
                    case 6: setStatus("📸 Scan Center"); controlCameraServo(90); break;
                    case 7: setCaptureTrigger(Date.now()); break; // Snap Center
                    case 8: sendRobotCommand(RobotCommand.LEFT); break;
                    case 9: sendRobotCommand(RobotCommand.STOP); step = -1; break;
                }
                step++;
            }, 2500); 
        }
    } else {
        if (autoPatrolInterval.current) { clearInterval(autoPatrolInterval.current); autoPatrolInterval.current = null; }
    }
    return () => { if (autoPatrolInterval.current) clearInterval(autoPatrolInterval.current); }
  }, [isAutoPatrol, sensorData.obstacleDetected, sendRobotCommand]);

  const handleCapture = (base64Image: string) => {
      setPendingImage(base64Image);
      setStatus(t.imageCaptured);
      if (navigator.vibrate) navigator.vibrate(100);
<<<<<<< HEAD
      
      // Auto-trigger analysis and switch to dashboard to show results
      triggerAnalysis(base64Image);
      setActiveTab('dashboard');

=======
      setTimeout(() => setStatus("✅ " + t.systemReady), 3000);
      
>>>>>>> 5fc062c51a3af11bd81c504d1c75f444d2f4beaa
      if (isAutoPatrol) {
          addDiaryEntry({
              type: 'note',
              title: 'Auto Patrol Snap',
              description: 'Image captured during automated patrol sequence.',
              image: base64Image
          });
      }
  };

<<<<<<< HEAD
  const triggerAnalysis = async (imageArg?: string) => {
    const imageToAnalyze = imageArg || pendingImage;
    if (!imageToAnalyze) return;
    
    // If called with an argument, ensure state is synced
    if (imageArg) setPendingImage(imageArg);
=======
  const triggerAnalysis = async () => {
    if (!pendingImage) return;
>>>>>>> 5fc062c51a3af11bd81c504d1c75f444d2f4beaa
    
    setStatus("🤖 " + t.analyzing); 
    setIsAnalyzing(true);
    try {
      // Pass optional settings.apiKey
      const result = await analyzePlantImage(
<<<<<<< HEAD
          imageToAnalyze, 
=======
          pendingImage, 
>>>>>>> 5fc062c51a3af11bd81c504d1c75f444d2f4beaa
          sensorData, 
          language, 
          settings.plantType || 'Unknown', 
          settings.plantAge || 'Unknown',
          settings.apiKey
      );
<<<<<<< HEAD
      const resultWithTime = { ...result, timestamp: Date.now(), imageUrl: `data:image/jpeg;base64,${imageToAnalyze}` };
=======
      const resultWithTime = { ...result, timestamp: Date.now(), imageUrl: `data:image/jpeg;base64,${pendingImage}` };
>>>>>>> 5fc062c51a3af11bd81c504d1c75f444d2f4beaa
      setAnalysisResult(resultWithTime);
      localStorage.setItem('kisanBotLastReport', JSON.stringify(resultWithTime));
      
      // Auto Log to Diary
      addDiaryEntry({
          type: 'disease',
          title: result.diseaseName,
          description: result.hindiAdvice,
<<<<<<< HEAD
          image: imageToAnalyze
      });

      setStatus("✅ Complete");
      // Keep pendingImage set so we show the result view with the image
=======
          image: pendingImage
      });

      setStatus("✅ Complete");
      setPendingImage(null); 
>>>>>>> 5fc062c51a3af11bd81c504d1c75f444d2f4beaa
    } catch (error) { 
        setStatus("❌ Failed"); 
        alert("Analysis failed. Please check your API Key in Settings.");
        console.error(error);
<<<<<<< HEAD
        setPendingImage(null); // Reset on failure
=======
>>>>>>> 5fc062c51a3af11bd81c504d1c75f444d2f4beaa
    } finally { 
        setIsAnalyzing(false); 
    }
  };

  const renderContent = () => {
      switch (activeTab) {
          case 'patrol':
              return (
<<<<<<< HEAD
                  <div className="flex flex-col h-full bg-black animate-fade-in relative overflow-hidden">
                      {/* Video Container set to flex-1 to take full available height */}
                      <div className="flex-1 w-full flex flex-col justify-center overflow-hidden z-10 relative">
                         <VideoFeed 
                            streamUrl={settings.streamUrl} 
                            onCapture={handleCapture} 
                            onCaptureStart={() => { setStatus("📸 Capturing..."); }} 
                            isAnalyzing={isAnalyzing} 
                            triggerCapture={captureTrigger} 
                            demoMode={settings.demoMode} 
                         />
                      </div>
                      {/* RobotControls component removed to hide the interface */}
=======
                  <div className="flex flex-col h-full bg-slate-900 animate-fade-in relative overflow-hidden">
                      <div className="relative w-full flex-shrink-0 bg-black flex flex-col justify-center overflow-hidden border-b border-gray-800 shadow-xl z-10" style={{ height: '35%' }}>
                         <VideoFeed streamUrl={settings.streamUrl} onCapture={handleCapture} onCaptureStart={() => { setStatus("📸 Capturing..."); }} isAnalyzing={isAnalyzing} triggerCapture={captureTrigger} demoMode={settings.demoMode} />
                      </div>
                      <div className="flex-1 w-full bg-slate-50 dark:bg-slate-900 relative flex flex-col z-0">
                          <div className="flex-1 w-full flex items-center justify-center p-4 pb-32"> 
                              <RobotControls onCommand={sendRobotCommand} statusText={status} isObstacleDetected={sensorData.obstacleDetected} isLightOn={isLightOn} />
                          </div>
                      </div>
>>>>>>> 5fc062c51a3af11bd81c504d1c75f444d2f4beaa
                  </div>
              );
          case 'market':
              return <MarketView location={settings.location.address} cropType={settings.plantType} t={t} />;
          case 'diary':
              return <DiaryView t={t} />;
          default:
              return (
                <div className="space-y-4 animate-fade-in pb-32 pt-4 px-4">
                    <SensorDashboard data={sensorData} history={sensorHistory} weather={weather} irrigation={irrigationAdvice} loading={isWeatherLoading} t={t} />
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden relative">
                         <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 flex justify-between items-center">
                             <div className="flex items-center gap-2">
                                <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 p-1.5 rounded-lg">🌱</span>
                                <h3 className="font-bold text-gray-700 dark:text-gray-200">{t.analysis}</h3>
                             </div>
                             <button onClick={() => setIsReportOpen(true)} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 rounded-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                             </button>
                         </div>
                         <div className="p-5">
<<<<<<< HEAD
                            {pendingImage && !isAnalyzing && !analysisResult && (
=======
                            {pendingImage && !isAnalyzing && (
>>>>>>> 5fc062c51a3af11bd81c504d1c75f444d2f4beaa
                                <div className="mb-4">
                                    <div className="relative rounded-xl overflow-hidden shadow-md mb-3 border border-gray-200 dark:border-gray-600">
                                        <img src={`data:image/jpeg;base64,${pendingImage}`} alt="Captured" className="w-full h-48 object-cover" />
                                        <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-md shadow-sm">{t.pendingAnalysis}</div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button onClick={() => setPendingImage(null)} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-bold">{t.discard}</button>
<<<<<<< HEAD
                                        <button onClick={() => triggerAnalysis()} className="flex-[2] py-3 bg-green-600 text-white rounded-xl font-bold shadow-lg hover:bg-green-700">✨ {t.analyzeBtn}</button>
=======
                                        <button onClick={triggerAnalysis} className="flex-[2] py-3 bg-green-600 text-white rounded-xl font-bold shadow-lg hover:bg-green-700">✨ {t.analyzeBtn}</button>
>>>>>>> 5fc062c51a3af11bd81c504d1c75f444d2f4beaa
                                    </div>
                                </div>
                            )}
                            {isAnalyzing && (
                                <div className="py-8 flex flex-col items-center justify-center text-center">
                                    <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                                    <p className="text-green-600 font-bold animate-pulse">{t.analyzing}</p>
                                </div>
                            )}
                            {!pendingImage && !isAnalyzing && analysisResult ? (
                                 <div className="flex gap-4">
                                    {analysisResult.imageUrl && <div className="w-24 h-24 shrink-0 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm"><img src={analysisResult.imageUrl} alt="Crop" className="w-full h-full object-cover" /></div>}
                                    <div className="flex-1">
                                         <h4 className={`text-xl font-black ${analysisResult.isHealthy ? 'text-green-600' : 'text-red-600'}`}>{analysisResult.diseaseName}</h4>
<<<<<<< HEAD
                                         <div className="mt-2 text-sm text-gray-700 dark:text-gray-200">
                                            <p className="font-medium mb-1">Diagnosis / Advice:</p>
                                            <div className="p-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-100 dark:border-gray-700 mb-2">
                                                <p className="font-serif leading-relaxed">{analysisResult.hindiAdvice}</p>
                                            </div>
                                            
                                            <p className="font-medium mb-1">Fertilizer Recommendation:</p>
                                            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                                                <p className="font-serif leading-relaxed text-blue-800 dark:text-blue-200">{analysisResult.fertilizerRecommendation}</p>
                                            </div>
                                         </div>
                                         <div className="mt-4 flex gap-3">
                                            <button onClick={() => { setAnalysisResult(null); setPendingImage(null); cameraInputRef.current?.click(); }} className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold shadow-md hover:bg-green-700 flex items-center justify-center gap-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                {t.analyzeBtn} / Camera
                                            </button>
                                            <button onClick={() => { setAnalysisResult(null); setPendingImage(null); }} className="px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold">
                                                Close
                                            </button>
                                         </div>
=======
                                         <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-100 dark:border-gray-700"><p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 font-serif">{analysisResult.hindiAdvice}</p></div>
>>>>>>> 5fc062c51a3af11bd81c504d1c75f444d2f4beaa
                                    </div>
                                 </div>
                            ) : null}
                            {!pendingImage && !isAnalyzing && !analysisResult && (
                                <div className="py-8 text-center">
                                    <div className="inline-block p-3 rounded-full bg-gray-100 dark:bg-gray-700 mb-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    </div>
                                    <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">{t.noImage}</p>
<<<<<<< HEAD
                                    
                                    <div className="flex items-center justify-center gap-4 mt-4">
                                        {/* Live Patrol Button */}
                                        <button onClick={() => setActiveTab('patrol')} className="text-green-600 font-bold text-sm hover:bg-green-50 px-3 py-2 rounded-lg transition-colors">
                                            {t.livePatrol} &rarr;
                                        </button>

                                        <span className="text-gray-300">|</span>

                                        {/* Upload Button */}
                                        <button 
                                            onClick={() => fileInputRef.current?.click()} 
                                            className="text-blue-600 font-bold text-sm hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors flex items-center gap-1"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                            </svg>
                                            Upload
                                        </button>

                                        <span className="text-gray-300">|</span>

                                        {/* Camera Button */}
                                        <button 
                                            onClick={() => cameraInputRef.current?.click()} 
                                            className="text-green-600 font-bold text-sm hover:bg-green-50 px-3 py-2 rounded-lg transition-colors flex items-center gap-1"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            Camera
                                        </button>
                                        
                                        {/* Hidden File Input */}
                                        <input 
                                            type="file" 
                                            ref={fileInputRef} 
                                            onChange={handleFileUpload} 
                                            className="hidden" 
                                            accept="image/*"
                                        />
                                        <input 
                                            type="file" 
                                            ref={cameraInputRef} 
                                            onChange={handleFileUpload} 
                                            className="hidden" 
                                            accept="image/*"
                                            capture="environment"
                                        />
                                    </div>
=======
                                    <button onClick={() => setActiveTab('patrol')} className="mt-3 text-green-600 font-bold text-sm hover:underline">{t.livePatrol} &rarr;</button>
>>>>>>> 5fc062c51a3af11bd81c504d1c75f444d2f4beaa
                                </div>
                            )}
                         </div>
                    </div>
                </div>
              );
      }
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-slate-50 dark:bg-slate-900 overflow-hidden relative transition-colors duration-300 font-sans">
      <header className="bg-gradient-to-r from-green-700 to-green-800 text-white p-3 flex justify-between items-center shadow-lg z-20 shrink-0 safe-top h-[60px]">
        <div className="flex items-center gap-2">
          <div className="bg-white/10 p-1.5 rounded-lg"><span className="text-xl">🚜</span></div>
          <div><h1 className="font-bold text-base tracking-wide">KisanBot</h1></div>
        </div>
        <div className="flex items-center gap-2">
            <select value={language} onChange={(e) => setLanguage(e.target.value as Language)} className="bg-black/20 text-xs rounded-lg px-2 py-1.5 outline-none border border-white/10 text-white">
                <option value="en">English</option><option value="hi">हिंदी</option><option value="mr">मराठी</option>
            </select>
            <button onClick={() => setIsSettingsOpen(true)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </button>
        </div>
      </header>

      <main className={`flex-1 w-full max-w-lg mx-auto p-0 transition-all ${activeTab === 'patrol' ? 'overflow-hidden' : 'overflow-y-auto scroll-smooth no-scrollbar'}`}>
          {renderContent()}
      </main>

      {/* Navigation Bar */}
      <div className="absolute bottom-0 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 safe-bottom z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] text-gray-300 dark:text-gray-600 bg-white dark:bg-slate-900 px-2 rounded-full border border-gray-100 dark:border-gray-800 shadow-sm">v2.0</div>
          <div className="flex justify-around items-center max-w-lg mx-auto h-[70px] pb-2 relative px-2">
              <button onClick={() => setActiveTab('dashboard')} className={`flex-1 flex flex-col items-center gap-1 ${activeTab === 'dashboard' ? 'text-green-600' : 'text-gray-400'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill={activeTab === 'dashboard' ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                  <span className="text-[10px] font-bold">{t.dashboard}</span>
              </button>
              
              <button onClick={() => setActiveTab('market')} className={`flex-1 flex flex-col items-center gap-1 ${activeTab === 'market' ? 'text-green-600' : 'text-gray-400'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                  <span className="text-[10px] font-bold">{t.market}</span>
              </button>

              <div className="relative -top-8 group">
                  <button onClick={() => { if(navigator.vibrate) navigator.vibrate(50); setIsVoiceOpen(true); }} className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-700 shadow-xl flex items-center justify-center text-white border-4 border-slate-50 dark:border-slate-900 group-hover:-translate-y-1 transition-transform">
                     <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                  </button>
              </div>

              <button onClick={() => setActiveTab('diary')} className={`flex-1 flex flex-col items-center gap-1 ${activeTab === 'diary' ? 'text-green-600' : 'text-gray-400'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill={activeTab === 'diary' ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                  <span className="text-[10px] font-bold">{t.diary}</span>
              </button>

              <button onClick={() => setActiveTab('patrol')} className={`flex-1 flex flex-col items-center gap-1 ${activeTab === 'patrol' ? 'text-green-600' : 'text-gray-400'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill={activeTab === 'patrol' ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  <span className="text-[10px] font-bold">{t.livePatrol}</span>
              </button>
          </div>
      </div>

      <ChatAssistant isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} language={language} sensorData={sensorData} lastAnalysis={analysisResult} onLanguageChange={(lang) => setLanguage(lang)} apiKey={settings.apiKey} />
      <VoiceAssistant isOpen={isVoiceOpen} onClose={() => setIsVoiceOpen(false)} language={language} sensorData={sensorData} lastAnalysis={analysisResult} onLanguageChange={(lang) => setLanguage(lang)} onCommand={sendRobotCommand} apiKey={settings.apiKey} />
      <ReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} lastAnalysis={analysisResult} sensorData={sensorData} weather={weather} irrigation={irrigationAdvice} t={t} />
      <SettingsModal settings={settings} onSave={saveSettings} isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} t={t} />
      <AnalysisResultModalWrapper result={analysisResult} onClose={() => {}} />

      {!isChatOpen && !isVoiceOpen && (
        <button onClick={() => setIsChatOpen(true)} className="fixed bottom-24 right-4 z-40 bg-white dark:bg-gray-800 p-3 rounded-full shadow-lg border border-gray-100 text-green-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
        </button>
      )}
    </div>
  );
}

function AnalysisResultModalWrapper({ result, onClose }: { result: AnalysisResult | null, onClose: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [lastTimestamp, setLastTimestamp] = useState<number | undefined>(0);
    useEffect(() => { if (result?.timestamp && result.timestamp !== lastTimestamp) { setIsOpen(true); setLastTimestamp(result.timestamp); } }, [result, lastTimestamp]);
    if (!isOpen || !result) return null;
    return <AnalysisResultModal result={result} onClose={() => { setIsOpen(false); onClose(); }} />;
<<<<<<< HEAD
}
=======
}
>>>>>>> 5fc062c51a3af11bd81c504d1c75f444d2f4beaa
