// Spin System Configuration
// This file contains all configurable settings for the spin & win system
// Modify these values to quickly adjust limits and behavior

export const SPIN_CONFIG = {
  // Rate Limits
  HOURLY_SPIN_LIMIT: parseInt(process.env.HOURLY_SPIN_LIMIT || '1000'), // Spins per hour per fingerprint
  DAILY_SPIN_LIMIT: parseInt(process.env.DAILY_SPIN_LIMIT || '5000'),   // Spins per day per fingerprint
  
  // Abuse Prevention
  MAX_ACCOUNTS_PER_FINGERPRINT: parseInt(process.env.MAX_ACCOUNTS_PER_FINGERPRINT || '5'), // Max accounts per device
  MAX_SPINS_PER_IP_DAILY: parseInt(process.env.MAX_SPINS_PER_IP_DAILY || '5000'), // Max spins per IP per day
  SUSPICIOUS_ACTIVITY_THRESHOLD: parseInt(process.env.SUSPICIOUS_ACTIVITY_THRESHOLD || '3'), // Failed attempts before flagging
  
  // Prize Claim Settings
  PENDING_PRIZE_EXPIRY_HOURS: parseInt(process.env.PENDING_PRIZE_EXPIRY_HOURS || '24'), // Hours to claim won prize
  
  // Cooldown Periods
  SPIN_COOLDOWN_SECONDS: parseInt(process.env.SPIN_COOLDOWN_SECONDS || '3'), // Seconds between spins
  
  // Probability Settings (customize your prize wheel)
  PRIZE_PROBABILITIES: {
    'no_win': 60,        // 60% chance of no win
    'small_cash': 20,    // 20% chance - $5-$10
    'medium_cash': 10,   // 10% chance - $20-$50
    'large_cash': 5,     // 5% chance - $100-$200
    'bonus': 3,          // 3% chance - Free spins or bonus
    'jackpot': 2,        // 2% chance - $500+
  },
  
  // Prize Amounts
  PRIZE_AMOUNTS: {
    'small_cash': { min: 5, max: 10 },
    'medium_cash': { min: 20, max: 50 },
    'large_cash': { min: 100, max: 200 },
    'jackpot': { min: 500, max: 1000 },
    'bonus': { min: 5, max: 10 }, // Bonus spins
  },
  
  // Admin Alerts
  ALERT_ON_JACKPOT: process.env.ALERT_ON_JACKPOT === 'true' || true,
  ALERT_ON_SUSPICIOUS_ACTIVITY: process.env.ALERT_ON_SUSPICIOUS_ACTIVITY === 'true' || true,
  
  // Feature Flags
  REQUIRE_EMAIL_VERIFICATION: process.env.REQUIRE_EMAIL_VERIFICATION === 'true' || false,
  ENABLE_IP_TRACKING: process.env.ENABLE_IP_TRACKING === 'true' || true,
  ENABLE_FINGERPRINT_TRACKING: process.env.ENABLE_FINGERPRINT_TRACKING === 'true' || true,
};

// Helper function to validate prize probabilities add up to 100
export const validateProbabilities = () => {
  const total = Object.values(SPIN_CONFIG.PRIZE_PROBABILITIES).reduce((sum, val) => sum + val, 0);
  if (total !== 100) {
    console.warn(`⚠️  Prize probabilities sum to ${total}%, not 100%`);
  }
  return total === 100;
};

// Log current configuration on startup
export const logSpinConfig = () => {
  console.log('\n🎰 Spin System Configuration:');
  console.log('─────────────────────────────');
  console.log(`Hourly Limit: ${SPIN_CONFIG.HOURLY_SPIN_LIMIT} spins/hour`);
  console.log(`Daily Limit: ${SPIN_CONFIG.DAILY_SPIN_LIMIT} spins/day`);
  console.log(`Max Accounts per Device: ${SPIN_CONFIG.MAX_ACCOUNTS_PER_FINGERPRINT}`);
  console.log(`Pending Prize Expiry: ${SPIN_CONFIG.PENDING_PRIZE_EXPIRY_HOURS} hours`);
  console.log(`Spin Cooldown: ${SPIN_CONFIG.SPIN_COOLDOWN_SECONDS} seconds`);
  console.log('─────────────────────────────\n');
  
  const probsValid = validateProbabilities();
  if (!probsValid) {
    console.warn('⚠️  Please adjust PRIZE_PROBABILITIES to sum to 100%\n');
  }
};

export default SPIN_CONFIG;