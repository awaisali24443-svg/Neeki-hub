import express from 'express';
const router = express.Router();

// Kaaba coordinates (Mecca, Saudi Arabia)
const KAABA = {
  latitude: 21.4225,
  longitude: 39.8262
};

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

function toDegrees(radians) {
  return radians * (180 / Math.PI);
}

function calculateQibla(lat, lon) {
  const φ1 = toRadians(lat);
  const φ2 = toRadians(KAABA.latitude);
  const Δλ = toRadians(KAABA.longitude - lon);

  const y = Math.sin(Δλ);
  const x = Math.cos(φ1) * Math.tan(φ2) - Math.sin(φ1) * Math.cos(Δλ);
  
  let bearing = toDegrees(Math.atan2(y, x));
  bearing = (bearing + 360) % 360;

  // Calculate distance (Haversine formula)
  const R = 6371; // Earth radius in km
  const Δφ = φ2 - φ1;
  const a = Math.sin(Δφ / 2) ** 2 + 
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return { bearing, distance };
}

// POST /api/qibla
router.post('/', (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ 
        success: false, 
        error: 'Latitude and longitude are required' 
      });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid coordinates. Latitude: -90 to 90, Longitude: -180 to 180' 
      });
    }

    const { bearing, distance } = calculateQibla(lat, lon);

    res.json({
      success: true,
      data: {
        qiblaDirection: Math.round(bearing * 100) / 100,
        distanceToKaaba: Math.round(distance * 100) / 100,
        userLocation: { latitude: lat, longitude: lon },
        kaabaLocation: KAABA
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Qibla calculation error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to calculate Qibla direction',
      message: error.message 
    });
  }
});

export default router;