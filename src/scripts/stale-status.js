import { effectiveStatus } from '../lib/status.js';

// Marks a repeater "Status unknown" in the browser when its last check is over 30 days old.
class MmRepeaters extends HTMLElement {
  connectedCallback() {
    const today = new Date();
    for (const li of this.querySelectorAll('li[data-last-checked]')) {
      const { stale } = effectiveStatus({ status: li.dataset.status, lastChecked: li.dataset.lastChecked }, today);
      if (!stale) continue;
      const tag = li.querySelector('[data-tag]');
      if (!tag) continue;
      tag.textContent = 'Status unknown';
      tag.className = 'mm-tag mm-tag--unknown';
    }
  }
}
if (!customElements.get('mm-repeaters')) customElements.define('mm-repeaters', MmRepeaters);
