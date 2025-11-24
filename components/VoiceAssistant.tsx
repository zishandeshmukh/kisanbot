
import React, { useState, useEffect, useRef } from 'react';
import { Language, SensorData, AnalysisResult, RobotCommand } from '../types';
import { chatWithAgriBot } from '../services/geminiService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  sensorData: SensorData;
  lastAnalysis: AnalysisResult | null;
  onLanguageChange: (lang: Language) => void;
  onCommand: (cmd: RobotCommand) => void;
  apiKey?: string;
}

export const VoiceAssistant: React.FC<Props> = ({ isOpen, onClose, language, sensorData, lastAnalysis, onLanguageChange, onCommand, apiKey }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceLang, setVoiceLang] = useState<Language>(language);

  useEffect(() => {
    const updateVoices = () => {
      const available = window.speechSynthesis.getVoices();
      if (available.length > 0) {
          setVoices(available);
          console.log(`Loaded ${available.length} voices.`);
      }
    };
    updateVoices();
    
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = updateVoices;
    }
    
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  useEffect(() => {
     setVoiceLang(language);
  }, [language]);

  useEffect(() => {
    if (isOpen) {
        setTranscript(getPromptText(language));
        setResponse('');
    } else {
        stopSpeaking();
        setIsListening(false);
    }
  }, [isOpen, language]);

  const getPromptText = (lang: Language) => {
      if (lang === 'hi') return 'बोलने के लिए माइक दबाएं...';
      if (lang === 'mr') return 'बोलण्यासाठी माइक टॅप करा...';
      if (lang === 'bn') return 'কথা বলতে মাইক ট্যাপ করুন...';
      if (lang === 'kn') return 'ಮಾತನಾಡಲು ಮೈಕ್ ಟ್ಯಾಪ್ ಮಾಡಿ...';
      if (lang === 'ta') return 'பேச மைக்கைத் தட்டவும்...';
      if (lang === 'te') return 'మాట్లాడటానికి మైక్‌ని నొక్కండి...';
      if (lang === 'gu') return 'બોલવા માટે માઇક પર ટેપ કરો...';
      if (lang === 'pa') return 'ਬੋਲਣ ਲਈ ਮਾਈਕ ਦਬਾਓ...';
      if (lang === 'ml') return 'സംസാരിക്കാൻ മൈക്ക് ടാപ്പ് ചെയ്യുക...';
      return 'Tap mic to speak...';
  };

  const getLocale = (l: Language) => {
    switch(l) {
      case 'hi': return 'hi-IN';
      case 'mr': return 'mr-IN';
      case 'pa': return 'pa-IN';
      case 'bn': return 'bn-IN';
      case 'ta': return 'ta-IN';
      case 'te': return 'te-IN';
      case 'kn': return 'kn-IN';
      case 'gu': return 'gu-IN';
      case 'ml': return 'ml-IN';
      case 'en': return 'en-IN'; 
      default: return 'en-US';
    }
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
        window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  // --- ROBUST VOICE SELECTION ---
  const speakResponse = (text: string) => {
    stopSpeaking();
    if (!text) return;

    let currentVoices = voices;
    if (currentVoices.length === 0) {
        currentVoices = window.speechSynthesis.getVoices();
        setVoices(currentVoices);
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const targetLocale = getLocale(voiceLang);
    utterance.lang = targetLocale;
    utterance.rate = 0.9; 
    utterance.pitch = 1;
    
    // 1. Exact Locale Match (e.g. 'bn-IN')
    let matchingVoice = currentVoices.find(v => v.lang === targetLocale || v.lang.replace('_', '-') === targetLocale);
    
    // 2. Language Code Match (e.g. 'bn' in 'bn-BD')
    if (!matchingVoice) {
        matchingVoice = currentVoices.find(v => v.lang.startsWith(voiceLang));
    }
    
    // 3. Name Match (e.g. "Google Bangla")
    if (!matchingVoice) {
        const langNames: Record<string, string> = {
            'hi': 'Hindi', 'bn': 'Bengali', 'mr': 'Marathi', 'gu': 'Gujarati',
            'ta': 'Tamil', 'te': 'Telugu', 'kn': 'Kannada', 'ml': 'Malayalam', 'pa': 'Punjabi'
        };
        const name = langNames[voiceLang];
        if (name) {
            matchingVoice = currentVoices.find(v => v.name.toLowerCase().includes(name.toLowerCase()));
        }
    }

    if (matchingVoice) {
        utterance.voice = matchingVoice;
        console.log(`[TTS] Selected voice: ${matchingVoice.name} (${matchingVoice.lang})`);
    } else {
        console.warn(`[TTS] No specific voice found for ${targetLocale}. Using browser default engine for ${targetLocale}.`);
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    
    utterance.onerror = (e: any) => {
        if (e.error === 'interrupted' || e.error === 'canceled') {
            setIsSpeaking(false);
            return;
        }
        console.error("TTS Error:", e);
        if (e.error) console.error("TTS Error Code:", e.error);
        
        setIsSpeaking(false);
        if(navigator.vibrate) navigator.vibrate([50, 50]);
    };

    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    stopSpeaking(); 
    // Haptic feedback on mic tap
    if (navigator.vibrate) navigator.vibrate(50);
    
    if (!('webkitSpeechRecognition' in window)) {
      alert("Voice input requires Chrome/Edge/Samsung Internet.");
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = getLocale(voiceLang);

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript("Listening...");
    };

    recognition.onresult = async (event: any) => {
      const text = event.results[0][0].transcript;
      setTranscript(`"${text}"`);
      setIsListening(false);
      
      if (navigator.vibrate) navigator.vibrate(100);
      await handleQuery(text);
    };

    recognition.onerror = (event: any) => {
      console.error("ASR Error:", event.error);
      setIsListening(false);
      setTranscript("Didn't catch that. Tap to try again.");
    };

    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const handleQuery = async (text: string) => {
    setIsProcessing(true);
    const lower = text.toLowerCase();
    
    // --- ROBOT CONTROL COMMANDS ---
    // Forward
    if (lower.includes('forward') || lower.includes('go') || lower.includes('front') || lower.includes('aage')) {
         onCommand(RobotCommand.FORWARD);
         setResponse("Moving Forward");
         speakResponse(voiceLang === 'hi' ? "आगे बढ़ रहा हूँ" : "Moving Forward");
         setIsProcessing(false);
         return;
    }
    
    // Backward
    if (lower.includes('back') || lower.includes('reverse') || lower.includes('behind') || lower.includes('peeche')) {
         onCommand(RobotCommand.BACKWARD);
         setResponse("Moving Backward");
         speakResponse(voiceLang === 'hi' ? "पीछे जा रहा हूँ" : "Moving Backward");
         setIsProcessing(false);
         return;
    }

    // Left
    if (lower.includes('left') || lower.includes('baaye')) {
         onCommand(RobotCommand.LEFT);
         setResponse("Turning Left");
         speakResponse(voiceLang === 'hi' ? "बाएं मुड़ रहा हूँ" : "Turning Left");
         setIsProcessing(false);
         return;
    }

    // Right
    if (lower.includes('right') || lower.includes('daaye')) {
         onCommand(RobotCommand.RIGHT);
         setResponse("Turning Right");
         speakResponse(voiceLang === 'hi' ? "दाएं मुड़ रहा हूँ" : "Turning Right");
         setIsProcessing(false);
         return;
    }

    // Light
    if (lower.includes('light') || lower.includes('torch') || lower.includes('flash')) {
         onCommand(RobotCommand.Flashlight);
         setResponse("Toggling Light");
         speakResponse(voiceLang === 'hi' ? "लाइट बदल दी गई है" : "Toggling Light");
         setIsProcessing(false);
         return;
    }

    // Stop Command
    if (lower === 'stop' || lower.includes('halt') || lower.includes('ruk') || lower.includes('thamba')) {
        onCommand(RobotCommand.STOP);
        setResponse("Stopping Robot.");
        speakResponse(voiceLang === 'hi' ? "रुक रहा हूँ" : "Emergency Stop Initiated.");
        setIsProcessing(false);
        return;
    }
    
    // System Status
    if (lower.includes('status') || lower.includes('report') || lower.includes('battery') || lower.includes('health')) {
        let statusMsg = '';
        if (voiceLang === 'hi') {
            statusMsg = `प्रणाली ऑनलाइन है। बैटरी ${sensorData.batteryLevel ?? 0} प्रतिशत है। मिट्टी की नमी ${sensorData.soilMoisture} प्रतिशत है।`;
        } else if (voiceLang === 'mr') {
             statusMsg = `सिस्टम ऑनलाइन आहे. बॅटरी ${sensorData.batteryLevel ?? 0} टक्के आहे. मातीची ओलावा ${sensorData.soilMoisture} टक्के आहे.`;
        } else {
            statusMsg = `System is online. Battery is at ${sensorData.batteryLevel ?? 0}%. Soil moisture is ${sensorData.soilMoisture}%.`;
        }
        
        setResponse(statusMsg);
        speakResponse(statusMsg);
        setIsProcessing(false);
        return;
    }

    try {
      const reply = await chatWithAgriBot(text, voiceLang, sensorData, lastAnalysis, apiKey);
      setResponse(reply);
      speakResponse(reply);
    } catch (e) {
      setResponse("Connection error or API Key invalid. Please check settings.");
      speakResponse("Sorry, I faced a network error or invalid API Key.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end sm:justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-900 w-full sm:max-w-md sm:mx-auto rounded-[2rem] p-6 shadow-2xl flex flex-col max-h-[85vh] transition-colors relative border border-gray-100 dark:border-gray-800">
        
        <div className="flex justify-between items-center mb-6 shrink-0">
          <div>
              <h3 className="font-bold text-xl text-gray-800 dark:text-gray-100 flex items-center gap-2">
                Voice Assistant
              </h3>
              <div className="flex items-center mt-1 bg-gray-100 dark:bg-gray-800 rounded-lg px-2 py-1">
                  <span className="text-[10px] text-gray-400 mr-2 uppercase tracking-wide font-bold">Language</span>
                  <select 
                     value={language}
                     onChange={(e) => onLanguageChange(e.target.value as Language)}
                     className="text-xs font-bold text-green-600 dark:text-green-400 bg-transparent border-none outline-none cursor-pointer"
                  >
                      <option value="en">English (IN)</option>
                      <option value="hi">हिंदी (Hindi)</option>
                      <option value="mr">मराठी (Marathi)</option>
                      <option value="pa">ਪੰਜਾਬੀ (Punjabi)</option>
                      <option value="gu">ગુજરાતી (Gujarati)</option>
                      <option value="bn">বাংলা (Bengali)</option>
                      <option value="ta">தமிழ் (Tamil)</option>
                      <option value="te">తెలుగు (Telugu)</option>
                      <option value="kn">ಕನ್ನಡ (Kannada)</option>
                      <option value="ml">മലയാളം (Malayalam)</option>
                  </select>
              </div>
          </div>
          <button onClick={() => { stopSpeaking(); onClose(); }} className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 bg-gray-50 dark:bg-gray-800/50 rounded-3xl p-6 mb-6 flex flex-col items-center justify-center gap-4 overflow-hidden relative min-h-[200px]">
           
           {isSpeaking && (
               <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                  <div className="flex gap-1 items-end h-32">
                      {[...Array(12)].map((_, i) => (
                          <div 
                            key={i} 
                            className="w-2 bg-green-500 rounded-full animate-[slideUp_0.5s_ease-in-out_infinite_alternate]"
                            style={{ 
                                height: `${Math.random() * 60 + 20}%`, 
                                animationDuration: `${0.4 + Math.random() * 0.4}s` 
                            }}
                          ></div>
                      ))}
                  </div>
               </div>
           )}

           {isProcessing ? (
               <div className="flex flex-col items-center gap-4 animate-pulse">
                   <div className="w-16 h-16 rounded-full border-4 border-green-500 border-t-transparent animate-spin"></div>
                   <p className="text-sm font-medium text-green-600 dark:text-green-400">Processing...</p>
               </div>
           ) : (
               <>
                 <p className={`text-center font-medium transition-all ${isListening ? 'text-gray-400 text-lg' : 'text-gray-500 italic text-base'}`}>
                    {transcript}
                 </p>
                 {response && (
                    <div className="w-full mt-2 animate-slide-up">
                        <p className="text-center text-xl md:text-2xl font-medium text-gray-800 dark:text-gray-100 leading-relaxed">
                            {response}
                        </p>
                    </div>
                 )}
               </>
           )}
        </div>

        <div className="flex flex-col items-center shrink-0 justify-center pb-2">
          {isSpeaking ? (
               <button
                 onClick={stopSpeaking}
                 className="group relative w-20 h-20 flex items-center justify-center transition-all"
               >
                 <div className="absolute inset-0 bg-red-500 rounded-2xl rotate-3 opacity-20 animate-ping"></div>
                 <div className="relative w-20 h-20 bg-red-500 rounded-2xl shadow-xl shadow-red-200 dark:shadow-red-900/40 flex items-center justify-center active:scale-95 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8 text-white">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
                    </svg>
                 </div>
                 <span className="absolute -bottom-8 text-xs font-bold text-red-500 uppercase tracking-widest">Stop</span>
               </button>
          ) : (
              <button
                onClick={startListening}
                disabled={isListening || isProcessing}
                className={`group relative w-20 h-20 flex items-center justify-center transition-all ${isListening ? 'scale-110' : 'hover:scale-105 active:scale-95'}`}
              >
                {isListening && <div className="absolute inset-0 bg-green-500 rounded-full opacity-20 animate-ping"></div>}
                <div className={`relative w-20 h-20 rounded-full shadow-xl flex items-center justify-center transition-colors ${
                    isListening 
                    ? 'bg-white border-4 border-green-500' 
                    : 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-200 dark:shadow-green-900/40'
                }`}>
                    {isListening ? (
                         <div className="flex gap-1 h-6 items-center">
                             <div className="w-1 bg-green-500 h-full animate-music"></div>
                             <div className="w-1 bg-green-500 h-2/3 animate-music delay-75"></div>
                             <div className="w-1 bg-green-500 h-full animate-music delay-150"></div>
                         </div>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-white">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                        </svg>
                    )}
                </div>
                {!isListening && <span className="absolute -bottom-8 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Tap to Speak</span>}
              </button>
          )}
        </div>
      </div>
    </div>
  );
};
