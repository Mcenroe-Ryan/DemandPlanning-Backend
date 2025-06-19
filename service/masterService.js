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
  const start_date = '2025-04-05';
  const end_date = '2025-10-01';

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

  console.log("======== DEBUG ========");
  console.log("Filters received:", filters);
  console.log("Query generated:", queryText);
  console.log("Values passed:", values);
  console.log("=======================");

  const result = await query(queryText, values);
  console.table(result.rows);
  return result.rows;
};

// module.exports = { getForecastData };

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

// const getForecastDataForTest = async ({
//   country_name,
//   state_name,
//   city_name,
//   plant_name,
//   category_name,
//   sku_code,
//   channel_name
// }) => {
//   console.log("Filter values received in backend:");
//   console.table({
//     country_name,
//     state_name,
//     city_name,
//     plant_name,
//     category_name,
//     sku_code,
//     channel_name
//   });

//   const queryText = `
//     SELECT 
//       SUM(actual_units) AS actual,
//       SUM(baseline_forecast) AS baseline_forecast,
//       SUM(ml_forecast) AS ml_forecast,
//       SUM(sales_units) AS sales_units,
//       SUM(promotion_marketing) AS promotion_marketing,
//       SUM(consensus_forecast) AS consensus_forecast,
//       SUM(revenue_forecast_lakhs) AS revenue_forecast_lakhs,
//       SUM(inventory_level_pct) AS inventory_level_pct,
//       SUM(stock_out_days) AS stock_out_days,
//       SUM(on_hand_units) AS on_hand_units,
//       month_name
//     FROM public.demand_forecast
//     WHERE 
//       country_name = $1 AND
//       state_name = $2 AND
//       city_name = $3 AND
//       plant_name = $4 AND
//       category_name = $5 AND
//       sku_code = $6 AND
//       channel_name = $7 AND
//       model_name = 'XGBoost' AND 
//       item_date BETWEEN '2025-05-01' AND '2025-09-01'
//     GROUP BY month_name
//     ORDER BY month_name;
//   `;

//   const values = [
//     country_name,
//     state_name,
//     city_name,
//     plant_name,
//     category_name,
//     sku_code,
//     channel_name
//   ];

//   try {
//     const result = await query(queryText, values);
//     console.log("Query executed. Row count:", result.rowCount);
//     console.table(result.rows);
//     return result.rows;
//   } catch (error) {
//     console.error("Query failed:", error.message);
//     throw error;
//   }
// };


module.exports = {
  // ...other exports
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
  getSkusByCategories
};
