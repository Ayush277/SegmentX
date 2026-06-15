const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase = null;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('Supabase env vars not found: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY');
} else {
  // only create the client when both URL and KEY are present
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
}

module.exports = supabase;
