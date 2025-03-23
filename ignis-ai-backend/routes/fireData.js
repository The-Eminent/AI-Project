//ignis-ai-backend/routes/fireData.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const mongoose = require('mongoose');
const Wildfire = require('../models/Wildfire'); // Import MongoDB Model
const Weather = require('../models/Weather'); // Import Weather Model
require('dotenv').config();

// Function to parse CSV data into JSON safely
const parseCSV = (csvData) => {
  const rows = csvData.split("\n").slice(1); // Remove header row
  const wildfireData = [];

  for (const row of rows) {
    const cols = row.split(",");

    // Ensure we have at least the required fields
    if (cols.length >= 5) {
      wildfireData.push({
        latitude: parseFloat(cols[0]),
        longitude: parseFloat(cols[1]),
        brightness: parseFloat(cols[2]),
        confidence: cols[3], // Keep confidence as a string to avoid parsing issues
        satellite: cols[4],
        timestamp: cols[5] ? new Date(cols[5]) : new Date() // Use API timestamp if available
      });
    }
  }
  return wildfireData;
};

// **Fetch NASA FIRMS Data**
router.get('/wildfires', async (req, res) => {
  try {
    const nasaFirmsURL = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${process.env.NASA_API_KEY}/VIIRS_SNPP_NRT/-125.0,24.0,-66.0,49.0/2`;

    console.log(`Fetching data from: ${nasaFirmsURL}`);

    // Fetch NASA FIRMS Data
    const response = await axios.get(nasaFirmsURL, {
      headers: { 'User-Agent': 'ignis-ai (chrisjuarez1596@gmail.com)' },
      responseType: 'text' // Ensure CSV is received as plain text
    });

    if (!response.data) {
      console.error("❌ No data received from NASA FIRMS API");
      return res.status(500).json({ error: "No data received from NASA FIRMS API" });
    }

    // Parse CSV Data
    const wildfireData = parseCSV(response.data);

    // Store in MongoDB only if data is valid
    if (wildfireData.length > 0) {
      await Wildfire.insertMany(wildfireData);
      console.log(`🔥 ${wildfireData.length} wildfire records saved to MongoDB.`);
    } else {
      console.log("⚠️ No valid wildfire data to save.");
    }

    res.json({
      message: 'NASA FIRMS wildfire data fetched and stored successfully',
      count: wildfireData.length,
      data: wildfireData
    });

  } catch (error) {
    console.error('❌ Error fetching wildfire data:', error.message);
    res.status(500).json({ error: 'Failed to fetch wildfire data', details: error.message });
  }
});

module.exports = router;