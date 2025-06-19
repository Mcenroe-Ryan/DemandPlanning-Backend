const csv = require('csv-parser');
const { Pool } = require('pg');
const path = require('path');

// PostgreSQL connection
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'demandplanning',
  password: 'root',
  port: 5432,
});

const csvPath = path.join(__dirname, 'CityData.csv');

// Insert one city row
async function insertCity(city, state, tier, country) {
  const client = await pool.connect();
  try {
    await client.query(
      `
      INSERT INTO city (city, state, tier, country)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (city, state)
      DO UPDATE SET 
        tier = EXCLUDED.tier,
        country = EXCLUDED.country
      `,
      [city, state, tier, country]
    );
    console.log(`Inserted/updated city: ${city}, ${state}, ${tier}, ${country}`);
  } catch (err) {
    console.error(`Error upserting ${city}:`, err.message);
  } finally {
    client.release();
  }
}

// Insert one plant row (example, adjust as needed)
async function insertPlant(plant_code, plant_name, city_name) {
  const client = await pool.connect();
  try {
    await client.query(
      `
      INSERT INTO plant (plant_code, plant_name, city_name)
      VALUES ($1, $2, $3)
      ON CONFLICT (plant_code)
      DO UPDATE SET 
        plant_name = EXCLUDED.plant_name,
        city_name = EXCLUDED.city_name
      `,
      [plant_code, plant_name, city_name]
    );
    console.log(`Inserted/updated plant: ${plant_code}, ${plant_name}, ${city_name}`);
  } catch (err) {
    console.error(`Error upserting plant ${plant_code}:`, err.message);
  } finally {
    client.release();
  }
}

// Parse CSV and insert data
function processCSV() {
  fs.createReadStream(csvPath)
    .pipe(csv())
    .on('data', (row) => {
      // Insert city data if present
      const { City, State, Tier, Country } = row;
      if (City && State && Tier && Country) {
        insertCity(
          City.trim(),
          State.trim(),
          Tier.trim(),
          Country.trim()
        );
      }

      // Insert plant data if 'Plant Codes' column exists and is not empty
      if (row['Plant Codes'] && row['Plant Codes'].trim()) {
        try {
          const codes = JSON.parse(row['Plant Codes'].replace(/'/g, '"'));
          if (Array.isArray(codes)) {
            codes.forEach(code => {
              insertPlant(
                code.trim(),
                `${code.trim()} Plant`,
                State && State.trim ? State.trim() : ''
              );
            });
          }
        } catch (err) {
          console.warn(`Skipping invalid row: ${State} -> ${row['Plant Codes']}`);
        }
      }
    })
    .on('end', () => {
      console.log('Finished importing CityData.csv');
    });
}

// Watch file for changes
fs.watchFile(csvPath, { interval: 1000 }, (curr, prev) => {
  if (curr.mtime !== prev.mtime) {
    console.log('Detected change in CityData.csv. Re-importing...');
    processCSV();
  }
});

console.log('Watching CityData.csv for changes...');
processCSV(); // Initial import
