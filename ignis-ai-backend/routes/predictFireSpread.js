const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');

router.post('/', (req, res) => {
  // Get fire data from request
  const fireData = req.body;
  
  // Validate input
  if (!fireData || !fireData.lat || !fireData.lng) {
    return res.status(400).json({ error: 'Missing required fire location data' });
  }
  
  // Call Python prediction script
  const pythonScript = path.join(__dirname, '../ml/predict_spread.py');
  const python = spawn('D:\\AI_Class_Project\\IgnisAI\\ignis-ai-backend\\ml\\venv\\Scripts\\python', 
    [pythonScript, JSON.stringify(fireData)]);
  
  let result = '';
  let errorOutput = '';
  
  // Collect data from script
  python.stdout.on('data', (data) => {
    result += data.toString();
  });
  
  python.stderr.on('data', (data) => {
    errorOutput += data.toString();
  });
  
  // Handle script completion
  python.on('close', (code) => {
    if (code !== 0) {
      console.error('Python script error:', errorOutput);
      return res.status(500).json({ 
        error: 'Fire spread prediction failed',
        details: errorOutput
      });
    }
    
    try {
      // Parse and return the prediction results
      const prediction = JSON.parse(result);
      res.json(prediction);
    } catch (e) {
      console.error('Failed to parse prediction results:', e);
      res.status(500).json({ 
        error: 'Failed to parse prediction results',
        details: e.message
      });
    }
  });
});

module.exports = router;
