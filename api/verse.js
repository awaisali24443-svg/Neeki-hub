import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// GET /api/verse?surah=&ayah=&random=true
router.get('/', async (req, res) => {
  try {
    const { surah, ayah, random } = req.query;

    // Load sample verses
    const versesPath = path.join(__dirname, '../data/sample-verses.json');
    const versesData = await fs.readFile(versesPath, 'utf-8');
    const verses = JSON.parse(versesData);

    let selectedVerse;

    if (random === 'true') {
      selectedVerse = verses[Math.floor(Math.random() * verses.length)];
    } else if (surah && ayah) {
      selectedVerse = verses.find(v => 
        v.surah.number === parseInt(surah) && 
        v.verse.number === parseInt(ayah)
      );
      if (!selectedVerse) {
        return res.status(404).json({ 
          success: false, 
          error: 'Verse not found' 
        });
      }
    } else {
      // Default to first verse
      selectedVerse = verses[0];
    }

    res.json({
      success: true,
      data: selectedVerse,
      meta: {
        totalVerses: verses.length,
        cached: true,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Verse API error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch verse',
      message: error.message 
    });
  }
});

export default router;