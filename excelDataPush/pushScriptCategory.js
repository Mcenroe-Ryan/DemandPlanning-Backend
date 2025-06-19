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

const csvPath = path.join(__dirname, 'categoryData.csv');

// Insert or update category
async function upsertCategory(code, name, description) {
  const client = await pool.connect();
  try {
    await client.query(
      `
      INSERT INTO category (category_code, category_name, description)
      VALUES ($1, $2, $3)
      ON CONFLICT (category_code)
      DO UPDATE SET
        category_name = EXCLUDED.category_name,
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
        category_code: row.category_code,
        category_name: row.category_name,
        description: row.description,
      });
    })
    .on('end', async () => {
      for (const row of rows) {
        await upsertCategory(row.category_code, row.category_name, row.description);
      }
      console.log(`[${new Date().toLocaleTimeString()}] ✅ Category CSV data synced.`);
    });
}

// Watch for file changes
fs.watchFile(csvPath, { interval: 1000 }, (curr, prev) => {
  if (curr.mtime !== prev.mtime) {
    console.log('category_data.csv updated. Re-importing...');
    processCSV();
  }
});

console.log('Watching category_data.csv for changes...');
