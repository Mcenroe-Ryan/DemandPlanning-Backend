const { query } = require("../config/db");


const getAllState = async () => {
  try {
    const result = await query('select * from dim_state where country_id = 1');
    return result.rows; 
  } catch (err) {
    console.error('Database error:', err); 
    throw err; 
  }
};

const getAllCities = async () => {
  try {
    const result = await query('select * from dim_city where state_id = 1');
    return result.rows; 
  } catch (err) {
    console.error('Database error:', err); 
    throw err; 
  }
};
const getAllCountries = async () => {
  try {
    const result = await query('select * from dim_country');
    return result.rows; 
  } catch (err) {
    console.error('Database error:', err); 
    throw err; 
  }
};

const getAllPlants = async () => {
  try {
    const result = await query('select * from dim_plant where city_id = 2');
    return result.rows; 
  } catch (err) {
    console.error('Database error:', err); 
    throw err; 
  }
};

const getAllCategories = async () => {
  try {
    const result = await query('select * from dim_category');
    return result.rows; 
  } catch (err) {
    console.error('Database error:', err); 
    throw err; 
  }
};
const getAllSkus = async () => {
  try {
    const result = await query('select * from dim_sku where category_id = 2');
    return result.rows; 
  } catch (err) {
    console.error('Database error:', err); 
    throw err; 
  }
};
const getAllChannels = async () => {
  try {
    const result = await query('select * from dim_channel');
    return result.rows; 
  } catch (err) {
    console.error('Database error:', err); 
    throw err; 
  }
};

const getPlantsByCity = async (city_id) => {
  const result = await query('SELECT * FROM dim_plant WHERE city_id = $1', [city_id]);
  return result.rows;
};

const getCategoriesByPlant = async (plant_id) => {
  const result = await query('SELECT * FROM dim_category WHERE plant_id = $1', [plant_id]);
  return result.rows;
};

const getSkusByCategory = async (category_id) => {
  const result = await query('SELECT * FROM dim_sku WHERE category_id = $1', [category_id]);
  return result.rows;
};

const getForecastData = async (filters) => {
  const model_name = 'XGBoost';
  
  // Extract start_date and end_date from filters, with fallback to default values
  const start_date = filters.startDate || '2025-04-05';
  const end_date = filters.endDate || '2025-09-01';

  const whereClauses = ['model_name = $1', 'item_date BETWEEN $2 AND $3'];
  const values = [model_name, start_date, end_date];
  let idx = 4;

  // Map incoming filter keys to DB column names
  const filterMap = {
    country: 'country_name',
    state: 'state_name',
    cities: 'city_name',
    plants: 'plant_name',
    categories: 'category_name',
    skus: 'sku_code',
    channels: 'channel_name',
  };

  for (const [inputKey, columnName] of Object.entries(filterMap)) {
    const val = filters[inputKey];
    if (val) {
      if (Array.isArray(val) && val.length > 0) {
        whereClauses.push(`${columnName} = ANY($${idx})`);
        values.push(val);
      } else if (typeof val === 'string' || typeof val === 'number') {
        whereClauses.push(`${columnName} = $${idx}`);
        values.push(val);
      }
      idx++;
    }
  }

  const queryText = `
    SELECT 
      sum(actual_units) as actual_units,
      sum(baseline_forecast) as baseline_forecast,
      sum(ml_forecast) as ml_forecast,
      sum(sales_units) as sales_units, 
      sum(promotion_marketing) as promotion_marketing,
      sum(consensus_forecast) as consensus_forecast,
      sum(revenue_forecast_lakhs) as revenue_forecast_lakhs,
      sum(inventory_level_pct) as inventory_level_pct,
      sum(stock_out_days) as stock_out_days,
      sum(on_hand_units) as on_hand_units,
      month_name
    FROM public.demand_forecast
    WHERE ${whereClauses.join(' AND ')}
    GROUP BY month_name
    ORDER BY TO_DATE(month_name, 'FMMonth YYYY')
  `;

  // console.log("======== FORECAST DATA DEBUG ========");
  // console.log("📅 Date Range Applied:");
  // console.log(`   Start Date: ${start_date}`);
  // console.log(`   End Date: ${end_date}`);
  // console.log("🔍 All Filters received:", filters);
  // console.log("📝 Generated SQL Query:");
  // console.log(queryText);
  // console.log("🎯 Query Parameters:");
  // console.log("   $1 (model_name):", values[0]);
  // console.log("   $2 (start_date):", values[1]);
  // console.log("   $3 (end_date):", values[2]);
  values.slice(3).forEach((val, i) => {
    console.log(`   $${i + 4}:`, val);
  });
  const result = await query(queryText, values);
  // console.log("📊 Query Results:");
  // console.log(`   Rows returned: ${result.rows.length}`);
  // if (result.rows.length > 0) {
  //   console.log("   Data preview:");
  //   console.table(result.rows);
  // } else {
  //   console.log("   ⚠️  No data found for the selected date range and filters");
  // }
  return result.rows;
};

const getForecastDataForTest = async () => {
  const result = await query(`
    SELECT 
      sum(actual_units) as actual_units,
      sum(baseline_forecast) as baseline_forecast,
      sum(ml_forecast) as ml_forecast,
      sum(sales_units) as sales_units, 
      sum(promotion_marketing) as promotion_marketing,
      sum(consensus_forecast) as consensus_forecast,
      sum(revenue_forecast_lakhs) as revenue_forecast_lakhs,
      sum(inventory_level_pct) as inventory_level_pct,
      sum(stock_out_days) as stock_out_days,
      sum(on_hand_units) as on_hand_units,
      month_name
    FROM public.demand_forecast	
    WHERE 
      country_name = 'India' AND 
      state_name = 'Gujarat' AND 
      city_name = 'Ahmedabad' AND 
      plant_name = 'GUJ123' AND 
      category_name = 'Beverages' AND 
      sku_code = 'SKU-TEA' AND 
      channel_name = 'MT' AND 
      model_name = 'XGBoost' AND 
      item_date BETWEEN '2025-04-01' AND '2025-10-01'		
    GROUP BY month_name 
    ORDER BY TO_DATE(month_name, 'FMMonth YYYY')
  `);
  return result.rows;
};

// Get States by Country (accepts array of state_ids)
const getStatesByCountry = async (countryIds) => {
  if (!countryIds || countryIds.length === 0) return [];
  const placeholders = countryIds.map((_, i) => `$${i + 1}`).join(', ');
  const result = await query(
    `SELECT * FROM dim_state WHERE country_id IN (${placeholders})`,
    countryIds
  );
  return result.rows;
};

// Get Cities by State (accepts array of state_ids)
const getCitiesByStates = async (stateIds) => {
  if (!stateIds || stateIds.length === 0) return [];
  const placeholders = stateIds.map((_, i) => `$${i + 1}`).join(', ');
  const result = await query(
    `SELECT * FROM dim_city WHERE state_id IN (${placeholders})`,
    stateIds
  );
  return result.rows;
};

// Get Plants by City (accepts array of city_ids)
const getPlantsByCities = async (cityIds) => {
  if (!cityIds || cityIds.length === 0) return [];
  const placeholders = cityIds.map((_, i) => `$${i + 1}`).join(', ');
  const result = await query(
    `SELECT * FROM dim_plant WHERE city_id IN (${placeholders})`,
    cityIds
  );
  return result.rows;
};

// Get Categories by Plant (accepts array of plant_ids)
const getCategoriesByPlants = async (plantIds) => {
  if (!plantIds || plantIds.length === 0) return [];
  const placeholders = plantIds.map((_, i) => `$${i + 1}`).join(', ');
  const result = await query(
    `SELECT * FROM dim_category WHERE plant_id IN (${placeholders})`,
    plantIds
  );
  return result.rows;
};

// Get SKUs by Category (accepts array of category_ids)
const getSkusByCategories = async (categoryIds) => {
  if (!categoryIds || categoryIds.length === 0) return [];
  const placeholders = categoryIds.map((_, i) => `$${i + 1}`).join(', ');
  const result = await query(
    `SELECT * FROM dim_sku WHERE category_id IN (${placeholders})`,
    categoryIds
  );
  return result.rows;
};
// const updateConsensusForecast = async (payload) => {
//   // Print payload for debugging
//   console.log("Received updateConsensusForecast payload:");
//   console.table(payload);
//   // Validate required parameters
//   const requiredParams = [
//     'country_name', 'state_name', 'city_name', 'plant_name',
//     'category_name', 'sku_code', 'channel_name', 'model_name',
//     'start_date', 'end_date', 'consensus_forecast'
//   ];

//   for (const param of requiredParams) {
//     console.log("Update query params:");
//     console.table(params);
//     if (!(param in payload)) {
//       throw new Error(`Missing required parameter: ${param}`);
//     }
//   }

//   // Construct parameterized SQL query
//   const sql = `
//     UPDATE public.demand_forecast
//     SET consensus_forecast = $1
//     WHERE country_name = $2
//       AND state_name = $3
//       AND city_name = $4
//       AND plant_name = $5
//       AND category_name = $6
//       AND sku_code = $7
//       AND channel_name = $8
//       AND model_name = $9
//       AND item_date BETWEEN $10 AND $11
//   `;

//   // Parameter values in correct order
//   const params = [
//     payload.consensus_forecast,
//     payload.country_name,
//     payload.state_name,
//     payload.city_name,
//     payload.plant_name,
//     payload.category_name,
//     payload.sku_code,
//     payload.channel_name,
//     payload.model_name,
//     payload.start_date,
//     payload.end_date
//   ];

//   try {
//     const result = await query(sql, params);
//     return {
//       success: true,
//       message: `Updated ${result.rowCount} record(s)`,
//       updatedCount: result.rowCount
//     };
//   } catch (error) {
//     console.error('Database update error:', error);
//     throw new Error('Failed to update consensus forecast');
//   }
// };
const updateConsensusForecast = async (payload) => {
  console.log("Received updateConsensusForecast payload:");
  console.table(payload);

  const requiredParams = [
    'country_name', 'state_name', 'city_name', 'plant_name',
    'category_name', 'sku_code', 'channel_name',
    'start_date', 'end_date', 'consensus_forecast'
  ];
  for (const param of requiredParams) {
    if (!(param in payload)) {
      const errorMsg = `Missing required parameter: ${param}`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
  }

  const model_name = 'XGBoost';
  const arr = v => Array.isArray(v) ? v : [v];
  const consensusValue = Number(payload.consensus_forecast);

  if (isNaN(consensusValue)) {
    throw new Error("consensus_forecast must be a number");
  }

  const params = [
    consensusValue,
    arr(payload.country_name),
    arr(payload.state_name),
    arr(payload.city_name),
    arr(payload.plant_name),
    arr(payload.category_name),
    arr(payload.sku_code),
    arr(payload.channel_name),
    model_name,
    payload.start_date,
    payload.end_date
  ];

  console.log("Executing update query with parameters:");
  // console.table(params);

  // Debug SELECT
  const debugSql = `
    SELECT COUNT(*) FROM public.demand_forecast
    WHERE country_name = ANY($1)
      AND state_name = ANY($2)
      AND city_name = ANY($3)
      AND plant_name = ANY($4)
      AND category_name = ANY($5)
      AND sku_code = ANY($6)
      AND channel_name = ANY($7)
      AND model_name = $8
      AND item_date BETWEEN $9 AND $10
  `;

  const debugParams = params.slice(1); // remove consensus_forecast
  const debugResult = await query(debugSql, debugParams);
  console.log("Matching rows for update:", debugResult.rows[0]?.count);

  if (debugResult.rows[0]?.count === "0") {
    return {
      success: false,
      message: "No matching rows found for update",
      updatedCount: 0,
    };
  }

  const sql = `
    UPDATE public.demand_forecast
    SET consensus_forecast = $1
    WHERE country_name = ANY($2)
      AND state_name = ANY($3)
      AND city_name = ANY($4)
      AND plant_name = ANY($5)
      AND category_name = ANY($6)
      AND sku_code = ANY($7)
      AND channel_name = ANY($8)
      AND model_name = $9
      AND item_date BETWEEN $10 AND $11
  `;

  try {
    const result = await query(sql, params);
    console.log(`Database update affected ${result.rowCount} row(s).`);
    return {
      success: true,
      message: `Updated ${result.rowCount} record(s)`,
      updatedCount: result.rowCount
    };
  } catch (error) {
    console.error('Database update error:', error);
    throw new Error('Failed to update consensus forecast');
  }
};




module.exports = {
  // ...other exports
  updateConsensusForecast,
  getCitiesByStates,
  getPlantsByCities,
  getCategoriesByPlants,
  getSkusByCategories
};


module.exports = {
  //demand_planning code
  getAllState,
  getAllCategories,
  getAllChannels,
  getAllCities,
  getAllPlants,
  getAllSkus,
  getAllCountries,
  getStatesByCountry,
  // getCitiesByState,
  getPlantsByCity,
  getCategoriesByPlant,
  getSkusByCategory,
  getForecastData,
  getForecastDataForTest,

  ///
  getForecastData,
  getCitiesByStates,
  getPlantsByCities,
  getCategoriesByPlants,
  getSkusByCategories,
  updateConsensusForecast
};
