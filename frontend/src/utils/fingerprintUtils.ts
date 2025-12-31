// Fingerprint utility for device identification
// Install: npm install @fingerprintjs/fingerprintjs

import FingerprintJS from '@fingerprintjs/fingerprintjs';

let fpPromise: Promise<any> | null = null;

// Initialize FingerprintJS (only once)
export const initFingerprint = async () => {
  if (!fpPromise) {
    fpPromise = FingerprintJS.load();
  }
  return fpPromise;
};

// Get visitor fingerprint
export const getFingerprint = async (): Promise<string> => {
  try {
    const fp = await initFingerprint();
    const result = await fp.get();
    return result.visitorId;
  } catch (error) {
    console.error('Error getting fingerprint:', error);
    // Fallback to a random ID stored in localStorage
    let fallbackId = localStorage.getItem('fallback_fingerprint');
    if (!fallbackId) {
      fallbackId = `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('fallback_fingerprint', fallbackId);
    }
    return fallbackId;
  }
};

// Store fingerprint in localStorage for quick access
export const getCachedFingerprint = (): string | null => {
  return localStorage.getItem('user_fingerprint');
};

export const cacheFingerprint = (fingerprint: string) => {
  localStorage.setItem('user_fingerprint', fingerprint);
};

// Get or generate fingerprint
export const getOrCreateFingerprint = async (): Promise<string> => {
  const cached = getCachedFingerprint();
  if (cached) {
    return cached;
  }
  
  const fingerprint = await getFingerprint();
  cacheFingerprint(fingerprint);
  return fingerprint;
};