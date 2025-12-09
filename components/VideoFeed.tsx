
import React, { useRef, useState, useEffect } from 'react';

interface VideoFeedProps {
  streamUrl: string;
  onCapture: (base64Image: string) => void;
  onCaptureStart?: () => void;
  isAnalyzing: boolean;
  triggerCapture?: number; // New prop to remote trigger
  demoMode?: boolean;
}

export const VideoFeed: React.FC<VideoFeedProps> = ({ streamUrl, onCapture, onCaptureStart, isAnalyzing, triggerCapture, demoMode = false }) => {
  const [imgSrc, setImgSrc] = useState<string>('https://picsum.photos/640/480');
  const [error, setError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [flash, setFlash] = useState(false);
  
  // 'anonymous' tries to load with CORS (needed for canvas capture). 
  // undefined loads without CORS (video works, but capture might taint canvas).
  const [corsMode, setCorsMode] = useState<'anonymous' | undefined>('anonymous');
  
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  // Reset state when streamUrl or demoMode changes
  useEffect(() => {
    if (!demoMode) {
        if (streamUrl) {
          setIsLoading(true);
          setError(false);
          setCorsMode('anonymous'); 
          setImgSrc(streamUrl);
        }
    } else {
        // In demo mode, we don't use the img tag for streaming, but we might use it for a static fallback if canvas fails
        setIsLoading(false);
        setError(false);
    }
  }, [streamUrl, demoMode]);

  // Demo Mode Animation Loop
  useEffect(() => {
      if (demoMode && canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (!ctx) return;

          let offset = 0;
          const draw = () => {
             offset = (offset + 2) % 480;
             
             // 1. Draw Background (Leafy Green)
             const gradient = ctx.createLinearGradient(0, 0, 0, 480);
             gradient.addColorStop(0, '#2E7D32');
             gradient.addColorStop(1, '#1B5E20');
             ctx.fillStyle = gradient;
             ctx.fillRect(0, 0, 640, 480);
             
             // 2. Draw Simple Veins
             ctx.strokeStyle = '#43A047';
             ctx.lineWidth = 4;
             ctx.beginPath();
             ctx.moveTo(320, 480);
             ctx.quadraticCurveTo(320, 240, 320 + Math.sin(offset * 0.02) * 20, 0);
             ctx.stroke();
             
             // 3. Draw Scanning Line
             ctx.strokeStyle = 'rgba(100, 255, 100, 0.5)';
             ctx.lineWidth = 2;
             ctx.beginPath();
             ctx.moveTo(0, offset);
             ctx.lineTo(640, offset);
             ctx.stroke();
             
             // 4. Text Overlay
             ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
             ctx.font = 'bold 20px monospace';
             ctx.fillText("DEMO SIMULATION MODE", 20, 40);
             ctx.font = '12px monospace';
             ctx.fillText(new Date().toLocaleTimeString(), 20, 60);
             
             animationRef.current = requestAnimationFrame(draw);
          };
          
          draw();
      }
      
      return () => {
          if (animationRef.current) cancelAnimationFrame(animationRef.current);
      };
  }, [demoMode]);

  // Handle Remote Trigger
  useEffect(() => {
      if (triggerCapture && triggerCapture > 0) {
          handleCapture();
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerCapture]);

  const drawSimulation = (ctx: CanvasRenderingContext2D) => {
    // 1. Draw Green Background (Leaf)
    const gradient = ctx.createLinearGradient(0, 0, 0, 480);
    gradient.addColorStop(0, '#4CAF50');
    gradient.addColorStop(1, '#2E7D32');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 640, 480);
    
    // 2. Draw Veins
    ctx.strokeStyle = '#81C784';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(320, 480);
    ctx.quadraticCurveTo(320, 240, 320, 0);
    ctx.moveTo(320, 240);
    ctx.quadraticCurveTo(100, 150, 50, 100);
    ctx.moveTo(320, 300);
    ctx.quadraticCurveTo(500, 200, 580, 150);
    ctx.stroke();

    // 3. Draw "Disease Spots" (Brown circles) for Gemini to detect
    ctx.fillStyle = '#795548';
    for(let i=0; i<8; i++) {
        ctx.beginPath();
        const x = 100 + Math.random() * 440;
        const y = 100 + Math.random() * 280;
        const r = 15 + Math.random() * 25;
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#5D4037';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    // 4. Overlay Metadata
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('KisanBot Simulation Mode', 20, 30);
    ctx.font = '12px sans-serif';
    ctx.fillText(corsMode ? 'Camera Unavailable' : 'Stream Security Restricted', 20, 50);
  };

  const handleCapture = async () => {
    if (onCaptureStart) onCaptureStart();
    setFlash(true);
    setTimeout(() => setFlash(false), 150);
    
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        let finalDataUrl = '';
        
        if (demoMode) {
            // In Demo mode, specifically draw a "diseased leaf" simulation for the user to analyze
            drawSimulation(ctx);
            finalDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        } else {
            // Try to draw from image first
            if (imgRef.current && !error && !isLoading) {
                try {
                    ctx.drawImage(imgRef.current, 0, 0, 640, 480);
                    try {
                        finalDataUrl = canvas.toDataURL('image/jpeg', 0.85);
                    } catch (taintError) {
                        console.warn("Canvas tainted by video stream. Falling back to simulation.", taintError);
                        drawSimulation(ctx);
                        finalDataUrl = canvas.toDataURL('image/jpeg', 0.85);
                    }
                } catch (drawError) {
                    console.error("Error drawing image", drawError);
                    drawSimulation(ctx);
                    finalDataUrl = canvas.toDataURL('image/jpeg', 0.85);
                }
            } else {
                drawSimulation(ctx);
                finalDataUrl = canvas.toDataURL('image/jpeg', 0.85);
            }
        }

        setTimeout(() => {
            onCapture(finalDataUrl.split(',')[1]);
        }, 200);

      } else {
        throw new Error("Canvas context not supported");
      }
    } catch (e) {
      console.error("Capture generation failed:", e);
      alert("Capture system error. Please reload.");
    }
  };

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden group">
      {/* Flash Effect */}
      <div className={`absolute inset-0 bg-white z-50 pointer-events-none transition-opacity duration-150 ${flash ? 'opacity-100' : 'opacity-0'}`}></div>

      {/* Live Badge */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-md border border-white/10">
          <div className={`w-2 h-2 rounded-full ${error && !demoMode ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`}></div>
          <span className={`text-[10px] font-mono font-bold tracking-wider ${error && !demoMode ? 'text-red-400' : 'text-white'}`}>
             {demoMode ? 'DEMO MODE' : error ? 'OFFLINE' : (corsMode === 'anonymous' ? 'LIVE FEED' : 'LIVE (NO CAPTURE)')}
          </span>
      </div>

      {/* Loading State */}
      {isLoading && !error && !demoMode && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mb-2"></div>
            <span className="text-gray-400 text-xs">Connecting Signal...</span>
          </div>
        </div>
      )}

      {demoMode ? (
         <canvas 
            ref={canvasRef}
            width={640}
            height={480}
            className="w-full h-full object-contain"
         />
      ) : error ? (
        <div className="absolute inset-0 flex items-center justify-center text-white/70 flex-col p-4 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mb-2 text-gray-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p className="mb-1 font-semibold text-gray-400">Video Signal Lost</p>
          <p className="text-xs text-gray-600">Check connection in settings</p>
        </div>
      ) : (
        <img
          ref={imgRef}
          src={imgSrc}
          alt="Robot Stream"
          crossOrigin={corsMode} // Important for canvas
          className={`w-full h-full object-contain transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          onLoad={() => setIsLoading(false)}
          onError={() => { 
            // If secure load fails, try insecure load (allows viewing but breaks capture)
            if (corsMode === 'anonymous') {
                console.warn("Secure stream load failed. Retrying without CORS headers.");
                setCorsMode(undefined);
            } else {
                setError(true); 
                setIsLoading(false); 
            }
          }}
        />
      )}

      {/* Grid Overlay (Subtle) */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/2 left-0 w-full h-px bg-white/50 -translate-y-1/2"></div>
        <div className="absolute top-0 left-1/2 w-px h-full bg-white/50 -translate-x-1/2"></div>
      </div>

      {/* Capture Button */}
      <button
        onClick={handleCapture}
        disabled={isAnalyzing}
        className={`absolute bottom-4 right-4 text-green-700 p-3 rounded-full shadow-xl active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 z-20 backdrop-blur-sm bg-white/90 hover:bg-green-50`}
        aria-label="Take Photo"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
        </svg>
      </button>
      
      {isAnalyzing && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-30 backdrop-blur-sm">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent mb-4"></div>
              <span className="text-green-400 font-bold tracking-widest text-sm uppercase">AI Analyzing...</span>
            </div>
        </div>
      )}
    </div>
  );
};
