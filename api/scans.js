import { neon } from '@neondatabase/serverless';

function getDb() {
  return neon(process.env.DATABASE_URL);
}

async function ensureTable(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS scans (
      id SERIAL PRIMARY KEY,
      device_id TEXT NOT NULL,
      food_name TEXT NOT NULL,
      portion TEXT,
      minutes REAL NOT NULL,
      factors JSONB,
      calories REAL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_scans_device ON scans (device_id)`;
}

export default async function handler(req, res) {
  const sql = getDb();

  if (!process.env.DATABASE_URL) {
    return res.status(500).json({ error: 'Database not configured' });
  }

  await ensureTable(sql);

  if (req.method === 'POST') {
    const { device_id, food_name, portion, minutes, factors, calories } = req.body;

    if (!device_id || !food_name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const rows = await sql`
      INSERT INTO scans (device_id, food_name, portion, minutes, factors, calories)
      VALUES (${device_id}, ${food_name}, ${portion}, ${minutes}, ${JSON.stringify(factors)}, ${calories})
      RETURNING id, created_at
    `;

    return res.json({ id: rows[0].id, created_at: rows[0].created_at });
  }

  if (req.method === 'GET') {
    const deviceId = req.query.device_id;
    if (!deviceId) {
      return res.status(400).json({ error: 'Missing device_id' });
    }

    const rows = await sql`
      SELECT id, food_name, portion, minutes, factors, calories, created_at
      FROM scans
      WHERE device_id = ${deviceId}
      ORDER BY created_at DESC
      LIMIT 100
    `;

    return res.json(rows);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
