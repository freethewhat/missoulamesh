// Coverage squares for the Leaflet map on the Repeaters page.

// One MeshMapper grid square, in degrees.
export const GRID = { lat: 0.0027, lon: 0.00384 };

const round5 = (n) => Math.round(n * 1e5) / 1e5;

// The south-west corner of the grid square that holds this point.
// The tiny epsilon keeps a corner that is already on the grid from slipping into the square below.
export function snapCell(lat, lon) {
  return {
    lat: round5(Math.floor(lat / GRID.lat + 1e-9) * GRID.lat),
    lon: round5(Math.floor(lon / GRID.lon + 1e-9) * GRID.lon),
  };
}

// Snap every cell to its square and keep one per square, in input order.
export function uniqueCells(cells) {
  const byKey = new Map();
  for (const c of cells) {
    const { lat, lon } = snapCell(c.lat, c.lon);
    const key = `${lat},${lon}`;
    if (!byKey.has(key)) byKey.set(key, { lat, lon });
  }
  return [...byKey.values()];
}

// Leaflet bounds for a square: [[south, west], [north, east]].
export function cellBounds({ lat, lon }) {
  return [[lat, lon], [round5(lat + GRID.lat), round5(lon + GRID.lon)]];
}
