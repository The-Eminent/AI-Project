// const express = require('express');
// const router = express.Router();
// const { spawn } = require('child_process');
// const path = require('path');

// router.post('/', (req, res) => {
//   // Get fire data from request
//   const fireData = req.body;
  
//   // Validate input
//   if (!fireData || !fireData.lat || !fireData.lng) {
//     return res.status(400).json({ error: 'Missing required fire location data' });
//   }
  
//   // Call Python prediction script
//   const pythonScript = path.join(__dirname, '../ml/predict_spread.py');
//   const python = spawn('D:\\AI_Class_Project\\IgnisAI\\ignis-ai-backend\\ml\\venv\\Scripts\\python', 
//     [pythonScript, JSON.stringify(fireData)]);
  
//   let result = '';
//   let errorOutput = '';
  
//   // Collect data from script
//   python.stdout.on('data', (data) => {
//     result += data.toString();
//   });
  
//   python.stderr.on('data', (data) => {
//     errorOutput += data.toString();
//   });
  
//   // Handle script completion
//   python.on('close', (code) => {
//     if (code !== 0) {
//       console.error('Python script error:', errorOutput);
//       return res.status(500).json({ 
//         error: 'Fire spread prediction failed',
//         details: errorOutput
//       });
//     }
    
//     try {
//       // Parse and return the prediction results
//       const prediction = JSON.parse(result);
//       res.json(prediction);
//     } catch (e) {
//       console.error('Failed to parse prediction results:', e);
//       res.status(500).json({ 
//         error: 'Failed to parse prediction results',
//         details: e.message
//       });
//     }
//   });
// });

// module.exports = router;



// ------------------------------local run code above-------------------


// routes/predictFireSpread.js
const express = require('express');
const router  = express.Router();
const { spawn } = require('child_process');
const path = require('path');

// allow override via env, otherwise use python3 → python
const PYTHON = process.env.PYTHON_COMMAND || 'python3';

router.post('/', (req, res) => {
  const fireData = req.body;
  if (!fireData || fireData.lat == null || fireData.lng == null) {
    return res
      .status(400)
      .json({ error: 'Missing required fire location data (lat, lng)' });
  }

  // resolve the script path
  const scriptPath = path.join(__dirname, '../ml/predict_spread.py');

  // spawn python in the ml folder
  const child = spawn(PYTHON, [ scriptPath, JSON.stringify(fireData) ], {
    cwd: path.join(__dirname, '../ml')
  });

  let stdout = '';
  let stderr = '';

  child.stdout.on('data', chunk => {
    stdout += chunk.toString();
  });
  child.stderr.on('data', chunk => {
    stderr += chunk.toString();
  });

  child.on('close', code => {
    if (code !== 0) {
      console.error('❌ Python script error:', stderr);
      return res.status(500).json({
        error: 'Fire spread prediction failed',
        details: stderr.trim()
      });
    }

    try {
      const result = JSON.parse(stdout);
      res.json(result);
    } catch (parseErr) {
      console.error('❌ JSON parse error:', parseErr);
      res.status(500).json({
        error: 'Failed to parse prediction output',
        details: parseErr.message
      });
    }
  });
});

module.exports = router;
