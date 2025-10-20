import express from 'express';
const router = express.Router();

// GET /api/prayers?city=&country=&latitude=&longitude=
router.get('/', async (req, res) => {
  try {
    const { city, country, latitude, longitude, method = 'ISNA' } = req.query;
    
    let apiUrl;
    if (latitude && longitude) {
      apiUrl = `https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=2`;
    } else if (city && country) {
      apiUrl = `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=2`;
    } else {
      return res.status(400).json({ 
        success: false, 
        error: 'Please provide either city & country or latitude & longitude' 
      });
    }

    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`Prayer API returned status ${response.status}`);
    }

    const data = await response.json();

    if (data.code !== 200) {
      throw new Error('Prayer times API error');
    }

    const result = {
      success: true,
      data: {
        date: data.data.date,
        timings: {
          Fajr: data.data.timings.Fajr,
          Sunrise: data.data.timings.Sunrise,
          Dhuhr: data.data.timings.Dhuhr,
          Asr: data.data.timings.Asr,
          Maghrib: data.data.timings.Maghrib,
          Isha: data.data.timings.Isha
        },
        method: data.data.meta.method.name,
        location: { city, country, latitude, longitude }
      },
      meta: {
        cached: false,
        timestamp: new Date().toISOString()
      }
    };

    // Set cache headers (cache for 1 hour)
    res.set('Cache-Control', 'public, max-age=3600');
    res.json(result);

  } catch (error) {
    console.error('Prayer times error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch prayer times',
      message: error.message 
    });
  }
});

export default router;