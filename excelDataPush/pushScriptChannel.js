const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { Pool } = require('pg');

// PostgreSQL connection
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'demandplanning',
  password: 'root',
  port: 5432,
});

const csvPath = path.join(__dirname, 'channelData.csv');

// Insert or update channel
async function upsertChannel(code, name, description) {
  const client = await pool.connect();
  try {
    await client.query(
      `
      INSERT INTO channel (channel_code, channel_name, description)
      VALUES ($1, $2, $3)
      ON CONFLICT (channel_code)
      DO UPDATE SET
        channel_name = EXCLUDED.channel_name,
        description = EXCLUDED.description
      `,
      [code, name, description]
    );
  } catch (err) {
    console.error(`Error upserting ${code}:`, err.message);
  } finally {
    client.release();
  }
}

// Read and process CSV
function processCSV() {
  const rows = [];

  fs.createReadStream(csvPath)
    .pipe(csv())
    .on('data', (row) => {
      rows.push({
        channel_code: row.channel_code,
        channel_name: row.channel_name,
        description: row.description
      });
    })
    .on('end', async () => {
      for (const row of rows) {
        await upsertChannel(row.channel_code, row.channel_name, row.description);
      }
      console.log(`[${new Date().toLocaleTimeString()}] ✅ Channel data synced.`);
    });
}

// Watch for file changes
fs.watchFile(csvPath, { interval: 1000 }, (curr, prev) => {
  if (curr.mtime !== prev.mtime) {
    console.log('channel_data.csv updated. Re-importing...');
    processCSV();
  }
});

console.log('Watching channel_data.csv for changes...');
