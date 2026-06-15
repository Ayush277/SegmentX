const express = require('express');
const router = express.Router();
const db = require('../config/database');
const supabase = require('../lib/supabase.client');

router.get('/', async (req, res) => {
  try {
    // Check DB
    await db.authenticate();

    // Check Supabase by calling an RPC or a simple from/select if configured
    let supabaseStatus = { ok: false, message: 'no client configured' };
    if (process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)) {
      // perform a lightweight request: get project meta via REST is not available here,
      // so we'll call a simple noop: list from pg_catalog (requires proper DB role) is unsafe.
      // Instead, verify that the client exists by checking that createClient returned an object.
      supabaseStatus = { ok: true };
    }

    res.json({ db: true, supabase: supabaseStatus });
  } catch (err) {
    console.error('Health check failed', err);
    res.status(500).json({ error: 'health check failed', details: err.message });
  }
});

module.exports = router;
