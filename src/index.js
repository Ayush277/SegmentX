require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const db = require('./config/database');
const routes = require('./routes');
const aiRoutes = require('./routes/ai.routes');

const app = express();

app.use(morgan('dev'));
// Enable CORS for all origins, methods and headers to allow local frontend access
app.use(cors({
  origin: '*',
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
}));
// Respond to preflight requests
app.options('*', cors());

app.use(express.json());

app.get('/', (req, res) => res.json({ ok: true, service: 'SegmentX CRM' }));

// Expose root-level endpoint for generate-ai-draft (absolute URL: /generate-ai-draft)
if (aiRoutes && aiRoutes.generateAIDraftHandler) {
  app.post('/generate-ai-draft', aiRoutes.generateAIDraftHandler);
}

app.use('/api', routes);

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await db.authenticate();
    await db.sync();
    console.log('Database connected and synchronized');

    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start app', err);
    process.exit(1);
  }
}

start();
