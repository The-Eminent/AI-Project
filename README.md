# Ignis AI - Complete Setup & Run Guide

Welcome! This guide will walk you through setting up Ignis AI from scratch on a fresh machine.

This README ensures you can spin up both services locally, on **macOS**, **Linux**, or **Windows (VSCode)**, without surprises.

---
## Prerequisites

1. **Git**
2. **Node.js** LTS **v16.x–v18.x** & **npm** (v8+)
   ```bash
   node --version   # expect v16.x or v18.x
   npm --version
   ```
3. **Python 3.11+**
   ```bash
   python --version # expect 3.11.x
   ```
4. **MongoDB** (local or Atlas)

---
## 1. Clone the Repo

```bash
# Any terminal (macOS, Linux, Windows PowerShell or VSCode)
git clone https://github.com/your-org/ignis-ai.git
cd ignis-ai
```  
You should have:
```
ignis-ai-backend/
ignis-ai-frontend/
```

---
## 2. Backend & ML Setup

### 2.1 Install Backend Dependencies (Node)

```bash
cd ignis-ai-backend
npm install
```  
> **Same** on macOS, Linux, or VSCode terminal in Windows.

### 2.2 Python Virtual Environment & ML Dependencies

Navigate into the ML folder and create a venv:

#### macOS / Linux
```bash
cd ml
python3 -m venv venv              # create a virtual environment
source venv/bin/activate          # activate venv
pip install tensorflow scikit-learn pandas numpy joblib tqdm requests   # install all required Python packages
# Once you're done working in this environment, run:
deactivate                         # exit the virtual environment
```

#### Windows (PowerShell / VSCode)
```powershell
cd ml
python -m venv venv               # create a virtual environment
.\venv\Scripts\Activate.ps1    # activate venv
pip install tensorflow scikit-learn pandas numpy joblib tqdm requests
# Once you're done, run:
deactivate                         # exit the virtual environment
```

Note: **`deactivate`** simply returns your shell to its original state; only use it when you want to stop using the venv.

### 2.3 Pre‑trained Model Files

Copy (or confirm) these into `ignis-ai-backend/ml/`:
```
wildfire_spread_classifier_advanced.joblib
wildfire_spread_regressor_advanced.joblib
```
We **do not** commit the large TFRecord training files.

### 2.4 Environment Variables

```bash
cd ..  # back to ignis-ai-backend
cp .env.example .env  # or `copy .env.example .env` on Windows
```  
Edit `.env`:
```ini
PORT=5000
MONGODB_URI=<your MongoDB URI>
NASA_API_KEY=<your NASA FIRMS API key>
MAPBOX_ACCESS_TOKEN=<your Mapbox secret token>
```  

### 2.5 Start the Backend Server

```bash
npm start
```  
Verify you see:
```
Server started on port 5000
MongoDB connected successfully
```

---
## 3. Frontend Setup (React + Mapbox)

Open a **new** terminal/tab:

```bash
cd ignis-ai-frontend
npm install
cp .env.example .env  # or `copy .env.example .env`
```  
In `.env`, set:
```ini
REACT_APP_MAPBOX_TOKEN=<your Mapbox public token>
```  
Then launch:
```bash
npm start
```  
App runs at **http://localhost:3000** (API calls proxy to `http://localhost:5000/api`).

---
## 4. (Optional) Retrain ML Models

If you want to retrain on Kaggle’s TFRecords:

1. Place TFRecords under `ignis-ai-backend/ml/data/`
2. Activate your Python venv (see 2.2)
3. Run:
   ```bash
   python process_data_dual.py       # extract features
   python train_classifier_advanced.py  # train classifier
   python train_regressor_advanced.py   # train regressor
   ```  
4. New `*.joblib` files will replace the ones in `ml/`.

---
## 5. Verify Everything Works

- **Backend API**: visit `http://localhost:5000/api/wildfires` → JSON of current fires
- **Frontend Map**: visit `http://localhost:3000` → Map with fire markers; click one and hit “Predict Fire Spread”

---
🎉 Your Ignis AI app is now running locally, ready to detect and predict wildfire spread with a single `npm start` for each service.
