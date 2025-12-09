
import React from 'react';
import { AnalysisResult } from '../types';

interface Props {
  result: AnalysisResult | null;
  onClose: () => void;
}

export const AnalysisResultModal: React.FC<Props> = ({ result, onClose }) => {
  if (!result) return null;

  const handleWhatsAppShare = () => {
    const text = `🚨 KisanBot Report 🚨\n\nCrop: ${result.crop || 'Unknown'}\nCondition: ${result.diseaseName}\nConfidence: ${result.confidence}%\n\nAdvice: ${result.hindiAdvice}\n\nFertilizer: ${result.fertilizerRecommendation}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
        
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {result.diseaseName}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-1 text-xs font-bold rounded-full ${result.isHealthy ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {result.isHealthy ? 'Healthy' : 'Diseased'}
              </span>
              <span className="text-xs text-gray-500">
                Confidence: {result.confidence}%
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Diagnosis */}
        <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-4 rounded-r-md">
          <h3 className="text-xs font-bold text-orange-800 uppercase mb-1">
            Diagnosis & Advice
          </h3>
          <p className="text-base font-medium text-gray-800 leading-relaxed font-serif">
            {result.hindiAdvice}
          </p>
        </div>

        {/* Fertilizer/Soil Action */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded-r-md">
          <h3 className="text-xs font-bold text-blue-800 uppercase mb-1">
            Soil & Fertilizer Plan
          </h3>
          <p className="text-base font-medium text-gray-800 leading-relaxed font-serif">
            {result.fertilizerRecommendation}
          </p>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={handleWhatsAppShare}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.592 2.654-.698c.93.509 1.937.783 2.806.784 3.169 0 5.765-2.586 5.766-5.766.001-3.181-2.575-5.765-5.766-5.765zm9.969 8l-6.096-10.158c-1.684-2.808-5.444-3.71-8.242-2.03-2.802 1.682-3.708 5.442-2.029 8.24l.023.037c-1.127.697-2.906 2.053-2.844 2.155.062.103 1.258 1.96 2.454 2.859-.441 1.579-.199 4.39.294 5.309.832 1.551 2.932 2.529 4.756 2.062.909-.233 3.655-.992 5.06-1.748 1.135.805 3.029 1.905 3.125 1.745.096-.159 1.458-1.928 2.155-3.055 2.768 1.737 6.463.87 8.163-1.947 1.696-2.812.827-6.505-1.975-8.192zm-5.697 4.295l-.348 2.248-2.228-.352c-2.344-.371-4.148-1.34-5.385-2.578-1.238-1.237-2.207-3.042-2.579-5.385l-.351-2.228 2.249-.348c2.325-.36 4.19.068 5.584 1.462 1.393 1.393 1.82 3.258 1.461 5.582z"/></svg>
             Share on WhatsApp
          </button>
          <button 
            onClick={onClose}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
