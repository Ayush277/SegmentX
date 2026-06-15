const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

// ==========================================
// 1. FETCH AVAILABILITY CHECK
// ==========================================
if (typeof fetch === 'undefined') {
    console.error("CRITICAL ERROR: Native 'fetch' is not defined.");
    console.error("Please upgrade to Node.js v18+ or install a polyfill.");
    process.exit(1);
}

const app = express();

// Allow all origins for local testing
app.use(cors());
app.use(express.json());

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/segmentx';

// Connect to MongoDB
mongoose.connect(mongoUri)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Health route
app.get('/api/health', (req, res) => {
  res.json({ status: 'Segment X Backend Online' });
});

// ==========================================
// THE BULLETPROOF AI ROUTE
// ==========================================
app.post('/generate-ai-draft', async (req, res) => {
    try {
        const userPrompt = req.body.prompt;
        
        const baseUrl = process.env.OPENAI_API_URL || 'https://generativelanguage.googleapis.com/v1beta/openai';
        const apiUrl = baseUrl.replace(/\/$/, '') + '/chat/completions';
        
        console.log(`Sending prompt to Gemini: "${userPrompt}"`);

const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: process.env.OPENAI_MODEL || "gemini-2.5-flash",
                max_tokens: 1500, // Bumping to 1500 to be extremely safe
                response_format: { type: "json_object" }, // THIS IS THE MAGIC KEY
                messages: [
                    {
                        role: "system",
                        content: "You are a strict CRM API. Extract audience rules and generate 3 marketing messages based on the user's prompt. You MUST return ONLY valid JSON. No markdown, no backticks, no conversational text. Structure exactly like this: {\"segment_rules\": {\"max_inactive_days\": 60}, \"messages\": [\"Variant 1 text\", \"Variant 2 text\", \"Variant 3 text\"]}"
                    },
                    {
                        role: "user",
                        content: userPrompt
                    }
                ]
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            console.error("LLM API Error:", data);
            return res.status(response.status).json({ error: data.error?.message || "LLM Request Failed" });
        }
        
        // ==========================================
        // 2. MALFORMED OUTPUT CHECK
        // ==========================================
        if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
            console.error("Unexpected LLM Response Format:", data);
            return res.status(500).json({ error: "Received malformed or empty response from the LLM." });
        }
        
                let cleanText = data.choices[0].message.content || '';

                // Remove fenced code blocks (```...```) and inline backticks, then trim
                try {
                    // remove any ```...``` blocks (including ```json)
                    cleanText = String(cleanText).replace(/```[\s\S]*?```/g, '');
                    // remove inline backticks `like this`
                    cleanText = cleanText.replace(/`([^`]*)`/g, '$1');
                    cleanText = cleanText.trim();
                } catch (cleanupErr) {
                    console.error('Error cleaning LLM output:', cleanupErr && cleanupErr.message);
                    // fallback to raw string
                    cleanText = String(cleanText || '').trim();
                }
        
        // ==========================================
        // 3. SAFER JSON PARSING
        // ==========================================
        let parsedData;
        try {
            parsedData = JSON.parse(cleanText);
        } catch (parseError) {
            console.error("Failed to parse LLM JSON. Raw output was:", cleanText);
            return res.status(500).json({ error: "LLM generated invalid JSON format. Please try again." });
        }

        console.log("Successfully generated AI Draft!");

        res.status(200).json({
            audience_size: 0, 
            segment_rules: parsedData.segment_rules || {},
            messages: parsedData.messages || []
        });

    } catch (error) {
        console.error("AI Route Exception:", error);
        res.status(500).json({ error: "Internal Server Error during AI Generation" });
    }
});

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`Segment X backend listening on port ${PORT}`);
});