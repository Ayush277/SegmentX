const { Campaign } = require('../models');

exports.createCampaign = async (req, res) => {
  try {
    const { name, segment_rules, message, channel } = req.body;

    if (!name) return res.status(400).json({ error: 'name is required' });
    if (!segment_rules) return res.status(400).json({ error: 'segment_rules is required (JSON object)' });

    let segmentCriteria = segment_rules;
    if (typeof segment_rules === 'string') {
      try {
        segmentCriteria = JSON.parse(segment_rules);
      } catch (err) {
        return res.status(400).json({ error: 'segment_rules must be valid JSON' });
      }
    }

    const campaign = await Campaign.create({
      name,
      segmentCriteria,
      message: message || null,
      channel: channel || null,
      status: 'DRAFT'
    });

    return res.status(201).json({ id: campaign.id, campaign });
  } catch (err) {
    console.error('createCampaign error', err);
    return res.status(500).json({ error: err.message || 'Failed to create campaign' });
  }
};

module.exports = exports;
