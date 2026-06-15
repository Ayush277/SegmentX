const { Sequelize } = require('sequelize');

// Use DB_URI when provided, otherwise build from parts
const dbUri = process.env.DB_URI || (
  process.env.DB_HOST
    ? `postgres://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASS || 'postgres'}@${process.env.DB_HOST}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'segmentx_db'}`
    : undefined
);

if (!dbUri) {
  console.warn('No database configuration found. Set DB_URI or DB_HOST/DB_* env vars.');
}

// Build options; enable SSL when requested (useful for Supabase)
const sequelizeOptions = {
  dialect: 'postgres',
  logging: false,
};

// If DB_SSL=true or the URI contains 'supabase' enable ssl options
const enableSsl = (process.env.DB_SSL === 'true') || (dbUri && dbUri.includes('supabase'));
if (enableSsl) {
  sequelizeOptions.dialectOptions = {
    ssl: {
      require: true,
      // Many managed Postgres (including Supabase) use self-signed certs
      rejectUnauthorized: false
    }
  };
}

const defaultUri = 'postgres://postgres:postgres@localhost:5432/segmentx_db';
const sequelize = new Sequelize(dbUri || defaultUri, sequelizeOptions);

module.exports = sequelize;
