
export interface AnalysisResult {
  diseaseName: string;
  confidence: number;
  hindiAdvice: string;
  fertilizerRecommendation: string;
  isHealthy: boolean;
  timestamp: number;
  crop?: string; 
  imageUrl?: string; 
}

export enum RobotCommand {
  FORWARD = 'F',
  BACKWARD = 'B',
  LEFT = 'L',
  RIGHT = 'R',
  STOP = 'S',
  Analyze = 'A',
  Flashlight = 'LGT',
  Auto = 'AUTO',
  DEFENSE = 'DEF'
}

export interface LocationConfig {
  mode: 'auto' | 'manual';
  latitude: number;
  longitude: number;
  address: string;
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  rainForecast24h: number; // mm of rain expected
  isRainingNow: boolean;
  weatherCode: number; // WMO code
  nextRainHour?: number; // Hours until rain
  sunrise: string;
  sunset: string;
}

export interface IrrigationAdvice {
  litersPerAcre: number;
  action: 'IRRIGATE' | 'WAIT' | 'DRAIN';
  reason: string;
}

export interface AppSettings {
  streamUrl: string;
  controlUrl: string; 
  theme: 'light' | 'dark';
  targetMoisture: number;
  plantType: string; 
  plantAge: string;
  location: LocationConfig;
  fieldSizeAcres: number;
  demoMode: boolean;
  apiKey: string; // Added for custom API Key override
}

export interface SensorData {
  temperature: number;
  humidity: number;
  soilMoisture: number;
  obstacleDetected?: boolean;
  batteryLevel?: number;
}

export interface SensorHistoryPoint {
  timestamp: number;
  soilMoisture: number;
  humidity: number;
}

export interface OfflineCapture {
  id: number;
  base64Image: string;
  sensorData: SensorData;
  timestamp: number;
  crop?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: number;
}

export interface MandiRecord {
  id: string;
  crop: string;
  variety: string;
  marketName: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  date: string;
  trend: 'up' | 'down' | 'stable';
}

export interface DiaryEntry {
  id: string;
  timestamp: number;
  type: 'disease' | 'water' | 'fertilizer' | 'harvest' | 'note' | 'market';
  title: string;
  description: string;
  image?: string;
}

export type Language = 'en' | 'hi' | 'mr' | 'pa' | 'bn' | 'ta' | 'te' | 'kn' | 'gu' | 'ml';
