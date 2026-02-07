// Approximate coordinates for Ghana cities/towns used for facility mapping
// These are centroids, not exact locations

export const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  // Greater Accra
  "accra": { lat: 5.6037, lng: -0.1870 },
  "tema": { lat: 5.6698, lng: -0.0166 },
  "dansoman": { lat: 5.5360, lng: -0.2500 },
  "osu": { lat: 5.5560, lng: -0.1820 },
  "eastlegon": { lat: 5.6340, lng: -0.1570 },
  "cantonments": { lat: 5.5760, lng: -0.1740 },
  "adabraka": { lat: 5.5670, lng: -0.2100 },
  "tantrahll": { lat: 5.6380, lng: -0.2350 },
  "abokobi": { lat: 5.7070, lng: -0.1530 },
  "madina": { lat: 5.6760, lng: -0.1650 },
  "lapaz": { lat: 5.6090, lng: -0.2410 },
  "spintex": { lat: 5.6370, lng: -0.0580 },
  
  // Western Region
  "takoradi": { lat: 4.8845, lng: -1.7554 },
  "sekondi": { lat: 4.9340, lng: -1.7137 },
  "tarkwa": { lat: 5.3040, lng: -1.9940 },
  "apremdo": { lat: 4.9280, lng: -1.7520 },
  "effiakuma": { lat: 4.9170, lng: -1.7600 },
  
  // Ashanti
  "kumasi": { lat: 6.6885, lng: -1.6244 },
  "obuasi": { lat: 6.2060, lng: -1.6630 },
  "ejisu": { lat: 6.7280, lng: -1.4650 },
  "abuakwa": { lat: 6.7470, lng: -1.5430 },
  "bekwai": { lat: 6.4560, lng: -1.5730 },
  "mampong": { lat: 7.0640, lng: -1.4000 },
  "asokwa": { lat: 6.6620, lng: -1.6230 },
  
  // Central Region
  "capecoast": { lat: 5.1053, lng: -1.2466 },
  "elmina": { lat: 5.0847, lng: -1.3486 },
  "winneba": { lat: 5.3531, lng: -0.6250 },
  "agona": { lat: 5.5650, lng: -0.7330 },
  "saltpond": { lat: 5.2090, lng: -1.0600 },
  
  // Eastern Region
  "koforidua": { lat: 6.0940, lng: -0.2570 },
  "nkawkaw": { lat: 6.5500, lng: -0.7670 },
  "nsawam": { lat: 5.8080, lng: -0.3500 },
  "suhum": { lat: 6.0400, lng: -0.4500 },
  "akim": { lat: 6.0500, lng: -0.7500 },
  
  // Volta Region
  "ho": { lat: 6.6000, lng: 0.4700 },
  "keta": { lat: 5.9200, lng: 0.9900 },
  "hohoe": { lat: 7.1510, lng: 0.4740 },
  "kpando": { lat: 6.9950, lng: 0.2970 },
  "aflao": { lat: 6.1200, lng: 1.1940 },
  
  // Northern Region
  "tamale": { lat: 9.4075, lng: -0.8533 },
  "yendi": { lat: 9.4450, lng: -0.0090 },
  "bimbilla": { lat: 8.8540, lng: 0.0530 },
  "savelugu": { lat: 9.6240, lng: -0.8250 },
  
  // Upper East
  "bolgatanga": { lat: 10.7870, lng: -0.8510 },
  "navrongo": { lat: 10.8940, lng: -1.0920 },
  "bawku": { lat: 11.0590, lng: -0.2420 },
  "zuarungu": { lat: 10.7830, lng: -0.8160 },
  
  // Upper West
  "wa": { lat: 10.0601, lng: -2.5099 },
  "lawra": { lat: 10.6380, lng: -2.9050 },
  "tumu": { lat: 10.8880, lng: -1.9790 },
  "nadowli": { lat: 10.3910, lng: -2.6610 },
  
  // Bono / Brong Ahafo
  "sunyani": { lat: 7.3349, lng: -2.3123 },
  "techiman": { lat: 7.5830, lng: -1.9340 },
  "dormaa": { lat: 7.4180, lng: -2.7790 },
  "berekum": { lat: 7.4560, lng: -2.5860 },
  "wenchi": { lat: 7.7390, lng: -2.1000 },
  "kintampo": { lat: 8.0560, lng: -1.7290 },
  "nkoranza": { lat: 7.5560, lng: -1.7110 },
  
  // Oti Region
  "dambai": { lat: 8.0690, lng: 0.1790 },
  "jasikan": { lat: 7.4080, lng: 0.4590 },
  "nkwanta": { lat: 8.2570, lng: 0.5210 },
  
  // Savannah Region
  "damongo": { lat: 9.0830, lng: -1.8180 },
  "bole": { lat: 9.0330, lng: -2.4830 },
  "salaga": { lat: 8.5510, lng: -0.5210 },
  
  // Ahafo Region
  "goaso": { lat: 6.8030, lng: -2.5170 },
  
  // North East Region
  "nalerigu": { lat: 10.5250, lng: -0.3670 },
  "walewale": { lat: 10.3550, lng: -0.7970 },
  
  // Region centroids (fallback)
  "western": { lat: 5.1, lng: -2.0 },
  "greateraccra": { lat: 5.6, lng: -0.2 },
  "ashanti": { lat: 6.7, lng: -1.6 },
  "central": { lat: 5.5, lng: -1.0 },
  "eastern": { lat: 6.3, lng: -0.5 },
  "volta": { lat: 6.8, lng: 0.5 },
  "oti": { lat: 8.0, lng: 0.4 },
  "northern": { lat: 9.5, lng: -1.0 },
  "uppereast": { lat: 10.8, lng: -0.8 },
  "upperwest": { lat: 10.3, lng: -2.3 },
  "bono": { lat: 7.5, lng: -2.3 },
  "bonoeast": { lat: 7.8, lng: -1.5 },
  "ahafo": { lat: 6.9, lng: -2.4 },
  "savannah": { lat: 9.0, lng: -1.8 },
  "northeast": { lat: 10.4, lng: -0.5 },
  "westernnorth": { lat: 6.2, lng: -2.4 },
};

// Try to find coordinates for a facility based on its name or region
export function findFacilityCoords(
  facilityName: string,
  region: string
): { lat: number; lng: number } | null {
  const nameLower = facilityName.toLowerCase().replace(/[^a-z]/g, "");
  const regionLower = region.toLowerCase().replace(/[^a-z]/g, "");
  
  // Try to find a city name in the facility name
  for (const [city, coords] of Object.entries(CITY_COORDS)) {
    if (nameLower.includes(city)) {
      // Add small random offset to prevent overlapping
      return {
        lat: coords.lat + (Math.random() - 0.5) * 0.05,
        lng: coords.lng + (Math.random() - 0.5) * 0.05,
      };
    }
  }
  
  // Fall back to region centroid
  const regionCoords = CITY_COORDS[regionLower];
  if (regionCoords) {
    // Add larger random offset for region fallback
    return {
      lat: regionCoords.lat + (Math.random() - 0.5) * 0.3,
      lng: regionCoords.lng + (Math.random() - 0.5) * 0.3,
    };
  }
  
  return null;
}
