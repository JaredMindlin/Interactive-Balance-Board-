const express = require('express');
const { connectDB } = require('./db');
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
app.use('/api/esp', espRoutes); // ESP32 routes remain separate

//----------------------
// Board-related routes
//----------------------

// GET /api/board - Fetch full board state
app.get('/api/board', async (req, res) => {
  try {
    const boardState = await getBoardState();
    res.json(boardState);
  } catch (error) {
    console.error('Error fetching board state:', error);
    res.status(500).json({ error: 'Failed to fetch board state' });
  }
});

// POST /api/board/update - Generic update for board state fields
app.post('/api/board/update', async (req, res) => {
  try {
    console.log('Incoming request body:', req.body);
    const updatedFields = req.body;
    const boardState = await updateBoardState(updatedFields);
    console.log('Updated board state:', boardState);
    res.json(boardState);
  } catch (error) {
    console.error('Error updating board state:', error);
    res.status(500).json({ error: 'Failed to update board state' });
  }
});

// POST /api/board/register-board - Registers a new board (max 3). Assigns ID based on nextTicket.
app.post('/api/board/register-board', async (req, res) => {
  try {
    const boardState = await getBoardState();

    if (boardState.nextTicket > 3) {
      return res.status(400).json({ error: "Max boards reached (3)." });
    }

    const assignedID = boardState.nextTicket;
    const newTicket = assignedID + 1;
    let updateField = {};
    if (assignedID === 1) {
      updateField.validBoardZero = 1; // Board 1 → index 0
    } else if (assignedID === 2) {
      updateField.validBoardOne = 1;  // Board 2 → index 1
    } else if (assignedID === 3) {
      updateField.validBoardTwo = 1;  // Board 3 → index 2
    }
    updateField.nextTicket = newTicket;

    await updateBoardState(updateField);

    return res.status(200).json({
      message: "Board registered successfully",
      assignedID
    });
  } catch (error) {
    console.error('Error registering board:', error);
    res.status(500).json({ error: 'Error registering board' });
  }
});

// GET /api/board/board-config - Returns current board configuration including game and flag fields.
app.get('/api/board/board-config', async (req, res) => {
  try {
    const boardState = await getBoardState();
    const data = {
      gameModeSelected: boardState.gameModeSelected,
      ledBrightness: boardState.ledBrightness,
      validBoardZero: boardState.validBoardZero,
      validBoardOne: boardState.validBoardOne,
      validBoardTwo: boardState.validBoardTwo,
      endBoardZero: boardState.endBoardZero,
      endBoardOne: boardState.endBoardOne,
      endBoardTwo: boardState.endBoardTwo,
      nextTicket: boardState.nextTicket,
      pathwayProgress: boardState.pathwayProgress,
      upNextSequence: boardState.upNextSequence,
      upNextIndex: boardState.upNextIndex,
      expectedBoard: boardState.expectedBoard // For Pathway game mode
    };
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching board config:', error);
    res.status(500).json({ error: 'Failed to fetch board config' });
  }
});

// POST /api/board/set-game-mode - Sets the game mode and initializes game-specific fields.
app.post('/api/board/set-game-mode', async (req, res) => {
  try {
    console.log("POST /api/board/set-game-mode called. Body:", req.body);
    const { gameMode } = req.body;
    if (!gameMode || !['Pathway', 'UpNext'].includes(gameMode)) {
      console.error("Invalid or missing gameMode");
      return res.status(400).json({ error: 'gameMode must be "Pathway" or "UpNext"' });
    }

    let updates = { gameModeSelected: gameMode };

    if (gameMode === 'Pathway') {
      // For Pathway: Initialize progress to 0 and set expectedBoard randomly.
      updates.pathwayProgress = 0;
      updates.expectedBoard = Math.floor(Math.random() * 3);
      // Clear UpNext fields
      updates.upNextSequence = [];
      updates.upNextIndex = 0;
    } else if (gameMode === 'UpNext') {
      // For UpNext: Generate a random permutation of [0, 1, 2]
      updates.upNextSequence = shuffle([0, 1, 2]);
      updates.upNextIndex = 0;
      // Clear Pathway fields
      updates.pathwayProgress = 0;
      updates.expectedBoard = null;
    }

    const newState = await updateBoardState(updates);
    return res.status(200).json({
      message: "Game mode updated and initialized",
      newGameMode: newState.gameModeSelected,
      pathwayProgress: newState.pathwayProgress,
      expectedBoard: newState.expectedBoard,
      upNextSequence: newState.upNextSequence,
      upNextIndex: newState.upNextIndex
    });
  } catch (error) {
    console.error("Error setting game mode:", error);
    return res.status(500).json({ error: "Server error setting game mode" });
  }
});

// POST /api/board/board-step - Processes a board step event for game logic.
app.post('/api/board/board-step', async (req, res) => {
  try {
    const { boardID } = req.body; // boardID should be 0, 1, or 2
    if (boardID === undefined) {
      return res.status(400).json({ error: 'boardID is required' });
    }

    const state = await getBoardState();
    const { gameModeSelected } = state;

    if (gameModeSelected === 'Pathway') {
      // Pathway logic:
      // Check if the stepped board matches the expected board.
      if (boardID === state.expectedBoard) {
        let newProgress = state.pathwayProgress + 1;
        let updates = { pathwayProgress: newProgress };
        // If game is completed (e.g., 3 steps), reset game mode.
        if (newProgress >= 3) {
          updates.gameModeSelected = ""; // Reset game mode
          updates.pathwayProgress = 0;
          updates.expectedBoard = null;
          await updateBoardState(updates);
          return res.status(200).json({ message: "Pathway game completed, resetting game mode" });
        } else {
          // Generate a new expected board excluding the current board.
          let newExpectedBoard;
          do {
            newExpectedBoard = Math.floor(Math.random() * 3);
          } while (newExpectedBoard === boardID);
          updates.expectedBoard = newExpectedBoard;
          await updateBoardState(updates);
          return res.status(200).json({ message: "Correct step in Pathway mode", pathwayProgress: newProgress, expectedBoard: newExpectedBoard });
        }
      } else {
        return res.status(200).json({ message: "Incorrect step in Pathway mode" });
      }
    } else if (gameModeSelected === 'UpNext') {
      // UpNext logic:
      const { upNextSequence, upNextIndex } = state;
      if (!Array.isArray(upNextSequence) || upNextSequence.length === 0) {
        return res.status(400).json({ error: 'UpNext sequence not set' });
      }
      if (boardID === upNextSequence[upNextIndex]) {
        let newIndex = upNextIndex + 1;
        let updates = { upNextIndex: newIndex };
        if (newIndex >= upNextSequence.length) {
          // Sequence complete; reset game mode.
          updates.gameModeSelected = "";
          updates.upNextSequence = [];
          updates.upNextIndex = 0;
          await updateBoardState(updates);
          return res.status(200).json({ message: "UpNext game completed, resetting game mode" });
        } else {
          await updateBoardState(updates);
          return res.status(200).json({ message: "Correct step in UpNext mode", nextExpected: upNextSequence[newIndex], upNextIndex: newIndex });
        }
      } else {
        return res.status(200).json({ message: "Incorrect step in UpNext mode" });
      }
    } else {
      return res.status(200).json({ message: 'No game mode selected' });
    }
  } catch (error) {
    console.error("Error processing board step:", error);
    return res.status(500).json({ error: "Server error processing board step" });
  }
});

// GET routes for fetching individual board flag data (optional; can be used by debugging or by the boards)
app.get('/api/board/board-valid-data-zero', async (req, res) => {
  try {
    const boardState = await getBoardState();
    res.status(200).json({ validBoardZero: boardState.validBoardZero });
  } catch (error) {
    console.error('Error fetching board data:', error);
    res.status(500).json({ error: 'Failed to fetch board data' });
  }
});

app.get('/api/board/board-valid-data-one', async (req, res) => {
  try {
    const boardState = await getBoardState();
    res.status(200).json({ validBoardOne: boardState.validBoardOne });
  } catch (error) {
    console.error('Error fetching board data:', error);
    res.status(500).json({ error: 'Failed to fetch board data' });
  }
});

app.get('/api/board/board-valid-data-two', async (req, res) => {
  try {
    const boardState = await getBoardState();
    res.status(200).json({ validBoardTwo: boardState.validBoardTwo });
  } catch (error) {
    console.error('Error fetching board data:', error);
    res.status(500).json({ error: 'Failed to fetch board data' });
  }
});

app.get('/api/board/board-end-data-zero', async (req, res) => {
  try {
    const boardState = await getBoardState();
    res.status(200).json({ endBoardZero: boardState.endBoardZero });
  } catch (error) {
    console.error('Error fetching board data:', error);
    res.status(500).json({ error: 'Failed to fetch board data' });
  }
});

app.get('/api/board/board-end-data-one', async (req, res) => {
  try {
    const boardState = await getBoardState();
    res.status(200).json({ endBoardOne: boardState.endBoardOne });
  } catch (error) {
    console.error('Error fetching board data:', error);
    res.status(500).json({ error: 'Failed to fetch board data' });
  }
});

app.get('/api/board/board-end-data-two', async (req, res) => {
  try {
    const boardState = await getBoardState();
    res.status(200).json({ endBoardTwo: boardState.endBoardTwo });
  } catch (error) {
    console.error('Error fetching board data:', error);
    res.status(500).json({ error: 'Failed to fetch board data' });
  }
});

//----------------------
// Other routes (device counts, etc.)
//----------------------

// POST /update-device-count
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

// POST /device-disconnect
app.post("/device-disconnect", async (req, res) => {
  try {
    let boardState = await getBoardState();
    const newDeviceCount = Math.max(0, boardState.deviceCount - 1);
    await updateBoardState({ deviceCount: newDeviceCount });
    res.status(200).json({ message: "Board disconnected successfully", newDeviceCount });
  } catch (error) {
    console.error("Error decrementing device count:", error);
    res.status(500).json({ error: "Server error decrementing device count" });
  }
});

// POST /reset-device-count
app.post("/reset-device-count", async (req, res) => {
  try {
    let boardState = await getBoardState();
    const newDeviceCount = 0;
    await updateBoardState({ deviceCount: newDeviceCount });
    res.status(200).json({ message: "Device count reset to 0", newDeviceCount });
  } catch (error) {
    console.error("Error resetting device count:", error);
    res.status(500).json({ error: "Server error resetting device count" });
  }
});

// POST /set-device-test
app.post("/set-device-test", async (req, res) => {
  try {
    let boardState = await getBoardState();
    const newDeviceCount = 1;
    await updateBoardState({ deviceCount: newDeviceCount });
    res.status(200).json({ message: "Device count set to ", newDeviceCount });
  } catch (error) {
    console.error("Error setting device count:", error);
    res.status(500).json({ error: "Server error setting device count" });
  }
});

//----------------------
// Start the Server
//----------------------
const startServer = async () => {
  try {
    await connectDB();

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

startServer();
