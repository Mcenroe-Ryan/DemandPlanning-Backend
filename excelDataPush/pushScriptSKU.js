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

const csvPath = path.join(__dirname, 'skuData.csv');

// Insert or update SKU
async function upsertSKU(sku_code, sku_name, category_code, price, in_stock) {
  const client = await pool.connect();
  try {
    // Validate that the category exists first
    const res = await client.query('SELECT 1 FROM category WHERE category_code = $1', [category_code]);
    if (res.rowCount === 0) {
      console.warn(`❌ Category '${category_code}' not found. Skipping '${sku_code}'`);
      return;
    }

    await client.query(
      `
      INSERT INTO sku (sku_code, sku_name, category_code, price, in_stock)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (sku_code)
      DO UPDATE SET
        sku_name = EXCLUDED.sku_name,
        category_code = EXCLUDED.category_code,
        price = EXCLUDED.price,
        in_stock = EXCLUDED.in_stock
      `,
      [sku_code, sku_name, category_code, price, in_stock]
    );
  } catch (err) {
    console.error(`Error upserting ${sku_code}:`, err.message);
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
    sku_code: row.sku_code,
    sku_name: row.sku_name,
    category_code: row.category_code,
    price: parseFloat(row.price),
    in_stock: String(row.in_stock).toLowerCase() === 'true'
  });
})

    .on('end', async () => {
      for (const row of rows) {
        await upsertSKU(
          row.sku_code,
          row.sku_name,
          row.category_code,
          row.price,
          row.in_stock
        );
      }
      console.log(`[${new Date().toLocaleTimeString()}] ✅ SKU data synced.`);
    });
}

// Watch for file changes
fs.watchFile(csvPath, { interval: 1000 }, (curr, prev) => {
  if (curr.mtime !== prev.mtime) {
    console.log('sku_data_linked.csv updated. Re-importing...');
    processCSV();
  }
});

console.log('Watching sku_data_linked.csv for changes...');
