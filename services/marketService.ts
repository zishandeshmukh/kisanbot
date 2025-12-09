
import { MandiRecord } from "../types";

// Mock Data Generator for Mandi Prices
export const fetchMandiPrices = async (location: string, cropType: string): Promise<MandiRecord[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));

  const basePrice = getBasePrice(cropType);
  const markets = getNearbyMarkets(location);
  
  return markets.map((market, index) => {
    // Generate price variations based on market name hash to keep it consistent-ish but random
    // We use the day of the month to make prices stable for at least a day
    const daySeed = new Date().getDate();
    const randomFactor = Math.abs(Math.sin(daySeed + index + basePrice)); 
    
    // Variation between -5% to +5%
    const variation = Math.floor((randomFactor * (basePrice * 0.1)) - (basePrice * 0.05));
    const modal = Math.round(basePrice + variation);
    
    return {
      id: `${market.replace(/\s/g, '')}-${index}-${Date.now()}`,
      crop: cropType,
      variety: 'Desi/Local',
      marketName: market,
      minPrice: modal - 100 - Math.floor(Math.random() * 150),
      maxPrice: modal + 100 + Math.floor(Math.random() * 150),
      modalPrice: modal,
      date: new Date().toLocaleDateString('en-IN'),
      trend: randomFactor > 0.5 ? 'up' : 'down'
    };
  });
};

const getBasePrice = (crop: string): number => {
  const c = (crop || "").toLowerCase();
  if (c.includes('wheat') || c.includes('gehu')) return 2275;
  if (c.includes('rice') || c.includes('paddy')) return 2183;
  if (c.includes('cotton')) return 6620;
  if (c.includes('onion')) return 1800;
  if (c.includes('tomato')) return 3500;
  if (c.includes('potato')) return 1200;
  if (c.includes('maize')) return 2090;
  if (c.includes('soybean')) return 4600;
  if (c.includes('sugarcane')) return 315;
  if (c.includes('chilli')) return 12000;
  if (c.includes('turmeric') || c.includes('haldi')) return 7000;
  if (c.includes('gram') || c.includes('chana')) return 5400;
  return 2500;
};

const getNearbyMarkets = (loc: string): string[] => {
  let cleanLoc = "";
  
  if (loc && typeof loc === 'string') {
      // Split by comma to get city/village name (e.g., "Nagpur, Maharashtra" -> "Nagpur")
      cleanLoc = loc.split(',')[0].trim();
  }

  // Handle generic GPS or empty strings
  if (!cleanLoc || cleanLoc === "GPS Detected Location" || cleanLoc === "Unknown" || cleanLoc === "India") {
      const majorMarkets = [
        "Azadpur Mandi (Delhi)", 
        "Vashi APMC (Mumbai)", 
        "Pune Market Yard", 
        "Indore Mandi", 
        "Nashik Onion Market",
        "Guntur Chilli Yard",
        "Jaipur Mandi"
      ];
      return majorMarkets.sort(() => 0.5 - Math.random()).slice(0, 5);
  }

  // Generate localized market names dynamically
  return [
      `${cleanLoc} APMC`,
      `${cleanLoc} Main Mandi`,
      `Krishi Upaj Mandi ${cleanLoc}`,
      `${cleanLoc} Vegetable Market`,
      `District Hub near ${cleanLoc}`
  ];
};
