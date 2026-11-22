export function radioCli({ frequencyMHz, bandwidthKHz, spreadingFactor, codingRate }) {
  return `set radio ${frequencyMHz},${bandwidthKHz},${spreadingFactor},${codingRate}`;
}
