const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 5000;

const mainRoutes = require("./routes/masterDataRoutes");

// Middleware
app.use(cors({
  origin: 'http://localhost:5173'
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
});
