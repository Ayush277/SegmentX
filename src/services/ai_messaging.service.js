const axios = require('axios');

const DEFAULT_API_URL = 'https://api.openai.com/v1/chat/completions';

function stripMarkdown(text) {
  if (!text || typeof text !== 'string') return text;
  return text.replace(/```[\s\S]*?```/g, match => {
    return match.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }).replace(/`([^`]*)`/g, '$1');
}

function buildSystemPrompt() {
  return `You are an expert marketing copywriter. When given a campaign intent and an audience description, generate exactly 3 short, engaging message variations suitable for SMS or WhatsApp.
Output must be STRICT JSON only, no surrounding text, no backticks, no commentary. The JSON schema must be:
{"variants": ["message 1", "message 2", "message 3"]}

Requirements:
- Each message should be short (<= 160 characters), action-oriented, and suitable for SMS/WhatsApp.
- Do not include URLs or sensitive placeholders. Use concise CTAs like 'Shop now', 'Reply YES'.
- Return exactly 3 variants in the order of preferred to least preferred.
`;
}

/**
 * Generate 3 message variants from an LLM.
 * @param {string} campaign_intent
 * @param {string} audience_description
 * @returns {Promise<{variants: string[]}>}
 */
async function generateMessages(campaign_intent, audience_description) {
  if (!campaign_intent || !audience_description) throw new Error('campaign_intent and audience_description are required');

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set');

  const apiUrl = process.env.OPENAI_API_URL || DEFAULT_API_URL;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  const system = buildSystemPrompt();
  const user = `Campaign intent: ${campaign_intent}\nAudience: ${audience_description}\nReturn the JSON only.`;

  const payload = {
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user }
    ],
    max_tokens: 300,
    temperature: 0.7
  };

  let res;
  try {
    res = await axios.post(apiUrl, payload, {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      timeout: 15000
    });
  } catch (err) {
    // network or API-level error
    throw new Error(`LLM request failed: ${err.message}`);
  }

  const extractChoiceContent = r => {
    return (r && r.data && r.data.choices && r.data.choices[0] && (r.data.choices[0].message && r.data.choices[0].message.content)) || (r && r.data && r.data.choices && r.data.choices[0] && r.data.choices[0].text) || '';
  };

  let contentRaw = extractChoiceContent(res);
  if (!contentRaw) throw new Error('Empty response from LLM');

  // Strip markdown/code fences before parsing
  let content = stripMarkdown(contentRaw).trim();

  // Robustly extract a JSON object from the LLM output. The model may
    // wrap JSON in markdown code fences (```json ... ```), single backticks,
    // or return surrounding commentary. We'll try a few heuristics to pull
    // the first JSON object out of the text.
    function extractJsonObject(text) {
      if (!text || typeof text !== 'string') return null;
      const t = text.trim();

      // 1) Try to find a JSON block using a greedy regex for the first {...}
      const blockMatch = t.match(/({[\s\S]*})/);
      if (blockMatch && blockMatch[1]) return blockMatch[1];

      // 2) Remove common Markdown code fences and try again
      let stripped = t.replace(/```(?:json)?\s*/i, '').replace(/\s*```$/, '');
      stripped = stripped.replace(/`{1}([^`]*)`{1}/g, '$1'); // single backticks
      const m2 = stripped.match(/({[\s\S]*})/);
      if (m2 && m2[1]) return m2[1];

      // 3) Fallback: look for first '{' and last '}' and slice
      const first = t.indexOf('{');
      const last = t.lastIndexOf('}');
      if (first !== -1 && last !== -1 && last > first) return t.slice(first, last + 1);

      return null;
    }

    let jsonText = extractJsonObject(content);
    let parsed = null;

    // Try parse/extract once; if that fails, attempt a single polite retry asking
    // the model to return STRICT JSON only (no fences or commentary).
      if (jsonText) {
        try {
          parsed = JSON.parse(jsonText);
        } catch (err) {
          // Log raw LLM output for debugging
          console.log('LLM raw output (messaging) >>>');
          console.log(contentRaw);
          parsed = null;
        }
      }

    if (!parsed) {
      // Retry once with a clarifying user message
      try {
        const clarification = `Please return STRICT JSON only with the schema {"variants":["message1","message2","message3"]}. Do NOT include backticks, code fences, or any surrounding text. Return the JSON compacted on a single line.`;
        const retryPayload = Object.assign({}, payload, {
          messages: payload.messages.concat([{ role: 'user', content: clarification }]),
          temperature: 0.0,
          max_tokens: 600
        });

        const res2 = await axios.post(apiUrl, retryPayload, {
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
          timeout: 15000
        });

        const content2 = extractChoiceContent(res2);
        const extracted2 = extractJsonObject(stripMarkdown(content2));
        if (extracted2) {
          try {
            parsed = JSON.parse(extracted2);
            content = content2; // preserve the last raw output for errors/success
          } catch (err) {
            parsed = null;
          }
        }

        // If still not parsed, attempt a conservative repair for common truncation
        if (!parsed && extracted2 && typeof extracted2 === 'string') {
          try {
            let candidate = extracted2.trim();
            // If it looks like the object is open/unfinished, try to close variants array/object
            if (candidate.indexOf('"variants"') !== -1 && !candidate.trim().endsWith('}')) {
              const repaired = candidate + '"]}';
              parsed = JSON.parse(repaired);
              content = content2;
            }
          } catch (err) {
            parsed = null;
          }
        }

        if (!parsed) {
          console.log('LLM raw output (messaging) first attempt >>>');
          console.log(contentRaw);
          console.log('LLM raw output (messaging) retry >>>');
          console.log(content2);
          throw new Error(`Retry failed to produce valid JSON. First raw: ${contentRaw}. Retry raw: ${content2}`);
        }
      } catch (err) {
        if (err.message && err.message.startsWith('Retry failed')) throw err;
        throw new Error(`Failed to extract/parse JSON from LLM responses. Error: ${err.message}. Raw output: ${content}`);
      }
    }

  if (!parsed || !Array.isArray(parsed.variants) || parsed.variants.length !== 3) {
    throw new Error(`LLM returned invalid schema. Expected {variants:[..3 strings..]}. Raw output: ${content}`);
  }

  // Validate variants are strings and trim them
  const variants = parsed.variants.map(v => (typeof v === 'string' ? v.trim() : String(v))).slice(0, 3);

  return { variants };
}

module.exports = { generateMessages };
