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

const getAllModels = async () => {
  try {
    const result = await query("select * from dim_models");
    return result.rows;
  } catch (err) {
    console.error("Database error:", err);
    throw err;
  }
};

const getAllEvents = async () => {
  try {
    const result = await query("select * from dim_event");
    return result.rows;
  } catch (err) {
    console.error("Database error:", err);
    throw err;
  }
};

const getAllAlertsAndErrors = async () => {
  try {
    const result = await query("select * from forecast_error");
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
  const model_name = filters.model_name || "XGBoost";
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

  const queryText = `SELECT 
      sum(actual_units) as actual_units,
      sum(baseline_forecast) as baseline_forecast,
      sum(ml_forecast) as ml_forecast,
      sum(sales_units) as sales_units, 
      sum(promotion_marketing) as promotion_marketing,
      sum(consensus_forecast) as consensus_forecast,
      sum(revenue_forecast_lakhs) as revenue_forecast_lakhs,
      sum(inventory_level_pct) as inventory_level_pct,
      AVG(stock_out_days) as stock_out_days,
      sum(on_hand_units) as on_hand_units,
      AVG(mape) AS avg_mape,
      month_name
    FROM public.weekly_demand_forecast
    WHERE ${whereClauses.join(" AND ")}
    GROUP BY month_name
    ORDER BY TO_DATE(month_name, 'FMMonth YYYY')
  `;
  const result = await query(queryText, values);
  return result.rows;
};

const getWeekForecastData = async (filters) => {
  const model_name = filters.model_name || "XGBoost";
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

  const queryText = `SELECT 
      sum(actual_units) as actual_units,
      sum(baseline_forecast) as baseline_forecast,
      sum(ml_forecast) as ml_forecast,
      sum(sales_units) as sales_units, 
      sum(promotion_marketing) as promotion_marketing,
      sum(consensus_forecast) as consensus_forecast,
      sum(revenue_forecast_lakhs) as revenue_forecast_lakhs,
      sum(inventory_level_pct) as inventory_level_pct,
      AVG(stock_out_days) as stock_out_days,
      sum(on_hand_units) as on_hand_units,
      AVG(mape) AS avg_mape,
      week_name
    FROM public.weekly_demand_forecast
    WHERE ${whereClauses.join(" AND ")}
    GROUP BY week_name
    ORDER BY week_name
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

// const updateConsensusForecast = async (payload) => {
//   const requiredParams = [
//     "country_name",
//     "state_name",
//     "city_name",
//     "plant_name",
//     "category_name",
//     "sku_code",
//     "channel_name",
//     "consensus_forecast",   
//     "target_month",        
//     "model_name",
//   ];

//   // 1) Validate required fields
//   for (const param of requiredParams) {
//     if (!(param in payload)) {
//       console.error(`Missing required parameter: ${param}`);
//       throw new Error(`Missing required parameter: ${param}`);
//     }
//   }

//   // 2) Parse target month into [monthStart, monthEnd]
//   if (!dayjs(payload.target_month, "YYYY-MM-DD", true).isValid()) {
//     console.error("Invalid target_month format. Received:", payload.target_month);
//     throw new Error("target_month must be in 'YYYY-MM-DD' format");
//   }
//   const monthStart = dayjs(payload.target_month).startOf("month").format("YYYY-MM-DD");
//   const monthEnd   = dayjs(payload.target_month).endOf("month").format("YYYY-MM-DD");

//   // 3) Parse consensus_forecast (monthly total)
//   const monthlyConsensus = Number(payload.consensus_forecast);
//   if (Number.isNaN(monthlyConsensus)) {
//     console.error("Invalid consensus_forecast value. Received:", payload.consensus_forecast);
//     throw new Error("consensus_forecast must be a valid number");
//   }

//   const model_name = payload.model_name || "XGBoost";
//   const arr = (v) => (Array.isArray(v) ? v : [v]);

//   const params = [
//     arr(payload.country_name),   
//     arr(payload.state_name),     
//     arr(payload.city_name),      
//     arr(payload.plant_name),     
//     arr(payload.category_name),  
//     arr(payload.sku_code),       
//     arr(payload.channel_name),   
//     model_name,                  
//     monthStart,                  
//     monthEnd,                    
//     monthlyConsensus,             
//   ];

// //   const sql = `
// //   WITH full_weeks AS (
// //     SELECT DISTINCT w.week_name
// //     FROM public.weekly_demand_forecast w
// //     WHERE w.country_name  = ANY($1)
// //       AND w.state_name    = ANY($2)
// //       AND w.city_name     = ANY($3)
// //       AND w.plant_name    = ANY($4)
// //       AND w.category_name = ANY($5)
// //       AND w.sku_code      = ANY($6)
// //       AND w.channel_name  = ANY($7)
// //       AND w.model_name    = $8
// //       -- only *full* weeks entirely within the month window
// //       AND w.week_start_date >= $9::date
// //       AND w.week_end_date   <= $10::date
// //   ),
// //   weeks_count AS (
// //     SELECT COUNT(*)::int AS weeks_in_month
// //     FROM full_weeks
// //   ),
// //   upd AS (
// //     UPDATE public.weekly_demand_forecast w
// //     SET consensus_forecast = CASE
// //       WHEN wc.weeks_in_month IS NULL OR wc.weeks_in_month = 0 THEN w.consensus_forecast
// //       ELSE ROUND($11::numeric / wc.weeks_in_month, 2)
// //     END
// //     FROM weeks_count wc
// //     WHERE w.country_name  = ANY($1)
// //       AND w.state_name    = ANY($2)
// //       AND w.city_name     = ANY($3)
// //       AND w.plant_name    = ANY($4)
// //       AND w.category_name = ANY($5)
// //       AND w.sku_code      = ANY($6)
// //       AND w.channel_name  = ANY($7)
// //       AND w.model_name    = $8
// //       -- update rows whose week is in the set of full weeks
// //       AND w.week_name IN (SELECT week_name FROM full_weeks)
// //     RETURNING w.week_name
// //   )
// //   SELECT (SELECT weeks_in_month FROM weeks_count) AS weeks_in_month,
// //          COUNT(*) AS rows_updated
// //   FROM upd;
// // `;
// const sql = `
// WITH full_weeks AS (
//   SELECT DISTINCT w.week_name
//   FROM public.weekly_demand_forecast w
//   WHERE w.country_name  = ANY($1)
//     AND w.state_name    = ANY($2)
//     AND w.city_name     = ANY($3)
//     AND w.plant_name    = ANY($4)
//     AND w.category_name = ANY($5)
//     AND w.sku_code      = ANY($6)
//     AND w.channel_name  = ANY($7)
//     AND w.model_name    = $8
//     AND w.week_start_date >= $9::date
//     AND w.week_end_date   <= $10::date
// ),
// weeks_count AS (
//   SELECT COUNT(*)::int AS weeks_in_month
//   FROM full_weeks
// ),
// upd AS (
//   UPDATE public.weekly_demand_forecast w
//   SET consensus_forecast = CASE
//     WHEN wc.weeks_in_month IS NULL OR wc.weeks_in_month = 0
//       THEN w.consensus_forecast
//     ELSE ($11::numeric / NULLIF(wc.weeks_in_month,0)::numeric)  -- no rounding
//   END
//   FROM weeks_count wc
//   WHERE w.country_name  = ANY($1)
//     AND w.state_name    = ANY($2)
//     AND w.city_name     = ANY($3)
//     AND w.plant_name    = ANY($4)
//     AND w.category_name = ANY($5)
//     AND w.sku_code      = ANY($6)
//     AND w.channel_name  = ANY($7)
//     AND w.model_name    = $8
//     AND w.week_name IN (SELECT week_name FROM full_weeks)
//   RETURNING w.week_name
// )
// SELECT (SELECT weeks_in_month FROM weeks_count) AS weeks_in_month,
//        COUNT(*) AS rows_updated
// FROM upd;
// `;

//   try {
//     const result = await query(sql, params);

//     const meta = result.rows?.[0] || { weeks_in_month: 0, rows_updated: 0 };
//     const weeksInMonth = Number(meta.weeks_in_month) || 0;
//     const rowsUpdated = Number(meta.rows_updated) || 0;

//     if (weeksInMonth === 0) {
//       return {
//         success: false,
//         message:
//           "No weekly rows found for the selected month with the given filters. Nothing updated.",
//         weeksInMonth,
//         rowsUpdated,
//       };
//     }

//     const perWeekValue = Number((monthlyConsensus / weeksInMonth).toFixed(2));

//     return {
//       success: true,
//       message: `Updated ${rowsUpdated} weekly row(s). Split ${monthlyConsensus} across ${weeksInMonth} week(s) => ${perWeekValue} per week.`,
//       modelUsed: model_name,
//       month: {
//         start: monthStart,
//         end: monthEnd,
//       },
//       weeksInMonth,
//       perWeekValue,
//       rowsUpdated,
//     };
//   } catch (error) {
//     console.error("Error updating consensus_forecast:", error);
//     throw new Error("Failed to update consensus_forecast");
//   }
// };
const updateConsensusForecast = async (payload) => {
  const requiredParams = [
    "country_name",
    "state_name",
    "city_name",
    "plant_name",
    "category_name",
    "sku_code",
    "channel_name",
    "consensus_forecast",
    "target_month",
    "model_name",
  ];

  // 1) Validate required fields
  for (const param of requiredParams) {
    if (!(param in payload)) {
      console.error(`Missing required parameter: ${param}`);
      throw new Error(`Missing required parameter: ${param}`);
    }
  }

  // 2) Parse target month into [monthStart, monthEnd]
  if (!dayjs(payload.target_month, "YYYY-MM-DD", true).isValid()) {
    console.error("Invalid target_month format. Received:", payload.target_month);
    throw new Error("target_month must be in 'YYYY-MM-DD' format");
  }
  const monthStart = dayjs(payload.target_month)
    .startOf("month")
    .format("YYYY-MM-DD");
  const monthEnd = dayjs(payload.target_month)
    .endOf("month")
    .format("YYYY-MM-DD");

  // 3) Parse consensus_forecast (monthly total)
  const monthlyConsensus = Number(payload.consensus_forecast);
  if (!Number.isFinite(monthlyConsensus) || Number.isNaN(monthlyConsensus)) {
    console.error(
      "Invalid consensus_forecast value. Received:",
      payload.consensus_forecast
    );
    throw new Error("consensus_forecast must be a valid number");
  }

  const model_name = payload.model_name || "XGBoost";
  const arr = (v) => (Array.isArray(v) ? v : [v]);

  const params = [
    arr(payload.country_name), // $1
    arr(payload.state_name), // $2
    arr(payload.city_name), // $3
    arr(payload.plant_name), // $4
    arr(payload.category_name), // $5
    arr(payload.sku_code), // $6
    arr(payload.channel_name), // $7
    model_name, // $8
    monthStart, // $9
    monthEnd, // $10
    monthlyConsensus, // $11
  ];

  const sql = `
WITH full_weeks AS (
  SELECT DISTINCT
    w.week_name,
    w.week_start_date
  FROM public.weekly_demand_forecast w
  WHERE w.country_name  = ANY($1)
    AND w.state_name    = ANY($2)
    AND w.city_name     = ANY($3)
    AND w.plant_name    = ANY($4)
    AND w.category_name = ANY($5)
    AND w.sku_code      = ANY($6)
    AND w.channel_name  = ANY($7)
    AND w.model_name    = $8
    AND w.week_start_date >= $9::date
    AND w.week_end_date   <= $10::date
),
weeks_count AS (
  SELECT COUNT(*)::int AS weeks_in_month
  FROM full_weeks
),
first_week AS (
  SELECT fw.week_name
  FROM full_weeks fw
  ORDER BY fw.week_start_date
  LIMIT 1
),
upd AS (
  UPDATE public.weekly_demand_forecast w
  SET consensus_forecast = CASE
    WHEN wc.weeks_in_month IS NULL OR wc.weeks_in_month = 0 THEN w.consensus_forecast
    WHEN fw.week_name IS NOT NULL
         AND w.week_name = fw.week_name
      THEN
        -- First week: base + remainder
        ($11::bigint / wc.weeks_in_month)
        + ($11::bigint % wc.weeks_in_month)
    ELSE
        -- Other weeks: base
        ($11::bigint / wc.weeks_in_month)
  END
  FROM weeks_count wc,
       first_week fw
  WHERE w.country_name  = ANY($1)
    AND w.state_name    = ANY($2)
    AND w.city_name     = ANY($3)
    AND w.plant_name    = ANY($4)
    AND w.category_name = ANY($5)
    AND w.sku_code      = ANY($6)
    AND w.channel_name  = ANY($7)
    AND w.model_name    = $8
    AND w.week_name IN (SELECT week_name FROM full_weeks)
  RETURNING w.week_name, w.consensus_forecast
)
SELECT
  (SELECT weeks_in_month FROM weeks_count) AS weeks_in_month,
  COUNT(*) AS rows_updated
FROM upd;
`;

  try {
    const result = await query(sql, params);

    const meta = result.rows?.[0] || { weeks_in_month: 0, rows_updated: 0 };
    const weeksInMonth = Number(meta.weeks_in_month) || 0;
    const rowsUpdated = Number(meta.rows_updated) || 0;

    if (weeksInMonth === 0) {
      return {
        success: false,
        message:
          "No weekly rows found for the selected month with the given filters. Nothing updated.",
        weeksInMonth,
        rowsUpdated,
      };
    }

    // Mirror the exact distribution logic used in SQL for transparency
    const base = Math.floor(monthlyConsensus / weeksInMonth);
    const remainder = monthlyConsensus % weeksInMonth;
    const firstWeekValue = base + remainder;
    const otherWeekValue = base;

    return {
      success: true,
      message:
        `Updated ${rowsUpdated} weekly row(s). ` +
        `Total ${monthlyConsensus} split over ${weeksInMonth} week(s): ` +
        `Week 1 = ${firstWeekValue}, Weeks 2-${weeksInMonth} = ${otherWeekValue} each.`,
      modelUsed: model_name,
      month: {
        start: monthStart,
        end: monthEnd,
      },
      weeksInMonth,
      distribution: {
        firstWeek: firstWeekValue,
        otherWeeks: otherWeekValue,
        remainder,
      },
      rowsUpdated,
    };
  } catch (error) {
    console.error("Error updating consensus_forecast:", error);
    throw new Error("Failed to update consensus_forecast");
  }
};


const getForecastAlertData = async (filters) => {
  const model_name = filters.model_name;

  let start_date, end_date;

  if (filters.startDate && filters.endDate) {
    start_date = filters.startDate;
    end_date = filters.endDate;
  } else {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

    let futureYear = now.getFullYear();
    let futureMonth = now.getMonth() + 6;
    if (futureMonth > 11) {
      futureYear += Math.floor(futureMonth / 12);
      futureMonth = futureMonth % 12;
    }
    const sixMonthsAhead = new Date(futureYear, futureMonth + 1, 0);

    start_date = sixMonthsAgo.toISOString().split("T")[0];
    end_date = sixMonthsAhead.toISOString().split("T")[0];
  }

  const whereClauses = [
    "model_name = $1",
    "sales_week_start BETWEEN $2 AND $3",
  ];
  const values = [model_name, start_date, end_date];
  let idx = 4;

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
      actual_units,
      ml_forecast,
      sales_week_start
    FROM public.weekly_sales_forecast
    WHERE ${whereClauses.join(" AND ")}
    ORDER BY sales_week_start  
  `;

  const result = await query(queryText, values);
  return result.rows;
};

//compare model queries
const getDsModels = async () => {
  try {
    const result = await query("select * from ds_model");
    return result.rows;
  } catch (err) {
    console.error("Database error:", err);
    throw err;
  }
};

const getDsModelsFeatures = async () => {
  try {
    const result = await query("select * from ds_model_features");
    return result.rows;
  } catch (err) {
    console.error("Database error:", err);
    throw err;
  }
};

const getDsModelMetrics = async () => {
  try {
    const result = await query("select * from ds_model_metric");
    return result.rows;
  } catch (err) {
    console.error("Database error:", err);
    throw err;
  }
};

const getFvaVsStats = async () => {
  try {
    const result = await query("select * from fva_vs_stats");
    return result.rows;
  } catch (err) {
    console.error("Database error:", err);
    throw err;
  }
};

const alertCountService = async () => {
  try {
    const result = await query(
      "SELECT COUNT(*) AS error_count FROM forecast_error WHERE error_type = 'error'"
    );
    // result.rows[0].error_count will be the count as a string, so convert to number if needed
    return Number(result.rows[0].error_count);
  } catch (err) {
    console.error("Database error:", err);
    throw err;
  }
};

const updateAlertsStrikethroughService = async (id, is_checked) => {
  const queryText = `
    UPDATE forecast_error
    SET is_checked = $1
    WHERE id = $2
    RETURNING *;
  `;
  const values = [is_checked, id];
  const result = await query(queryText, values);

  return result.rows[0];
};

const getDemandForecastFullScreen = async (filters) => {
  const { country_name, state_name, city_name, plant_name, category_name } =
    filters;

  const queryText = `
    SELECT
      country_name, state_name, city_name, plant_name,
      category_name, sku_code,
      SUM(actual_units) AS actual_units,
      SUM(baseline_forecast) AS baseline_forecast,
      SUM(ml_forecast) AS ml_forecast,
      SUM(sales_units) AS sales_units,
      SUM(promotion_marketing) AS promotion_marketing,
      SUM(consensus_forecast) AS consensus_forecast,
      SUM(revenue_forecast_lakhs) AS revenue_forecast_lakhs,
      AVG(inventory_level_pct) AS inventory_level_pct,
      AVG(stock_out_days) AS stock_out_days,
      SUM(on_hand_units) AS on_hand_units,
      AVG(mape) AS avg_mape,
      month_name
    FROM public.demand_forecast
    WHERE
      country_name = $1 AND
      state_name = $2 AND
      city_name = $3 AND
      plant_name = $4 AND
      category_name = $5
    GROUP BY month_name, country_name, state_name, city_name, plant_name, category_name, sku_code
    ORDER BY month_name ASC;
  `;

  const params = [
    country_name,
    state_name,
    city_name,
    plant_name,
    category_name,
  ];

  const { rows } = await query(queryText, params);
  return rows;
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
  getAllModels,
  getAllEvents,
  getAllAlertsAndErrors,
  getForecastAlertData,
  alertCountService,
  updateAlertsStrikethroughService,
  getDemandForecastFullScreen,
  getWeekForecastData,
//compare model 
  getDsModels,
  getDsModelsFeatures,
  getDsModelMetrics,
  getFvaVsStats,
};
