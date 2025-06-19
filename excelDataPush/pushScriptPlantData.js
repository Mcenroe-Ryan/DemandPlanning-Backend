// const fs = require('fs');
// const csv = require('csv-parser');
// const { Pool } = require('pg');
// const path = require('path');

// // PostgreSQL connection
// const pool = new Pool({
//   user: 'postgres',
//   host: 'localhost',
//   database: 'demandplanning',
//   password: 'root',
//   port: 5432,
// });

// const plantCsvPath = path.join(__dirname, 'PlantByState.csv');

// // Plant data insertion with city lookup
// async function insertPlant(plantCode, stateName) {
//   const client = await pool.connect();
//   try {
//     // Find matching city ID using state name
//     const cityRes = await client.query(
//       `SELECT id FROM city WHERE state = $1 LIMIT 1`,
//       [stateName]
//     );
    
//     if (!cityRes.rows.length) {
//       console.warn(`No city found for state ${stateName}. Skipping plant ${plantCode}`);
//       return;
//     }

//     await client.query(
//       `INSERT INTO plant (plant_code, plant_name, city_id)
//        VALUES ($1, $2, $3)
//        ON CONFLICT (plant_code)
//        DO UPDATE SET
//          plant_name = EXCLUDED.plant_name,
//          city_id = EXCLUDED.city_id`,
//       [plantCode, `${plantCode} Plant`, cityRes.rows[0].id]
//     );
//   } finally {
//     client.release();
//   }
// }

// // Process plant CSV data
// function processPlantCSV() {
//   const rows = [];
  
//   fs.createReadStream(plantCsvPath)
//     .pipe(csv())
//     .on('data', (row) => {
//       try {
//         const codes = JSON.parse(row['Plant Codes'].replace(/'/g, '"'));
//         codes.forEach(code => rows.push({
//           code: code.trim(),
//           state: row.State.trim()
//         }));
//       } catch (err) {
//         console.warn(`Invalid plant codes in ${row.State}`);
//       }
//     })
//     .on('end', async () => {
//       // Process plants sorted alphabetically
//       const sortedPlants = rows.sort((a, b) => 
//         a.code.localeCompare(b.code)
//       );
      
//       for (const plant of sortedPlants) {
//         await insertPlant(plant.code, plant.state);
//       }
//       console.log(`[${new Date().toLocaleTimeString()}] Plant data update completed`);
//     });
// }

// // Watch for file changes
// fs.watchFile(plantCsvPath, { interval: 1000 }, (curr, prev) => {
//   if (curr.mtime > prev.mtime) {
//     console.log('Detected changes in PlantByState.csv, re-importing...');
//     processPlantCSV();
//   }
// });

// // Initial import and start watching
// processPlantCSV();
// console.log('Watching PlantByState.csv for changes...');
const fs = require('fs');
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

const plantCsvPath = path.join(__dirname, 'PlantByState.csv');

// Reset ID sequence to start from 1
async function resetPlantSequence() {
  const client = await pool.connect();
  try {
    // Clear existing plant data
    await client.query('TRUNCATE TABLE plant RESTART IDENTITY CASCADE');
    console.log('Plant table cleared and ID sequence reset to 1');
  } finally {
    client.release();
  }
}

// Plant data insertion with enhanced naming
async function insertPlant(plantCode, stateName) {
  const client = await pool.connect();
  try {
    // Get city details for proper naming
    const cityRes = await client.query(
      `SELECT id, city, state FROM city WHERE state = $1 LIMIT 1`,
      [stateName]
    );
    
    if (!cityRes.rows.length) {
      console.warn(`No city found for state ${stateName}. Skipping plant ${plantCode}`);
      return;
    }

    const { id: cityId, city: cityName, state } = cityRes.rows[0];
    const plantName = `${cityName}-${state}-${plantCode}`;

    await client.query(
      `INSERT INTO plant (plant_code, plant_name, city_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (plant_code)
       DO UPDATE SET
         plant_name = EXCLUDED.plant_name,
         city_id = EXCLUDED.city_id`,
      [plantCode, plantName, cityId]
    );
  } finally {
    client.release();
  }
}

// Process plant CSV data
async function processPlantCSV() {
  const rows = [];
  
  fs.createReadStream(plantCsvPath)
    .pipe(csv())
    .on('data', (row) => {
      try {
        const codes = JSON.parse(row['Plant Codes'].replace(/'/g, '"'));
        codes.forEach(code => rows.push({
          code: code.trim(),
          state: row.State.trim()
        }));
      } catch (err) {
        console.warn(`Invalid plant codes in ${row.State}`);
      }
    })
    .on('end', async () => {
      // Reset sequence before inserting new data
      await resetPlantSequence();
      
      // Process plants sorted alphabetically
      const sortedPlants = rows.sort((a, b) => 
        a.code.localeCompare(b.code)
      );
      
      for (const plant of sortedPlants) {
        await insertPlant(plant.code, plant.state);
      }
      console.log(`[${new Date().toLocaleTimeString()}] Plant data updated with sequential IDs and enhanced naming`);
    });
}

// Alternative: Reset sequence without truncating (if you want to keep existing data)
async function resetSequenceOnly() {
  const client = await pool.connect();
  try {
    // Reset sequence to max ID + 1
    const result = await client.query('SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM plant');
    const nextId = result.rows[0].next_id;
    
    await client.query(
      `ALTER TABLE plant ALTER COLUMN id RESTART WITH ${nextId}`
    );
    console.log(`Plant ID sequence reset to start from ${nextId}`);
  } finally {
    client.release();
  }
}

// Watch for file changes
fs.watchFile(plantCsvPath, { interval: 1000 }, (curr, prev) => {
  if (curr.mtime > prev.mtime) {
    console.log('Detected changes in PlantByState.csv, re-importing...');
    processPlantCSV();
  }
});

// Initial import and start watching
processPlantCSV();
console.log('Watching PlantByState.csv for changes...');
