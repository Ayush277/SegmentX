const { sequelize, CommunicationLog } = require('../models');

exports.getCampaignAnalytics = async (req, res) => {
  try {
    const campaignId = parseInt(req.params.campaignId, 10);
    if (!campaignId || isNaN(campaignId)) return res.status(400).json({ error: 'Invalid campaignId' });

    const statuses = ['SENT', 'DELIVERED', 'OPENED', 'CLICKED'];

    // Aggregate counts grouped by status
    const rows = await CommunicationLog.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: { campaignId },
      group: ['status']
    });

    const counts = {
      SENT: 0,
      DELIVERED: 0,
      OPENED: 0,
      CLICKED: 0
    };

    rows.forEach(r => {
      const status = r.get('status');
      const count = parseInt(r.get('count'), 10) || 0;
      if (statuses.includes(status)) counts[status] = count;
    });

    const total = counts.SENT + counts.DELIVERED + counts.OPENED + counts.CLICKED;

    // Calculate rates safely (avoid divide-by-zero). Return percentages with 2 decimal places.
    const deliveryRate = counts.SENT ? Number(((counts.DELIVERED / counts.SENT) * 100).toFixed(2)) : 0;
    const openRate = counts.DELIVERED ? Number(((counts.OPENED / counts.DELIVERED) * 100).toFixed(2)) : 0;
    const clickRate = counts.DELIVERED ? Number(((counts.CLICKED / counts.DELIVERED) * 100).toFixed(2)) : 0;

    return res.json({
      campaignId,
      counts,
      total,
      rates: {
        deliveryRate,
        openRate,
        clickRate
      }
    });
  } catch (err) {
    console.error('getCampaignAnalytics error', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch analytics' });
  }
};

module.exports = exports;
