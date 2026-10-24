import pg from 'pg';

const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL ||
  'postgres://postgres:postgres@localhost:5432/city_meet';

export const pool = new Pool({
  connectionString,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 10
});

pool.on('error', (err) => {
  console.error('[PostgreSQL] Unexpected error on idle client:', err.message);
});

export async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[SQL Query] duration=${duration}ms rows=${res.rowCount}`);
  }
  return res;
}

export async function checkConnection() {
  try {
    const res = await pool.query('SELECT NOW()');
    return { connected: true, time: res.rows[0].now };
  } catch (error) {
    return { connected: false, error: error.message };
  }
}
