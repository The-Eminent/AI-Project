# Ignis AI - Complete Setup Guide

Welcome! This guide will walk you through setting up Ignis AI from scratch on a fresh machine.

## 1. Install Node.js & npm

- Go to [https://nodejs.org](https://nodejs.org) and download the **LTS installer** for your OS (Windows/macOS/Linux).
- Run the installer and accept all default settings.
- Verify installation in a terminal:

```bash
node --version   # Should print v16.x or higher
npm --version
```

## 2. Choose & Provision MongoDB

You have two main options:

### A. Local MongoDB Community Server

**macOS (Homebrew)**

```bash
brew tap mongodb/brew
brew install mongodb-community@6.0
brew services start mongodb-community@6.0
```

To stop MongoDB:
```bash
brew services stop mongodb-community@6.0
```

To run manually:
```bash
mongod
```

**Windows**

- Download the MSI installer from [MongoDB Community Edition](https://www.mongodb.com/try/download/community).
- During installation, select **"Run as a Service"**.
- MongoDB will start automatically. You can manage it via **Services.app**.

**Linux (Ubuntu/Debian)**

```bash
sudo apt update
sudo apt install -y mongodb
sudo systemctl enable mongodb
sudo systemctl start mongodb
```

**Verify MongoDB installation:**

```bash
mongo --eval "db.runCommand({ connectionStatus: 1 })"
```
You should see `ok: 1`.

### B. MongoDB Atlas (Cloud)

- Go to [https://cloud.mongodb.com](https://cloud.mongodb.com) and sign up.
- Create a **Project** and **Build a Cluster** (choose **Free Tier M0**).
- In **Network Access**, add your IP address (or allow access from anywhere).
- In **Database Access**, create a user and password.
- Click **Connect** → **Connect your application** → Copy the connection string:

```bash
mongodb+srv://<username>:<password>@cluster0.abcd.mongodb.net/ignisai?retryWrites=true&w=majority
```

## 3. Clone the Repository

In your terminal:

```bash
git clone https://github.com/your-org/ignis-ai.git
cd ignis-ai
```

You should see two folders:
- `ignis-ai-backend`
- `ignis-ai-frontend`

## 4. Backend Setup (Node.js + Express + MongoDB)

Install backend dependencies:

```bash
cd ignis-ai-backend
npm install
```

Create your environment file:

```bash
cp .env.example .env
```

Edit `.env` and fill in the details:

```ini
PORT=5000
MONGO_URI=<your MongoDB URI>
NASA_API_KEY=<your NASA FIRMS API key>
MAPBOX_ACCESS_TOKEN=<your Mapbox secret token>
HUMAN_FACTORS_API=<optional: human factors API>
```

**Start MongoDB** (if using local):

- **macOS:**

```bash
brew services start mongodb-community@6.0
```

- **Windows:** Already running as a service.
- **Linux:**

```bash
sudo systemctl start mongodb
```

**Start the backend server:**

```bash
npm start
```

You should see logs confirming that the server is running on port 5000 and MongoDB is connected.

## 5. Frontend Setup (React + Mapbox GL)

In a new terminal window/tab:

```bash
cd ../ignis-ai-frontend
npm install
```

Create the React environment file:

```bash
cp .env.example .env
```

Edit `.env` and fill in:

```ini
REACT_APP_MAPBOX_TOKEN=<your Mapbox public token>
```

Start the React development server:

```bash
npm start
```

It will open `http://localhost:3000` in your browser.

API calls are automatically proxied to `http://localhost:5000/api`.

## 6. Verify Everything

- **Backend:** Open [http://localhost:5000/api/wildfires](http://localhost:5000/api/wildfires) → Should display JSON data.
- **Frontend:** Open [http://localhost:3000](http://localhost:3000) → Map should load and display markers.

---

🎉 Congratulations! You now have a complete Ignis AI development environment running locally.