
import React, { useState, useEffect, useRef } from 'react';
import { Language, SensorData, AnalysisResult, ChatMessage } from '../types';
import { chatWithAgriBot } from '../services/geminiService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  sensorData: SensorData;
  lastAnalysis: AnalysisResult | null;
  onLanguageChange: (lang: Language) => void;
  apiKey?: string;
}

export const ChatAssistant: React.FC<Props> = ({ isOpen, onClose, language, sensorData, lastAnalysis, onLanguageChange, apiKey }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', sender: 'bot', text: 'Namaste! How can I help you with your farm today?', timestamp: Date.now() }
  ]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, isProcessing]);

  useEffect(() => {
    const loadVoices = () => {
      const avail = window.speechSynthesis.getVoices();
      if(avail.length > 0) setVoices(avail);
    };
    loadVoices();
    if(window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  const getSpeechLocale = (l: Language) => {
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
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
  };

  const speakText = (text: string) => {
      stopSpeaking();
      if (!isAudioEnabled) return;
      
      let currentVoices = voices;
      if (currentVoices.length === 0) {
          currentVoices = window.speechSynthesis.getVoices();
          setVoices(currentVoices);
      }

      const utterance = new SpeechSynthesisUtterance(text);
      const targetLocale = getSpeechLocale(language);
      utterance.lang = targetLocale;
      utterance.rate = 1.0;
      
      let matchingVoice = currentVoices.find(v => v.lang === targetLocale || v.lang.replace('_', '-') === targetLocale);
      
      if (!matchingVoice) {
         matchingVoice = currentVoices.find(v => v.lang.startsWith(language));
      }

      if (!matchingVoice) {
          const langNames: Record<string, string> = {
            'hi': 'Hindi', 'bn': 'Bengali', 'mr': 'Marathi', 'gu': 'Gujarati',
            'ta': 'Tamil', 'te': 'Telugu', 'kn': 'Kannada', 'ml': 'Malayalam', 'pa': 'Punjabi'
          };
          const name = langNames[language];
          if (name) matchingVoice = currentVoices.find(v => v.name.toLowerCase().includes(name.toLowerCase()));
      }

      if (matchingVoice) {
        utterance.voice = matchingVoice;
      } else {
        console.warn(`[Chat] No specific voice found for ${targetLocale}. Using browser default.`);
      }
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
  };

  const handleSend = async () => {
      if (!inputText.trim()) return;
      
      const userText = inputText;
      setInputText(''); // Clear early
      
      const userMsg: ChatMessage = { id: Date.now().toString(), sender: 'user', text: userText, timestamp: Date.now() };
      
      setMessages(prev => {
          const updated = [...prev, userMsg];
          return updated.slice(-20); 
      });
      
      setIsProcessing(true);

      try {
          const reply = await chatWithAgriBot(userText, language, sensorData, lastAnalysis, apiKey);
          
          const botMsg: ChatMessage = { id: (Date.now()+1).toString(), sender: 'bot', text: reply, timestamp: Date.now() };
          setMessages(prev => {
              const updated = [...prev, botMsg];
              return updated.slice(-20);
          });
          speakText(reply);
      } catch (e) {
          console.error("Chat Error", e);
          const errorMsg: ChatMessage = { id: (Date.now()+1).toString(), sender: 'bot', text: "Sorry, connection error or invalid API Key.", timestamp: Date.now() };
          setMessages(prev => [...prev, errorMsg].slice(-20));
      } finally {
          setIsProcessing(false);
      }
  };
  
  const startListening = () => {
      stopSpeaking();
      if (!('webkitSpeechRecognition' in window)) {
          alert("Speech recognition not supported in this browser.");
          return;
      }
      
      const recognition = new (window as any).webkitSpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = getSpeechLocale(language);
      
      recognition.onstart = () => {
          setIsRecording(true);
          if(navigator.vibrate) navigator.vibrate(50);
      };
      
      recognition.onresult = (event: any) => {
          const text = event.results[0][0].transcript;
          setInputText(text);
      };
      
      recognition.onend = () => {
          setIsRecording(false);
      };
      
      recognition.onerror = () => {
          setIsRecording(false);
      };
      
      recognition.start();
  };

  const handleMicDown = () => {
      startListening();
  };
  
  const handleMicUp = () => {
      if (recognitionRef.current) {
          recognitionRef.current.stop();
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-900 w-full max-w-md h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up border border-gray-100 dark:border-gray-800">
            {/* Header */}
            <div className="bg-green-600 p-4 flex justify-between items-center shrink-0 shadow-md z-10">
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                        <span className="text-xl">🤖</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-lg">AgriBot Assistant</h3>
                        <p className="text-green-100 text-xs flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></span>
                            Online
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setIsAudioEnabled(!isAudioEnabled)} className="p-2 text-green-100 hover:bg-white/10 rounded-full transition-colors">
                        {isAudioEnabled ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
                        )}
                    </button>
                    <button onClick={onClose} className="p-2 text-white hover:bg-white/10 rounded-full transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-800/50 scroll-smooth">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-2xl p-3 shadow-sm ${
                            msg.sender === 'user' 
                                ? 'bg-green-600 text-white rounded-br-none' 
                                : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-bl-none'
                        }`}>
                            <p className="text-sm leading-relaxed">{msg.text}</p>
                            <span className={`text-[10px] block mt-1 opacity-70 ${msg.sender === 'user' ? 'text-green-100' : 'text-gray-400'}`}>
                                {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                        </div>
                    </div>
                ))}
                
                {isProcessing && (
                     <div className="flex justify-start animate-fade-in">
                        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-bl-none p-4 shadow-sm flex items-center gap-2">
                             <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                             <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce delay-100"></div>
                             <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce delay-200"></div>
                        </div>
                    </div>
                )}
                
                <div ref={messagesEndRef} />
            </div>

            {/* Stop Speaking Button (Floating) */}
            {isSpeaking && (
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 animate-slide-up">
                    <button 
                        onClick={stopSpeaking}
                        className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full shadow-lg shadow-red-500/30 text-xs font-bold transition-all active:scale-95"
                    >
                        <span className="w-2 h-2 bg-white rounded-sm animate-pulse"></span>
                        STOP SPEAKING
                    </button>
                </div>
            )}

            {/* Input Area */}
            <div className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 p-3 shrink-0 relative">
                {isRecording && (
                    <div className="absolute -top-12 left-0 right-0 flex justify-center pointer-events-none z-10">
                         <div className="bg-green-500/90 text-white px-4 py-1 rounded-full text-xs font-bold animate-pulse shadow-lg backdrop-blur-sm flex items-center gap-2">
                             <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                             Listening...
                         </div>
                    </div>
                )}
                
                <div className="flex items-end gap-2">
                     <div className="relative">
                        <select 
                            value={language} 
                            onChange={(e) => onLanguageChange(e.target.value as Language)}
                            className="appearance-none bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-bold py-3 pl-3 pr-8 rounded-xl outline-none focus:ring-2 focus:ring-green-500 border border-transparent dark:border-gray-700"
                        >
                            <option value="en">EN</option>
                            <option value="hi">HI</option>
                            <option value="mr">MR</option>
                            <option value="bn">BN</option>
                            <option value="pa">PA</option>
                            <option value="gu">GU</option>
                            <option value="ta">TA</option>
                            <option value="te">TE</option>
                            <option value="kn">KN</option>
                            <option value="ml">ML</option>
                        </select>
                         <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>

                    <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center border border-transparent focus-within:border-green-500 focus-within:ring-1 focus-within:ring-green-500 transition-all dark:border-gray-700">
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder={isRecording ? "Listening..." : "Type or speak..."}
                            className="w-full bg-transparent border-none p-3 text-sm focus:ring-0 text-gray-800 dark:text-gray-100 placeholder-gray-400"
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        />
                        <button
                            onMouseDown={handleMicDown}
                            onMouseUp={handleMicUp}
                            onTouchStart={(e) => { e.preventDefault(); handleMicDown(); }}
                            onTouchEnd={(e) => { e.preventDefault(); handleMicUp(); }}
                            className={`p-2 rounded-lg mr-1 transition-all ${isRecording ? 'text-red-500 bg-red-100 dark:bg-red-900/30' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
                        >
                           <div className="relative">
                                {isRecording && <span className="absolute -inset-2 bg-red-400 rounded-full opacity-20 animate-ping"></span>}
                                <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 ${isRecording ? 'scale-110' : ''}`} fill={isRecording ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                           </div>
                        </button>
                    </div>

                    <button 
                        onClick={handleSend}
                        disabled={!inputText.trim() || isProcessing}
                        className="bg-green-600 text-white p-3 rounded-xl shadow-lg shadow-green-200 dark:shadow-green-900/30 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};
