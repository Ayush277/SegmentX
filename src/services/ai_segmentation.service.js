const axios = require('axios');

/**
 * Translate a natural language segmentation instruction into a strict JSON rules object.
 * Expected schema: { min_spend?: number, city?: string, max_inactive_days?: number }
 *
 * Environment variables used:
 * - OPENAI_API_KEY: API key for the LLM provider
 * - OPENAI_API_URL: optional override for the API URL (defaults to OpenAI chat completions)
 * - OPENAI_MODEL: model name to request (optional)
 */

const DEFAULT_API_URL = 'https://api.openai.com/v1/chat/completions';

function stripMarkdown(text) {
  if (!text || typeof text !== 'string') return text;
  // remove fenced code blocks ```json ... ``` and single backticks
  return text.replace(/```[\s\S]*?```/g, match => {
    // if it's a fenced JSON block, return the inner content without fences
    return match.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }).replace(/`([^`]*)`/g, '$1');
}

function buildSystemPrompt() {
  return `You are a strict JSON generator. Receive a short natural-language instruction from a marketer and output ONLY valid JSON (no surrounding text, no backticks).
The JSON must conform to this schema (only these keys allowed):
{
  "min_spend": number,        // optional
  "city": "string",         // optional
  "max_inactive_days": number // optional
}

Rules:
- If the user mentions a currency amount or words like 'spent over 1000', set min_spend to that numeric value (convert to number, do NOT include currency symbols).
- If the user mentions a city, set city to that exact city name string.
- If the user asks for inactivity older than X days (e.g., 'haven't ordered in 30 days'), set max_inactive_days to that number.
- Omit any key that is NOT explicitly or implicitly mentioned in the instruction.
- Output must be pure JSON, with no extra commentary, punctuation, or code fences. Use numbers (no strings) for numeric fields.
Examples (ONLY for your internal reference, do not output examples):
Input: "Show me customers from Bangalore who spent over 1000 rupees"
Output: {"min_spend":1000,"city":"Bangalore"}

Input: "Customers who haven't ordered in 90 days"
Output: {"max_inactive_days":90}

Now produce the JSON for the marketer's instruction provided as the user message.`;
}

async function translateTextToRules(text) {
  if (!text || typeof text !== 'string') throw new Error('text is required');

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set in environment');

  const apiUrl = process.env.OPENAI_API_URL || DEFAULT_API_URL;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  const system = buildSystemPrompt();

  try {
    const payload = {
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: text }
      ],
      max_tokens: 300,
      temperature: 0
    };

    const res = await axios.post(apiUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      timeout: 15000
    });

    // OpenAI style response: res.data.choices[0].message.content
    const contentRaw = (res.data && res.data.choices && res.data.choices[0] && res.data.choices[0].message && res.data.choices[0].message.content) || (res.data && res.data.choices && res.data.choices[0] && res.data.choices[0].text) || '';

    if (!contentRaw) throw new Error('Empty response from LLM');

    // Strip Markdown/code fences before attempting to parse
    const content = stripMarkdown(contentRaw).trim();

    // Try to parse strict JSON. LLM might return surrounding text occasionally; extract JSON braces.
    let jsonText = content;

    // If content does not start with '{', attempt to find the first '{' and last '}'
    if (!jsonText.startsWith('{')) {
      const first = jsonText.indexOf('{');
      const last = jsonText.lastIndexOf('}');
      if (first !== -1 && last !== -1 && last > first) {
        jsonText = jsonText.slice(first, last + 1);
      }
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (err) {
      // Log raw LLM output to server console for debugging as requested
      console.log('LLM raw output (segmentation) >>>');
      console.log(contentRaw);
      throw new Error(`Failed to parse JSON from LLM response: ${err.message}. Raw output: ${contentRaw}`);
    }

    // Validate keys and types
    const allowed = ['min_spend', 'city', 'max_inactive_days'];
    const output = {};
    for (const k of Object.keys(parsed)) {
      if (!allowed.includes(k)) continue; // ignore unknown keys
      const v = parsed[k];
      if (k === 'city') {
        if (typeof v === 'string' && v.trim()) output.city = v.trim();
      } else if (k === 'min_spend' || k === 'max_inactive_days') {
        const n = Number(v);
        if (!Number.isNaN(n)) output[k] = n;
      }
    }

    return output;
  } catch (err) {
    // bubble up a helpful error
    throw new Error(`AI segmentation failed: ${err.message}`);
  }
}

module.exports = { translateTextToRules };
