const express = require('express');
require('dotenv').config();
const ai = require('../src/routes/ai.routes');

const app = express();
app.use(express.json());

if (ai && ai.generateAIDraftHandler) {
  app.post('/generate-ai-draft', ai.generateAIDraftHandler);
}

app.get('/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.TEST_AI_PORT || 4003;
app.listen(PORT, () => console.log(`Test AI server listening on port ${PORT}`));
