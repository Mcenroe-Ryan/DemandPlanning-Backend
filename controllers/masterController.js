const { query } = require("../config/db"); // Adjust path if needed

const {
  // getAllCities,
  // getAllPlants,
  // getAllCategories,
  // getAllSkus,
  // getAllChannels,
  // getAllDemandForecasts,
  // getAllModels,
  // getAllForecastData,
  getAllState,
  getAllCategories,
  getAllChannels,
  getAllCities,
  getAllPlants,
  getAllSkus,
  getAllCountries,
  getStatesByCountry,
  getCitiesByState,
  getPlantsByCity,
  getCategoriesByPlant,
  getSkusByCategory,
  getForecastData,
  getForecastDataForTest,
  updateConsensusForecast,
  getAllModels,
  getAllEvents
} = require("../service/masterService");

const getAllStateData = async (req, res) => {
  try {
    const result = await getAllState();
    res.json(result);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getAllCitiesData = async (req, res) => {
  try {
    const result = await getAllCities();
    res.json(result);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getAllCategoriesData = async (req, res) => {
  try {
    const result = await getAllCategories();
    res.json(result);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getAllSkusData = async (req, res) => {
  try {
    const result = await getAllSkus();
    res.json(result);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getAllChannelsData = async (req, res) => {
  try {
    const result = await getAllChannels();
    res.json(result);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const getAllPlantsData = async (req, res) => {
  try {
    const result = await getAllPlants();
    res.json(result);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const getAllCountriesData = async (req, res) => {
  try {
    const result = await getAllCountries();
    res.json(result);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getAllModelsData = async (req, res) => {
  try {
    const result = await getAllModels();
    res.json(result);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getAllEventsData = async (req, res) => {
  try {
    const result = await getAllEvents();
    res.json(result);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// GET /states?country_id=1
const fetchStates = async (req, res) => {
  try {
    const { country_id } = req.query;
    const states = await getStatesByCountry(country_id);
    res.json(states);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching states");
  }
};
// GET /cities?state_id=1
const fetchCities = async (req, res) => {
  try {
    const { state_id } = req.query;
    const cities = await getCitiesByState(state_id);
    res.json(cities);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching cities");
  }
};

// GET /plants?city_id=1
const fetchPlants = async (req, res) => {
  try {
    const { city_id } = req.query;
    const plants = await getPlantsByCity(city_id);
    res.json(plants);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching plants");
  }
};

// GET /categories?plant_id=1
const fetchCategories = async (req, res) => {
  try {
    const { plant_id } = req.query;
    const categories = await getCategoriesByPlant(plant_id);
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching categories");
  }
};

// GET /skus?category_id=1
const fetchSkus = async (req, res) => {
  try {
    const { category_id } = req.query;
    const skus = await getSkusByCategory(category_id);
    res.json(skus);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching SKUs");
  }
};

// GET /forecast?country_name=India&state_name=...&start_date=...&end_date=...
const fetchForecastData = async (req, res) => {
  try {
    const filters = req.query;
    const data = await getForecastData(filters);
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching forecast data");
  }
};
const getForecastDataController = async (req, res) => {
  try {
    const data = await getForecastDataForTest();
    res.json(data);
  } catch (err) {
    console.error("Forecast fetch error:", err);
    res.status(500).json({ message: "Failed to fetch Forecast" });
  }
};

// In your backend controller (masterController.js)
const getPlantsByCities = async (city_ids) => {
  const result = await query(
    "SELECT * FROM dim_plant WHERE city_id = ANY($1)",
    [city_ids]
  );
  return result.rows;
};

module.exports = {
  getAllCountriesData,
  getAllStateData,
  getAllCitiesData,
  getAllCategoriesData,
  getAllChannelsData,
  getAllSkusData,
  getAllPlantsData,
  fetchStates,
  fetchCities,
  fetchPlants,
  fetchCategories,
  fetchSkus,
  fetchForecastData,
  getForecastDataController,
  getPlantsByCities,
  getAllModelsData,
  getAllEventsData
};
