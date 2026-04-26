/**
 * deviceFingerprint.js
 * =====================
 * Generates and persists a stable, unique device ID in localStorage.
 *
 * Strategy:
 *   - On first call: generate a cryptographically random 32-hex-char UUID
 *     and store it under the key 'ampics_device_id'.
 *   - On subsequent calls: return the stored value.
 *
 * This is a SOFT fingerprint (not hardware-level).
 * It survives page refreshes and app restarts, but NOT:
 *   - Browser data clears
 *   - Different browsers on same device
 *   - Incognito mode
 *
 * For academic attendance, this level of binding is appropriate and
 * allows admin to reset via the backend API if a student changes devices.
 */

const STORAGE_KEY = 'ampics_device_id';

/**
 * Get (or generate and store) the device fingerprint.
 * @returns {string} 32-character hex device ID
 */
export function getDeviceId() {
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id || id.length < 16) {
    // Generate 16 random bytes → 32 hex chars
    const arr = new Uint8Array(16);
    window.crypto.getRandomValues(arr);
    id = Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}

/**
 * Collect student GPS coordinates.
 * Returns { lat, lng } or { lat: null, lng: null } on failure.
 *
 * @param {number} timeoutMs - Max wait for GPS fix (default 8000ms)
 * @returns {Promise<{lat: number|null, lng: number|null}>}
 */
export function collectGPS(timeoutMs = 8000) {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported on this browser.');
      resolve({ lat: null, lng: null });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        console.warn('GPS error:', err.message);
        resolve({ lat: null, lng: null });
      },
      { timeout: timeoutMs, enableHighAccuracy: true, maximumAge: 30000 }
    );
  });
}
