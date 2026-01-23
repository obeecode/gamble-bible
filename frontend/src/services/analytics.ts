import ReactGA from 'react-ga4';

const TRACKING_ID = import.meta.env.VITE_GA_TRACKING_ID || '';

export const initGA = () => {
  if (TRACKING_ID) {
    ReactGA.initialize(TRACKING_ID, {
      gaOptions: {
        debug_mode: true, // Remove in production
      }
    });
    console.log('Google Analytics initialized');
  } else {
    console.warn('GA Tracking ID not found');
  }
};

// Track page views
export const trackPageView = (path: string) => {
  ReactGA.send({ hitType: 'pageview', page: path });
};

// Track custom events
export const trackEvent = (category: string, action: string, label?: string, value?: number) => {
  ReactGA.event({
    category,
    action,
    label,
    value,
  });
};

// Track roulette spins
export const trackRouletteSpin = (isWin: boolean, prizeAmount?: number) => {
  ReactGA.event({
    category: 'Roulette',
    action: 'Spin',
    label: isWin ? 'Win' : 'Loss',
    value: prizeAmount || 0,
  });
};

// Track user signup from roulette
export const trackRouletteSignup = () => {
  ReactGA.event({
    category: 'Conversion',
    action: 'Signup',
    label: 'From Roulette',
  });
};

// Track prize claim
export const trackPrizeClaim = (amount: number, method: string) => {
  ReactGA.event({
    category: 'Prize',
    action: 'Claim',
    label: method,
    value: amount,
  });
};