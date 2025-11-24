
import { WeatherData, IrrigationAdvice, SensorData } from "../types";

// Free APIs (No Key Required for basic usage)
const GEO_API = "https://nominatim.openstreetmap.org/search";
const WEATHER_API = "https://api.open-meteo.com/v1/forecast";

export const getCoordinatesFromAddress = async (address: string): Promise<{lat: number, lon: number, name: string} | null> => {
  try {
    const res = await fetch(`${GEO_API}?q=${encodeURIComponent(address)}&format=json&limit=1`);
    const data = await res.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
        name: data[0].display_name
      };
    }
    return null;
  } catch (e) {
    console.error("Geocoding error", e);
    return null;
  }
};

export const getWeatherData = async (lat: number, lon: number): Promise<WeatherData | null> => {
  try {
    // Fetching: Current Temp, Humidity, Rain, Wind, Weather Code + Hourly Rain for forecast
    const url = `${WEATHER_API}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,is_day,precipitation,rain,weather_code,wind_speed_10m&hourly=rain&daily=sunrise,sunset&timezone=auto&forecast_days=2`;
    
    const res = await fetch(url);
    const data = await res.json();
    
    if (!data.current) return null;

    // Calculate next rain
    const currentHour = new Date().getHours();
    const hourlyRain = data.hourly.rain as number[];
    let nextRainHour = -1;
    let rainForecast24h = 0;

    for (let i = currentHour; i < currentHour + 24; i++) {
       const amount = hourlyRain[i] || 0;
       rainForecast24h += amount;
       if (amount > 0.5 && nextRainHour === -1) {
           nextRainHour = i - currentHour; // Hours from now
       }
    }

    return {
      temperature: data.current.temperature_2m,
      humidity: data.current.relative_humidity_2m,
      windSpeed: data.current.wind_speed_10m,
      isRainingNow: data.current.rain > 0,
      weatherCode: data.current.weather_code,
      rainForecast24h,
      nextRainHour: nextRainHour === -1 ? undefined : nextRainHour,
      sunrise: data.daily.sunrise[0],
      sunset: data.daily.sunset[0]
    };
  } catch (e) {
    console.error("Weather fetch error", e);
    return null;
  }
};

export const calculateIrrigation = (
  sensorData: SensorData, 
  weather: WeatherData, 
  cropType: string, 
  fieldSizeAcres: number
): IrrigationAdvice => {
  
  // 1. Check Rain Forecast First (Critical Save)
  if (weather.isRainingNow || weather.rainForecast24h > 5) {
    return {
      litersPerAcre: 0,
      action: 'WAIT',
      reason: `Rain expected (${weather.rainForecast24h.toFixed(1)}mm). Do not water.`
    };
  }

  // 2. Base Water Need per Crop (Liters per acre per day approx)
  // Simplified logic for demo
  let baseNeed = 20000; // General
  const lowerCrop = cropType.toLowerCase();
  
  if (lowerCrop.includes('rice') || lowerCrop.includes('paddy')) baseNeed = 35000;
  else if (lowerCrop.includes('wheat')) baseNeed = 18000;
  else if (lowerCrop.includes('cotton')) baseNeed = 22000;
  else if (lowerCrop.includes('sugarcane')) baseNeed = 40000;
  else if (lowerCrop.includes('maize')) baseNeed = 20000;

  // 3. Adjust by Soil Moisture
  // Target is usually 60-80%. If < 40%, need water.
  let moistureFactor = 0;
  if (sensorData.soilMoisture < 30) moistureFactor = 1.0; // Full water
  else if (sensorData.soilMoisture < 50) moistureFactor = 0.6;
  else if (sensorData.soilMoisture < 70) moistureFactor = 0.3;
  else {
    return {
      litersPerAcre: 0,
      action: 'WAIT',
      reason: `Soil moisture is sufficient (${sensorData.soilMoisture}%).`
    };
  }

  // 4. Adjust by Temperature (Evaporation)
  let tempFactor = 1.0;
  if (weather.temperature > 35) tempFactor = 1.2; // Hot
  else if (weather.temperature < 20) tempFactor = 0.8; // Cool

  const litersNeeded = Math.round(baseNeed * moistureFactor * tempFactor);

  return {
    litersPerAcre: litersNeeded,
    action: 'IRRIGATE',
    reason: `Soil is dry and no rain forecast. Need ~${(litersNeeded).toLocaleString()}L/acre.`
  };
};

// Helper for Weather Icon
export const getWeatherIcon = (code: number, isDay: boolean = true) => {
  // WMO Weather interpretation codes
  // 0: Clear, 1-3: Cloudy, 45-48: Fog, 51-55: Drizzle, 61-65: Rain, 71-77: Snow, 95-99: Storm
  if (code === 0) return isDay ? "☀️" : "🌙";
  if (code <= 3) return "☁️";
  if (code <= 48) return "🌫️";
  if (code <= 67) return "🌧️";
  if (code <= 77) return "❄️";
  if (code >= 95) return "⛈️";
  return "🌡️";
};
