const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 5000;

const mainRoutes = require("./routes/masterDataRoutes");

const path = require("path");
const dotenv = require("dotenv");
//const envFile = process.env.NODE_ENV === "production" ? ".env.production" : ".env";

const envPath = process.env.NODE_ENV === "production" 
  ? path.resolve(__dirname, ".env.production") 
  : path.resolve(__dirname, ".env");

console.log(`✅ Loading environment file: ${envPath}`);
console.log(`📝 DB Host: ${process.env.DB_HOST || 'development'}`); 
dotenv.config({ path: envPath });

// dotenv.config({ path: path.resolve(__dirname, envFile) });
// Middleware
app.use(cors({
  origin: '*'
}));
app.use(express.json());

// Routes
app.use("/api", mainRoutes);

// Root route
app.get("/", (req, res) => {
  res.send("Backend API is running");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📝 DB Host: ${process.env.DB_HOST || 'development'}`);  
});
