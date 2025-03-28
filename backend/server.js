const express = require('express');
const { connectDB } = require('./db');
const boardRoutes = require('./routes/board');
const path = require('path');
const cors = require('cors');
const espRoutes = require('./routes/esp');
const { getBoardState, updateBoardState } = require("./db/boardState");

const app = express();

const ESP32_URL = 'http://172.20.10.4'; 

app.use(express.json());
app.use(cors({
  origin: 'http://172.20.10.4:3000', // frontend
  methods: ['GET', 'POST'],
  credentials: true,
}));
app.use('/api/esp', espRoutes); // Add the ESP32 routes 

const startServer = async () => {
  try {
    await connectDB();

    app.use('/api/board', boardRoutes);

    if (process.env.NODE_ENV === 'production') {
      app.use(express.static('frontend/build'));

      app.get('*', (req, res) =>
        res.sendFile(path.resolve(__dirname, 'frontend', 'build', 'index.html'))
      );
    }

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

// Make sure this API is correctly defined
app.post("/update-device-count", async (req, res) => {
  try {
      let boardState = await getBoardState();
      const newDeviceCount = boardState.deviceCount + 1;
      await updateBoardState({ deviceCount: newDeviceCount });

      res.status(200).json({ message: "Device count updated", newDeviceCount });
  } catch (err) {
      console.error("Error updating device count:", err);
      res.status(500).json({ error: "Error updating device count" });
  }
});

app.post("/device-disconnect", async (req, res) => {
  try {
    let boardState = await getBoardState();
    
    // Ensure deviceCount never goes below zero
    const newDeviceCount = Math.max(0, boardState.deviceCount - 1);

    // Update the boardState in your database
    await updateBoardState({ deviceCount: newDeviceCount });
    
    res.status(200).json({
      message: "Board disconnected successfully",
      newDeviceCount,
    });
  } catch (error) {
    console.error("Error decrementing deviceCount:", error);
    res.status(500).json({ error: "Server error decrementing deviceCount" });
  }
});

app.post("/reset-device-count", async (req, res) => {
  try {
    // Fetch current board state from the database
    let boardState = await getBoardState();

    // Force deviceCount to zero
    const newDeviceCount = 0;

    // Update board state
    await updateBoardState({ deviceCount: newDeviceCount });

    // Return success response
    res.status(200).json({
      message: "Device count reset to 0",
      newDeviceCount
    });
  } catch (error) {
    console.error("Error resetting device count:", error);
    res.status(500).json({ error: "Server error resetting device count" });
  }
});

app.post("/set-device-test", async (req, res) => {
  try {
    // Fetch current board state
    let boardState = await getBoardState();

    // Force deviceCount to one
    const newDeviceCount = 1;

    // Update the boardState in the database
    await updateBoardState({ deviceCount: newDeviceCount });

    // Return success response
    res.status(200).json({
      message: "Device count set to ",
      newDeviceCount
    });
  } catch (error) {
    console.error("Error setting device count:", error);
    res.status(500).json({ error: "Server error setting device count" });
  }
});

//==========================
// Set game mode
//==========================
app.post("/set-game-mode", async (req, res) => {
  try {
    console.log("POST /set-game-mode called. Body:", req.body);

    // 1) Extract gameMode from the request body
    const { gameMode } = req.body;
    if (!gameMode) {
      console.error("No gameMode provided in request body!");
      return res.status(400).json({ error: "gameMode is required in request body" });
    }

    // 2) Update DB
    let boardState = await getBoardState();
    console.log(`Current gameModeSelected=${boardState.gameModeSelected}, updating to=${gameMode}`);
    await updateBoardState({ gameModeSelected: gameMode });

    // 3) Notify ESP32 about the new mode (optional step)
    //    Make sure your ESP32 code handles POST /set-mode
    console.log(`Forwarding gameMode="${gameMode}" to ESP32 at ${ESP32_URL}`);
    const espResponse = await fetch(ESP32_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameMode })
    });

    if (!espResponse.ok) {
      console.error("ESP32 responded with an error", espResponse.status);
      return res.status(500).json({
        error: `Failed to notify ESP32: HTTP ${espResponse.status}`
      });
    }

    const espData = await espResponse.json();

    // 4) Return success
    console.log("ESP32 response data:", espData);
    return res.status(200).json({
      message: "Game mode updated in DB and sent to ESP32",
      newGameMode: gameMode,
      espData
    });

  } catch (error) {
    console.error("Error setting game mode:", error);
    return res.status(500).json({ error: "Server error setting game mode" });
  }
});

//==========================
// Get current game mode
//==========================
app.get("/game-mode", async (req, res) => {
  try {
      const boardState = await getBoardState();  // Fetch game mode from DB
      return res.status(200).json({ gameModeSelected: boardState.gameModeSelected });
  } catch (error) {
      console.error("Error fetching game mode:", error);
      return res.status(500).json({ error: "Failed to fetch game mode" });
  }
});

app.get("/brightness", async (req, res) => {
  try {
    const boardState = await getBoardState();
    return res.status(200).json({ ledBrightness: boardState.ledBrightness });
  } catch (error) {
    console.error("Error fetching brightness:", error);
    return res.status(500).json({ error: "Failed to fetch brightness" });
  }
});

startServer();
