const { twoline2satrec, propagate, gstime, eciToGeodetic } = require('satellite.js');

/**
 * Propagate satellite position using SGP4
 * @param {string} tleLine1 - First line of TLE
 * @param {string} tleLine2 - Second line of TLE
 * @param {Date} date - Date to propagate to (default: now)
 * @returns {Object} Position data with lat, lng, altitude, velocity
 */
function propagateSatellite(tleLine1, tleLine2, date = new Date()) {
  try {
    // Create satellite record from TLE
    const satrec = twoline2satrec(tleLine1, tleLine2);

    // Propagate to requested time
    const positionAndVelocity = propagate(satrec, date);

    if (!positionAndVelocity.position) {
      throw new Error('Propagation failed: invalid position');
    }

    // Convert from ECI to geodetic (lat/lng/alt)
    const gmst = gstime(date);
    const geodetic = eciToGeodetic(positionAndVelocity.position, gmst);

    // Calculate velocity magnitude (speed)
    const velocity = positionAndVelocity.velocity.length();

    return {
      latitude: geodetic.latitude,
      longitude: geodetic.longitude,
      altitude: geodetic.height, // km above ellipsoid
      velocity: velocity, // km/s
      // Additional useful data
      azimuth: geodetic.longitude < 0 ? 'W' : 'E',
      elevation: geodetic.latitude > 0 ? 'N' : 'S'
    };
  } catch (error) {
    console.error('SGP4 propagation error:', error.message);
    throw error;
  }
}

/**
 * Check if satellite has valid TLE data
 */
function hasValidTLE(satellite) {
  return satellite &&
         satellite.tle_line1 &&
         satellite.tle_line2 &&
         satellite.tle_line1.trim() !== '' &&
         satellite.tle_line2.trim() !== '';
}

module.exports = {
  propagateSatellite,
  hasValidTLE
};
