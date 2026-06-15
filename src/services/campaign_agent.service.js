const aiSeg = require('./ai_segmentation.service');
const { getSegmentCustomers } = require('./segment.service');
const aiMsg = require('./ai_messaging.service');

/**
 * Orchestrator: generate an AI campaign draft from a user input string.
 * Steps:
 *  - translate userInput -> JSON rules via AI segmentation service
 *  - run segmentation to get audience ids/count
 *  - generate 3 message variants via AI messaging service
 * Returns: { rules, audienceSize, variants, recommendedChannel }
 */
async function generateAICampaignDraft(userInput) {
  if (!userInput || typeof userInput !== 'string') throw new Error('userInput (string) is required');

  // 1) Get rules from AI
  const rules = await aiSeg.translateTextToRules(userInput);

  // 2) Run segmentation to get audience
  const segResult = await getSegmentCustomers(rules || {});
  const audienceSize = (segResult && typeof segResult.count === 'number') ? segResult.count : 0;

  // 3) Generate message variants. Use the original userInput as campaign intent
  // and a short audience description derived from the rules.
  const audienceDescription = Object.keys(rules || {}).length ? JSON.stringify(rules) : 'General audience';

  const msgResult = await aiMsg.generateMessages(userInput, audienceDescription);

  const variants = (msgResult && Array.isArray(msgResult.variants)) ? msgResult.variants : [];

  // Recommend a channel (default to WhatsApp). We could extend to infer from userInput.
  const recommendedChannel = 'WhatsApp';

  return {
    rules,
    audienceSize,
    variants,
    recommendedChannel
  };
}

module.exports = { generateAICampaignDraft };
