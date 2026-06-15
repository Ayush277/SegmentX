const ai = require('../services/ai_segmentation.service');
const { getSegmentCustomers } = require('../services/segment.service');

exports.parse = async (req, res) => {
  try {
    const text = req.body && req.body.text;
    if (!text) return res.status(400).json({ error: 'text is required in request body' });
    const rules = await ai.translateTextToRules(text);
    res.json({ rules });
  } catch (err) {
    console.error('segments.parse error', err);
    res.status(500).json({ error: err.message });
  }
};

exports.run = async (req, res) => {
  try {
    let rules = req.body && req.body.rules;
    const text = req.body && req.body.text;
    if (!rules && !text) return res.status(400).json({ error: 'either rules or text is required in request body' });

    if (!rules && text) {
      rules = await ai.translateTextToRules(text);
    }

    const result = await getSegmentCustomers(rules || {});
    res.json({ rules: rules || {}, ...result });
  } catch (err) {
    console.error('segments.run error', err);
    res.status(500).json({ error: err.message });
  }
};
