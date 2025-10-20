import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// GET /api/hadith?random=true&collection=
router.get('/', async (req, res) => {
  try {
    const { random, collection } = req.query;

    const hadithPath = path.join(__dirname, '../data/sample-hadiths.json');
    const hadithData = await fs.readFile(hadithPath, 'utf-8');
    let hadiths = JSON.parse(hadithData);

    // Filter by collection if specified
    if (collection) {
      hadiths = hadiths.filter(h => 
        h.collection.toLowerCase() === collection.toLowerCase()
      );
      
      if (hadiths.length === 0) {
        return res.status(404).json({ 
          success: false, 
          error: `No hadiths found for collection: ${collection}` 
        });
      }
    }

    let selectedHadith;
    if (random === 'true') {
      selectedHadith = hadiths[Math.floor(Math.random() * hadiths.length)];
    } else {
      selectedHadith = hadiths[0];
    }

    res.json({
      success: true,
      data: selectedHadith,
      meta: {
        totalHadiths: hadiths.length,
        cached: true,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Hadith API error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch hadith',
      message: error.message 
    });
  }
});

export default router;