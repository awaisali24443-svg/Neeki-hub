import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// GET /api/duas?category=&random=true
router.get('/', async (req, res) => {
  try {
    const { category, random } = req.query;

    const duasPath = path.join(__dirname, '../data/sample-duas.json');
    const duasData = await fs.readFile(duasPath, 'utf-8');
    let duas = JSON.parse(duasData);

    // Filter by category if specified
    if (category) {
      duas = duas.filter(d => 
        d.category.toLowerCase() === category.toLowerCase()
      );
      
      if (duas.length === 0) {
        return res.status(404).json({ 
          success: false, 
          error: `No duas found for category: ${category}` 
        });
      }
    }

    let result;
    if (random === 'true') {
      result = duas[Math.floor(Math.random() * duas.length)];
    } else {
      result = duas; // Return all duas in category
    }

    res.json({
      success: true,
      data: result,
      meta: {
        totalDuas: duas.length,
        cached: true,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Duas API error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch duas',
      message: error.message 
    });
  }
});

export default router;