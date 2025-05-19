// ignis-ai-backend/app.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./db'); 

dotenv.config();

const app = express();

// Connect to MongoDB
connectDB(); // Ensure MongoDB is connected before running the server

app.use(cors());
app.use(express.json());

//added for render deployment - Enable CORS for our Frontend Domain
app.use(cors({
  origin: 'https://ignis-ai-frontend.onrender.com'
}));

app.get('/', (req, res) => {
  res.send('Ignis AI Backend is running');
});


// Import API routes
const fireDataRoutes = require('./routes/fireData'); // Fire Data
const weatherRoutes = require('./routes/weather'); // Ensure this is imported
const topographyRoutes = require('./routes/topography'); // Topography Data
const humanFactorsRoutes = require('./routes/humanFactors'); // Human Factors Data
const predictFireSpreadRouter = require('./routes/predictFireSpread');

app.use('/api', fireDataRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/topography', topographyRoutes);
app.use('/api/human-factors', humanFactorsRoutes);
app.use('/api/predict-fire-spread', predictFireSpreadRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err.message);
  res.status(500).json({ error: "Internal Server Error", details: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
});