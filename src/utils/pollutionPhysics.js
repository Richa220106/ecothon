export const VULNERABILITY_MULTIPLIERS = {
  NORMAL: 1.0,
  CHILD: 1.5,
  ELDERLY: 1.6,
  ASTHMATIC: 1.8,
};

export const PEAK_HOUR_FACTORS = {
  PEAK: 1.3,
  OFF_PEAK: 1.0,
};

/**
 * Calculates pollution for a road segment
 * Formula: Pollution = Traffic Density × Congestion × Road Weight
 */
export const calculateRoadPollution = (density, congestion, weight) => {
  return density * congestion * weight;
};

/**
 * Calculates health exposure
 * Formula: Health Exposure = Base Pollution × Vulnerability Multiplier
 */
export const calculateHealthExposure = (basePollution, vulnerability) => {
  return basePollution * vulnerability;
};

/**
 * Calculates final adjusted pollution
 * Formula: Adjusted Pollution = Health Exposure × Peak Hour Factor
 */
export const calculateAdjustedPollution = (healthExposure, isPeak) => {
  const factor = isPeak ? PEAK_HOUR_FACTORS.PEAK : PEAK_HOUR_FACTORS.OFF_PEAK;
  return healthExposure * factor;
};

export const MAX_SAFE_EXPOSURE = 400;

export const calculateRiskIndex = (exposure) => {
  return parseFloat(Math.min(10, (exposure / MAX_SAFE_EXPOSURE) * 10).toFixed(1));
};

/**
 * Color logic for road visualization
 */
export const getPollutionColor = (score) => {
  if (score < 40) return '#50fa7b'; // Green
  if (score < 80) return '#ffb86c'; // Yellow
  if (score < 120) return '#ff4b4b'; // Red
  return '#bd93f9'; // Purple (Sensitive)
};


export const getExposureRating = (score) => {
  if (score < 30) return 'Low';
  if (score < 60) return 'Moderate';
  if (score < 85) return 'High';
  return 'Critical';
};

