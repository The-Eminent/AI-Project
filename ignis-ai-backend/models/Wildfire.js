const mongoose = require('mongoose');

const WildfireSchema = new mongoose.Schema({
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  brightness: { type: Number, required: true },
  confidence: { type: String, required: true }, // Accepts both numeric & text values
  satellite: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Wildfire', WildfireSchema);