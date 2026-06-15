const express = require('express');
const router = express.Router();
const axios = require('axios');

const DEFAULT_API_URL = 'https://api.openai.com/v1/chat/completions';

function stripMarkdown(text) {
  if (!text || typeof text !== 'string') return text;
  return text.replace(/```[\s\S]*?```/g, match => {
    return match.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }).replace(/`([^`]*)`/g, '$1');
}

async function generateAIDraftHandler(req, res) {
  let contentRaw = null;
  try {
    const { prompt } = req.body || {};
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'prompt (string) is required in request body' });
    }

    // Read and sanitize env vars (strip accidental surrounding quotes)
    const rawApiKey = process.env.OPENAI_API_KEY;
    const apiKey = rawApiKey ? rawApiKey.replace(/^"|"$/g, '').trim() : rawApiKey;
    if (!apiKey) {
      console.error('OPENAI_API_KEY is not set in environment');
      return res.status(500).json({ error: 'OPENAI_API_KEY is not configured on server' });
    }

    // Determine final provider URL and model. For Gemini (OpenAI-compatible) we
    // allow a custom base URL in OPENAI_API_URL. Build final URL as
    // `${base.replace(/\/$/, '')}/chat/completions` to avoid double slashes.
    const rawApiBase = process.env.OPENAI_API_URL;
    const apiBase = rawApiBase ? String(rawApiBase).replace(/^"|"$/g, '').trim().replace(/\/+$/g, '') : DEFAULT_API_URL.replace(/\/+$/g, '');
    const url = apiBase + '/chat/completions';

    const rawModel = process.env.OPENAI_MODEL;
    // Default to the Gemini chat model when using Google's compatibility layer.
    const model = rawModel ? rawModel.replace(/^"|"$/g, '').trim() : 'gemini-2.5-flash';

    // Log provider config to help debug 404s / misconfigured endpoints
    try {
      console.log('Using LLM provider URL:', url, 'model:', model);
    } catch (e) {
      /* ignore logging errors */
    }

    // CRITICAL system prompt per requirements: strict CRM extraction + JSON-only output
    const system = `You are an expert CRM AI. Extract audience segment rules (like city, min_spend, max_inactive_days) from the user prompt. Then, generate 3 distinct marketing message variants based on their intent. You MUST return ONLY a raw JSON object. Do not wrap it in markdown blockticks. Structure exactly like this example: {"segment_rules": {"city": "Bangalore", "min_spend": 2000}, "messages": ["Variant 1...", "Variant 2...", "Variant 3..."]}`;

    // Force the strict system prompt and payload structure (the JSON Fix)
    const payload = {
      model: (process.env.OPENAI_MODEL ? String(process.env.OPENAI_MODEL).replace(/^"|"$/g, '').trim() : 'gemini-2.5-flash'),
      messages: [
        {
          role: 'system',
          content: `You are a strict CRM API. Extract audience rules and generate 3 marketing messages based on the user's prompt. 
You MUST return ONLY valid JSON. No markdown, no backticks, no conversational text.
Structure exactly like this:
{
  "segment_rules": { "max_inactive_days": 60, "city": null, "min_spend": null },
  "messages": [ "Message 1 text", "Message 2 text", "Message 3 text" ]
}`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 600,
      temperature: 0.7
    };

    let llmRes;
    try {
      // Call the provider using the composed URL and Bearer auth
      llmRes = await axios.post(url, payload, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        timeout: 20000
      });
    } catch (err) {
      const status = err && err.response && err.response.status;
      const body = err && err.response && err.response.data;
      console.error('LLM request failed:', status || (err && err.message) || err);
      if (body) console.error('LLM response body:', body);
      return res.status(500).json({ error: `LLM request failed: ${status || (err && err.message) || 'unknown error'}. Check OPENAI_API_URL and OPENAI_API_KEY on the server.` });
    }

    contentRaw = (llmRes && llmRes.data && llmRes.data.choices && llmRes.data.choices[0] && ((llmRes.data.choices[0].message && llmRes.data.choices[0].message.content) || llmRes.data.choices[0].text)) || '';
    if (!contentRaw) {
      console.error('Empty response from LLM', llmRes && llmRes.data);
      return res.status(500).json({ error: 'Empty response from LLM' });
    }

    // Log raw LLM output for debugging BEFORE any parsing/cleaning
    try {
      console.log('Raw LLM Output:', contentRaw);
    } catch (e) {
      // avoid logging failures from circular structures
      console.error('Error logging raw LLM output:', e && e.message);
    }

    // JSON Trap Fix: strip code fences and backticks before parsing
    const cleaned = stripMarkdown(contentRaw).trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (err) {
      // Log raw output for debugging
      console.error('Failed to parse JSON from LLM response. Parse error:', err && err.message);
      if (contentRaw) console.error('LLM raw output (unmodified):', contentRaw);
      console.error('Cleaned output to parse (after stripMarkdown):');
      console.error(cleaned);
      return res.status(500).json({ error: `Failed to parse LLM JSON: ${err.message}` });
    }

    // Validate and normalize the response shape
    const audience_size = Number(parsed.audience_size || parsed.audienceSize || 0);
    const segment_rules = typeof parsed.segment_rules === 'object' && parsed.segment_rules ? parsed.segment_rules : (parsed.segmentRules || {});
    const messages = Array.isArray(parsed.messages) ? parsed.messages.slice(0,3) : (Array.isArray(parsed.msgs) ? parsed.msgs.slice(0,3) : []);

    if (Number.isNaN(audience_size) || !Array.isArray(messages) || messages.length !== 3) {
      console.error('LLM returned invalid schema:', parsed);
      return res.status(500).json({ error: 'LLM returned invalid schema' });
    }

    return res.json({ audience_size, segment_rules, messages });
  } catch (err) {
    // Detailed error logging to help debug failures without crashing
    try {
      console.error('generateAIDraftHandler - error.message:', err && err.message);
      if (err && err.response && err.response.data) {
        console.error('generateAIDraftHandler - error.response.data:', err.response.data);
      }
      if (contentRaw) {
        console.error('generateAIDraftHandler - raw LLM output available at error time:');
        console.error(contentRaw);
      }
    } catch (logErr) {
      console.error('Error while logging failure details:', logErr && logErr.message);
    }

    return res.status(500).json({ error: err && err.message ? err.message : 'An unknown error occurred' });
  }
}

// Also keep a router-mounted version under /api for backward compatibility
router.post('/generate-ai-draft', generateAIDraftHandler);

// expose handler for mounting at root if needed
module.exports = router;
module.exports.generateAIDraftHandler = generateAIDraftHandler;
