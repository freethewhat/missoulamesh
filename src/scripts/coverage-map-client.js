// Browser side of the coverage map on the Repeaters page.
// Leaflet 1.9.4 comes from unpkg (see CoverageMap.astro) and sets window.L. Map tiles come from OpenStreetMap.
// These two hosts are the site's only third-party resources; both are listed in server/csp.js.
import { cellBounds } from '../lib/coverage-map.js';

const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_CREDIT = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const siteTheme = () => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
const cssVar = (el, name) => getComputedStyle(el).getPropertyValue(name).trim();

function squareStyle(el) {
  const c = cssVar(el, '--mm-cov-reached');
  return { color: c, weight: 1.5, fillColor: c, fillOpacity: 0.35, interactive: false };
}

export async function startCoverageMap(el) {
  const L = window.L;
  if (!L) throw new Error('Leaflet did not load');

  const cells = JSON.parse(el.dataset.cells || '[]');
  // Show the map box and the zoom tip now that the map can load. Leaflet needs the box visible to size it.
  el.hidden = false;
  el.closest('figure')?.querySelector('.mm-cov-tip')?.removeAttribute('hidden');

  const map = L.map(el, {
    minZoom: 10,
    maxZoom: 19,
    scrollWheelZoom: false, // the mouse wheel scrolls the page, not the map
  });
  map.attributionControl.setPrefix(false);
  L.tileLayer(TILES, { maxZoom: 19, attribution: TILE_CREDIT }).addTo(map);

  const squares = cells.map((c) => L.rectangle(cellBounds(c), squareStyle(el)));
  const group = L.featureGroup(squares).addTo(map);
  if (squares.length) map.fitBounds(group.getBounds(), { padding: [16, 16] });
  else map.setView([46.87, -113.99], 12);

  // Square colors come from theme variables, so restyle them when the site theme changes.
  // (Dark tiles are a CSS filter in CoverageMap.astro and follow the theme on their own.)
  el.dataset.flavor = siteTheme();
  new MutationObserver(() => {
    if (el.dataset.flavor === siteTheme()) return;
    el.dataset.flavor = siteTheme();
    for (const sq of squares) sq.setStyle(squareStyle(el));
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  el.dataset.ready = 'true';
  return map;
}
