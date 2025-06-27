const { query } = require("../config/db");
const dayjs = require("dayjs");
const customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);

const getAllState = async () => {
  try {
    const result = await query("select * from dim_state where country_id = 1");
    return result.rows;
  } catch (err) {
    console.error("Database error:", err);
    throw err;
  }
};

const getAllCities = async () => {
  try {
    const result = await query("select * from dim_city where state_id = 1");
    return result.rows;
  } catch (err) {
    console.error("Database error:", err);
    throw err;
  }
};

const getAllCountries = async () => {
  try {
    const result = await query("select * from dim_country");
    return result.rows;
  } catch (err) {
    console.error("Database error:", err);
    throw err;
  }
};

const getAllPlants = async () => {
  try {
    const result = await query("select * from dim_plant where city_id = 2");
    return result.rows;
  } catch (err) {
    console.error("Database error:", err);
    throw err;
  }
};

const getAllCategories = async () => {
  try {
    const result = await query("select * from dim_category");
    return result.rows;
  } catch (err) {
    console.error("Database error:", err);
    throw err;
  }
};

const getAllSkus = async () => {
  try {
    const result = await query("select * from dim_sku where category_id = 2");
    return result.rows;
  } catch (err) {
    console.error("Database error:", err);
    throw err;
  }
};

const getAllChannels = async () => {
  try {
    const result = await query("select * from dim_channel");
    return result.rows;
  } catch (err) {
    console.error("Database error:", err);
    throw err;
  }
};

const getPlantsByCity = async (city_id) => {
  const result = await query("SELECT * FROM dim_plant WHERE city_id = $1", [
    city_id,
  ]);
  return result.rows;
};

const getCategoriesByPlant = async (plant_id) => {
  const result = await query("SELECT * FROM dim_category WHERE plant_id = $1", [
    plant_id,
  ]);
  return result.rows;
};

const getSkusByCategory = async (category_id) => {
  const result = await query("SELECT * FROM dim_sku WHERE category_id = $1", [
    category_id,
  ]);
  return result.rows;
};

const getForecastData = async (filters) => {
  const model_name = "XGBoost";
  const start_date = filters.startDate;
  const end_date = filters.endDate;
  const whereClauses = ["model_name = $1", "item_date BETWEEN $2 AND $3"];
  const values = [model_name, start_date, end_date];
  let idx = 4;

  // Map incoming filter keys to DB column names
  const filterMap = {
    country: "country_name",
    state: "state_name",
    cities: "city_name",
    plants: "plant_name",
    categories: "category_name",
    skus: "sku_code",
    channels: "channel_name",
  };

  for (const [inputKey, columnName] of Object.entries(filterMap)) {
    const val = filters[inputKey];
    if (val) {
      if (Array.isArray(val) && val.length > 0) {
        whereClauses.push(`${columnName} = ANY($${idx})`);
        values.push(val);
      } else if (typeof val === "string" || typeof val === "number") {
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
    WHERE ${whereClauses.join(" AND ")}
    GROUP BY month_name
    ORDER BY TO_DATE(month_name, 'FMMonth YYYY')
  `;
  const result = await query(queryText, values);
  return result.rows;
};

// Get States by Country (accepts array of state_ids)
const getStatesByCountry = async (countryIds) => {
  if (!countryIds || countryIds.length === 0) return [];
  const placeholders = countryIds.map((_, i) => `$${i + 1}`).join(", ");
  const result = await query(
    `SELECT * FROM dim_state WHERE country_id IN (${placeholders})`,
    countryIds
  );
  return result.rows;
};

// Get Cities by State (accepts array of state_ids)
const getCitiesByStates = async (stateIds) => {
  if (!stateIds || stateIds.length === 0) return [];
  const placeholders = stateIds.map((_, i) => `$${i + 1}`).join(", ");
  const result = await query(
    `SELECT * FROM dim_city WHERE state_id IN (${placeholders})`,
    stateIds
  );
  return result.rows;
};

// Get Plants by City (accepts array of city_ids)
const getPlantsByCities = async (cityIds) => {
  if (!cityIds || cityIds.length === 0) return [];
  const placeholders = cityIds.map((_, i) => `$${i + 1}`).join(", ");
  const result = await query(
    `SELECT * FROM dim_plant WHERE city_id IN (${placeholders})`,
    cityIds
  );
  return result.rows;
};

// Get Categories by Plant (accepts array of plant_ids)
const getCategoriesByPlants = async (plantIds) => {
  if (!plantIds || plantIds.length === 0) return [];
  const placeholders = plantIds.map((_, i) => `$${i + 1}`).join(", ");
  const result = await query(
    `SELECT * FROM dim_category WHERE plant_id IN (${placeholders})`,
    plantIds
  );
  return result.rows;
};

// Get SKUs by Category (accepts array of category_ids)
const getSkusByCategories = async (categoryIds) => {
  if (!categoryIds || categoryIds.length === 0) return [];
  const placeholders = categoryIds.map((_, i) => `$${i + 1}`).join(", ");
  const result = await query(
    `SELECT * FROM dim_sku WHERE category_id IN (${placeholders})`,
    categoryIds
  );
  return result.rows;
};

const updateConsensusForecast = async (payload) => {
  // console.log("Received payload:", payload);

  const requiredParams = [
    "country_name",
    "state_name",
    "city_name",
    "plant_name",
    "category_name",
    "sku_code",
    "channel_name",
    "start_date",
    "end_date",
    "consensus_forecast",
    "latest_actual_month",
  ];

  // 1. Validate required fields
  for (const param of requiredParams) {
    if (!(param in payload)) {
      console.error(`Missing required parameter: ${param}`);
      throw new Error(`Missing required parameter: ${param}`);
    }
  }

  // 2. Parse and validate latest_actual_month
  let latestActualMonth;

  if (dayjs(payload.latest_actual_month, "MMMM-YYYY", true).isValid()) {
    latestActualMonth = dayjs(payload.latest_actual_month, "MMMM-YYYY")
      .endOf("month")
      .format("YYYY-MM-DD");
  } else if (dayjs(payload.latest_actual_month, "YYYY-MM-DD", true).isValid()) {
    latestActualMonth = dayjs(payload.latest_actual_month, "YYYY-MM-DD")
      .endOf("month")
      .format("YYYY-MM-DD");
  } else {
    console.error(
      "Invalid latest_actual_month format. Received:",
      payload.latest_actual_month
    );
    throw new Error(
      "latest_actual_month must be in 'MMMM-YYYY' or 'YYYY-MM-DD' format"
    );
  }

  console.log(
    `Converted latest_actual_month ('${payload.latest_actual_month}') to end of month: ${latestActualMonth}`
  );

  // 3. Validate and parse consensus_forecast
  const consensusValue = Number(payload.consensus_forecast);
  if (isNaN(consensusValue)) {
    console.error(
      "Invalid consensus_forecast value. Received:",
      payload.consensus_forecast
    );
    throw new Error("consensus_forecast must be a valid number");
  }

  // 4. Prepare SQL parameters
  const model_name = "XGBoost";
  const arr = (v) => (Array.isArray(v) ? v : [v]);

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
    payload.end_date,
    latestActualMonth,
  ];

  console.log("Prepared SQL parameters:", params);

  // 5. SQL query
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
      AND item_date > $12
  `;

  console.log("SQL Query to execute:\n", sql);

  // 6. Execute query
  try {
    const result = await query(sql, params);
    console.log(`Updated ${result.rowCount} row(s) for consensus_forecast.`);
    return {
      success: true,
      message: `Updated ${result.rowCount} record(s) for consensus_forecast.`,
      updatedCount: result.rowCount,
    };
  } catch (error) {
    console.error("Error updating consensus_forecast:", error);
    throw new Error("Failed to update consensus_forecast");
  }
};

module.exports = {
  // demand_planning code
  getAllState,
  getAllCategories,
  getAllChannels,
  getAllCities,
  getAllPlants,
  getAllSkus,
  getAllCountries,
  getStatesByCountry,
  getPlantsByCity,
  getCategoriesByPlant,
  getSkusByCategory,
  getForecastData,
  getCitiesByStates,
  getPlantsByCities,
  getCategoriesByPlants,
  getSkusByCategories,
  updateConsensusForecast,
};
