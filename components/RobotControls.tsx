
import React, { useEffect, useState } from 'react';
import { RobotCommand } from '../types';

interface RobotControlsProps {
  onCommand: (cmd: RobotCommand) => void;
  statusText?: string;
  isObstacleDetected?: boolean;
  isLightOn: boolean; // Lifted state
}

export const RobotControls: React.FC<RobotControlsProps> = ({ onCommand, statusText, isObstacleDetected, isLightOn }) => {
  const [activeBtn, setActiveBtn] = useState<RobotCommand | null>(null);
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [isDefenseMode, setIsDefenseMode] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const vibrate = (pattern: number | number[]) => {
    if (navigator.vibrate) navigator.vibrate(pattern);
  };

  // Obstacle Alert Haptics - More urgent pattern
  useEffect(() => {
    if (isObstacleDetected) {
       vibrate([500, 100, 500, 100, 500]);
    }
  }, [isObstacleDetected]);

  const handleStart = (cmd: RobotCommand) => {
    if (isAutoMode) return;
    
    if (isObstacleDetected && cmd !== RobotCommand.BACKWARD && cmd !== RobotCommand.Flashlight && cmd !== RobotCommand.STOP && cmd !== RobotCommand.Analyze && cmd !== RobotCommand.DEFENSE) {
        vibrate([50, 50, 50, 50]); 
        return; 
    }

    // --- HAPTIC FEEDBACK IMPLEMENTATION ---
    switch (cmd) {
        case RobotCommand.FORWARD:
            vibrate(50); // Crisp tap
            break;
        case RobotCommand.BACKWARD:
            vibrate([30, 30]); // Double tap
            break;
        case RobotCommand.LEFT:
        case RobotCommand.RIGHT:
            vibrate(20); // Light tick
            break;
        case RobotCommand.STOP:
            vibrate(60); // Heavy thud
            break;
        case RobotCommand.Analyze:
            vibrate([40, 40]); // Attention
            break;
        case RobotCommand.DEFENSE:
            vibrate([100, 50, 100, 50, 100]); // Alarm pattern
            break;
        default:
            vibrate(20);
    }

    setActiveBtn(cmd);
    onCommand(cmd);
  };

  const handleEnd = () => {
    if (isAutoMode || isDefenseMode) return; // Don't stop on defense release if toggle logic used in parent, but here we treat defense as a toggle
    if (activeBtn && activeBtn !== RobotCommand.Analyze && activeBtn !== RobotCommand.DEFENSE) {
        setActiveBtn(null);
        onCommand(RobotCommand.STOP);
    } else {
        setActiveBtn(null);
    }
    
    if (isListening) {
        setIsListening(false);
    }
  };

  const toggleLight = () => {
      vibrate([20, 50]); // Click-clack
      onCommand(RobotCommand.Flashlight);
  };

  const toggleAutoMode = () => {
      vibrate([50, 50, 100]); // Engage sequence
      const newState = !isAutoMode;
      setIsAutoMode(newState);
      if (newState) {
          onCommand(RobotCommand.Auto);
          setIsDefenseMode(false); // Disable defense if auto starts
      } else {
          onCommand(RobotCommand.STOP);
      }
  };

  const toggleDefenseMode = () => {
      const newState = !isDefenseMode;
      setIsDefenseMode(newState);
      if (newState) {
          setIsAutoMode(false); // Disable auto if defense starts
          handleStart(RobotCommand.DEFENSE);
      } else {
          onCommand(RobotCommand.STOP);
          setActiveBtn(null);
      }
  };

  const startAnalyzeVoice = () => {
      if (!('webkitSpeechRecognition' in window)) {
          handleStart(RobotCommand.Analyze); // Fallback to click
          return;
      }
      
      vibrate(50);
      setIsListening(true);
      
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US'; 
      
      recognition.onresult = (event: any) => {
          const text = event.results[0][0].transcript.toLowerCase();
          console.log("Control Command:", text);
          if (text.includes('analyze') || text.includes('scan') || text.includes('check') || text.includes('capture')) {
              handleStart(RobotCommand.Analyze);
          }
          setIsListening(false);
      };
      
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || isAutoMode) return;
      switch (e.key) {
        case 'ArrowUp': handleStart(RobotCommand.FORWARD); break;
        case 'ArrowDown': handleStart(RobotCommand.BACKWARD); break;
        case 'ArrowLeft': handleStart(RobotCommand.LEFT); break;
        case 'ArrowRight': handleStart(RobotCommand.RIGHT); break;
        case 'l': toggleLight(); break;
        case 'a': handleStart(RobotCommand.Analyze); break;
        case 'd': toggleDefenseMode(); break;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && !isAutoMode) {
            handleEnd();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLightOn, isObstacleDetected, isAutoMode, isDefenseMode]);

  const Button = ({ cmd, label, className, disabled = false, onHold }: { cmd: RobotCommand; label: React.ReactNode; className: string, disabled?: boolean, onHold?: () => void }) => {
    const isActive = activeBtn === cmd;
    const isLocked = disabled || (isObstacleDetected && cmd !== RobotCommand.BACKWARD && cmd !== RobotCommand.Flashlight && cmd !== RobotCommand.Analyze && cmd !== RobotCommand.DEFENSE);
    
    return (
      <button
        onMouseDown={() => { if(!isLocked) onHold ? onHold() : handleStart(cmd); }}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={(e) => { if(!isLocked) onHold ? onHold() : handleStart(cmd); }}
        onTouchEnd={(e) => { e.preventDefault(); handleEnd(); }}
        disabled={isLocked || (isAutoMode && cmd !== RobotCommand.STOP)}
        className={`select-none flex items-center justify-center rounded-2xl transition-all duration-100 touch-manipulation ${
          isActive || (cmd === RobotCommand.Analyze && isListening)
            ? 'bg-green-500 text-white shadow-inner transform scale-95 ring-4 ring-green-200 dark:ring-green-900' 
            : (isLocked || (isAutoMode && cmd !== RobotCommand.STOP))
                ? 'bg-gray-50 text-gray-300 dark:bg-gray-800/50 dark:text-gray-700 cursor-not-allowed border border-gray-100 dark:border-gray-800'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 shadow-md border-b-[6px] border-gray-100 dark:border-gray-900 active:border-b-0 active:translate-y-1.5'
        } ${className}`}
      >
        {label}
      </button>
    );
  };

  const ArrowIcon = ({ rot }: { rot: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className={`w-8 h-8 ${rot}`}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
    </svg>
  );

  return (
    <div className="flex flex-col items-center justify-center w-full py-2 gap-6">
        <div className={`flex items-center gap-3 px-5 py-2 backdrop-blur-sm rounded-full border shadow-sm shrink-0 z-10 transition-colors duration-300 ${
            isDefenseMode ? 'bg-red-600 border-red-500 animate-pulse' :
            isObstacleDetected ? 'bg-red-100 border-red-300 dark:bg-red-900/30 dark:border-red-800' : 
            'bg-white/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700'
        }`}>
            <div className={`w-3 h-3 rounded-full shadow-sm ${
                isDefenseMode ? 'bg-white animate-ping' :
                isAutoMode ? 'bg-purple-500 animate-pulse' : 
                isObstacleDetected ? 'bg-red-600 animate-ping' : 
                activeBtn ? 'bg-blue-500' : 'bg-emerald-500'
            }`}></div>
            <span className={`text-xs font-bold tracking-wider uppercase ${
                isDefenseMode ? 'text-white' :
                isObstacleDetected ? 'text-red-600 dark:text-red-400' : 
                isAutoMode ? 'text-purple-600 dark:text-purple-400' : 
                'text-gray-600 dark:text-gray-300'
            }`}>
                {isDefenseMode ? '🛡️ DEFENSE ACTIVE' : isAutoMode ? 'Auto Patrol' : isObstacleDetected ? 'OBSTACLE DETECTED' : statusText || 'System Ready'}
            </span>
        </div>

        <div className={`relative rounded-[2.5rem] transition-all duration-300 ${isObstacleDetected ? 'p-1' : 'p-0'}`}>
            {isObstacleDetected && (
                <div className="absolute inset-0 bg-red-500/20 rounded-[3rem] animate-pulse z-0 ring-4 ring-red-500 ring-opacity-50 blur-sm"></div>
            )}
            
            <div className={`w-full max-w-[280px] aspect-square mx-auto grid grid-cols-3 grid-rows-3 gap-3 p-3 bg-gray-100/50 dark:bg-gray-800/40 rounded-[2.5rem] border backdrop-blur-md relative shrink-0 shadow-xl z-10 ${isObstacleDetected ? 'border-red-300 dark:border-red-800 shadow-red-500/20' : 'border-gray-200/50 dark:border-gray-700/50'}`}>
                <div className="col-start-1 row-start-1 flex items-center justify-center">
                    <button 
                        onClick={toggleAutoMode}
                        disabled={isObstacleDetected || isDefenseMode}
                        className={`w-12 h-12 rounded-full flex flex-col items-center justify-center transition-all shadow-sm text-[8px] font-bold uppercase active:scale-90 ${isAutoMode ? 'bg-purple-500 text-white ring-4 ring-purple-200 dark:ring-purple-900' : 'bg-white dark:bg-gray-700 text-gray-400 dark:text-gray-500'} ${isObstacleDetected ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
                    </button>
                </div>
                <div className="col-start-2 row-start-1">
                    <Button cmd={RobotCommand.FORWARD} label={isObstacleDetected ? <span className="text-2xl animate-bounce">⛔</span> : <ArrowIcon rot="" />} className="w-full h-full" />
                </div>
                <div className="col-start-3 row-start-1 flex items-center justify-center">
                    <button 
                        onClick={toggleLight}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-sm active:scale-90 ${isLightOn ? 'bg-yellow-400 text-yellow-900 ring-4 ring-yellow-200 dark:ring-yellow-900 shadow-yellow-200' : 'bg-white dark:bg-gray-700 text-gray-400 dark:text-gray-500'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.061-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" /></svg>
                    </button>
                </div>
                <div className="col-start-1 row-start-2">
                    <Button cmd={RobotCommand.LEFT} label={<ArrowIcon rot="-rotate-90" />} className="w-full h-full" />
                </div>
                
                <div className="col-start-2 row-start-2">
                    <Button 
                        cmd={RobotCommand.Analyze} 
                        onHold={startAnalyzeVoice}
                        label={
                            isListening ? (
                                <div className="animate-pulse flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                                </div>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            )
                        } 
                        className="w-full h-full rounded-full" 
                    />
                </div>

                <div className="col-start-3 row-start-2">
                    <Button cmd={RobotCommand.RIGHT} label={<ArrowIcon rot="rotate-90" />} className="w-full h-full" />
                </div>
                <div className="col-start-2 row-start-3">
                    <Button cmd={RobotCommand.BACKWARD} label={<ArrowIcon rot="rotate-180" />} className="w-full h-full" />
                </div>

                {/* Defense Button */}
                <div className="col-start-3 row-start-3 flex items-center justify-center">
                     <button
                        onClick={toggleDefenseMode}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-sm active:scale-95 ${
                            isDefenseMode 
                            ? 'bg-red-600 text-white ring-4 ring-red-300 dark:ring-red-900 shadow-red-500/50' 
                            : 'bg-white dark:bg-gray-700 text-red-500 dark:text-red-400'
                        }`}
                     >
                        <svg xmlns="http://www.w3.org/2000/svg" className={`w-6 h-6 ${isDefenseMode ? 'animate-bounce' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                           <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" />
                        </svg>
                     </button>
                </div>
            </div>
        </div>
    </div>
  );
};
