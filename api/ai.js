import express from 'express';

const router = express.Router();

const SYSTEM_PROMPT = `You are an assistant specialized in Islamic knowledge. Answer only questions related to Islam, Quran, Hadith, Fiqh, Seerah, duas, and tafseer. 

CRITICAL REQUIREMENTS:
1. For every factual claim, cite primary source(s) in the 'sources' array
2. If quoting Quran, always cite: 'Quran Surah:Ayah' (e.g., 'Quran 2:255')
3. If quoting Hadith, include collection name and number (e.g., 'Sahih Bukhari 1:2:3')
4. If unsure of source, say "source not found" - NEVER invent sources
5. Keep answers concise but accurate (max 300 words)
6. Provide translations when requested
7. If question is not Islamic, respond: "I can only answer questions related to Islam"

Return your response in this JSON format:
{
  "answer": "your detailed answer here",
  "sources": ["Quran 2:255", "Sahih Bukhari 1:2:3"],
  "confidence": "high|medium|low"
}`;

// In-memory cache (consider Redis for production)
const cache = new Map();
const CACHE_DURATION = 3600000; // 1 hour

async function queryGemini(question, lang) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{
      parts: [{
        text: `${SYSTEM_PROMPT}\n\nLanguage: ${lang}\n\nQuestion: ${question}`
      }]
    }],
    generationConfig: {
      temperature: 0.3,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024,
    },
    safetySettings: [
      {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      },
      {
        category: "HARM_CATEGORY_HATE_SPEECH",
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      }
    ]
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('No response from Gemini');
  }

  // Try to parse JSON response
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        answer: parsed.answer || text,
        sources: parsed.sources || [],
        confidence: parsed.confidence || 'medium'
      };
    }
  } catch (e) {
    // If not JSON, wrap in structure
  }

  return {
    answer: text,
    sources: [],
    confidence: 'medium'
  };
}

async function queryHuggingFace(question, lang) {
  const apiKey = process.env.HF_API_KEY;
  if (!apiKey) throw new Error('HF_API_KEY not configured');

  const url = 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      inputs: `${SYSTEM_PROMPT}\n\nQuestion: ${question}`,
      parameters: { 
        max_length: 500, 
        temperature: 0.7,
        top_p: 0.9 
      }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HuggingFace API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const answer = data[0]?.generated_text || data.generated_text || 'No response';

  return {
    answer,
    sources: [],
    confidence: 'low',
    note: 'Fallback model used - sources may be limited'
  };
}

// POST /api/ai
router.post('/', async (req, res) => {
  try {
    const { question, lang = 'en', context } = req.body;

    // Validation
    if (!question || question.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Question is required' 
      });
    }

    if (question.length > 500) {
      return res.status(400).json({ 
        success: false, 
        error: 'Question is too long. Maximum 500 characters.' 
      });
    }

    // Check cache
    const cacheKey = `${question.toLowerCase().trim()}-${lang}`;
    if (cache.has(cacheKey)) {
      const cached = cache.get(cacheKey);
      if (Date.now() - cached.timestamp < CACHE_DURATION) {
        return res.json({
          success: true,
          data: cached.data,
          meta: { cached: true, timestamp: cached.timestamp }
        });
      }
      cache.delete(cacheKey);
    }

    let result;
    let modelUsed = 'gemini-pro';

    try {
      result = await queryGemini(question, lang);
    } catch (geminiError) {
      console.warn('Gemini failed, trying HuggingFace:', geminiError.message);
      try {
        result = await queryHuggingFace(question, lang);
        modelUsed = 'huggingface-fallback';
      } catch (hfError) {
        console.error('All AI providers failed:', hfError);
        throw new Error('All AI providers are currently unavailable. Please try again later.');
      }
    }

    // Ensure sources array exists
    if (!result.sources) result.sources = [];
    if (!result.confidence) result.confidence = 'medium';

    const responseData = {
      answer: result.answer,
      sources: result.sources,
      confidence: result.confidence,
      model_meta: {
        model: modelUsed,
        language: lang,
        timestamp: new Date().toISOString()
      }
    };

    // Cache the result
    cache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now()
    });

    // Clean old cache entries (keep only last 100)
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }

    res.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('AI API error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get AI response',
      message: error.message 
    });
  }
});

// Clear cache endpoint (for development/admin)
router.delete('/cache', (req, res) => {
  const size = cache.size;
  cache.clear();
  res.json({ 
    success: true, 
    message: `Cache cleared. Removed ${size} entries.` 
  });
});

// Health check for AI service
router.get('/health', (req, res) => {
  res.json({
    success: true,
    gemini: !!process.env.GEMINI_API_KEY,
    huggingface: !!process.env.HF_API_KEY,
    cacheSize: cache.size,
    timestamp: new Date().toISOString()
  });
});

export default router;