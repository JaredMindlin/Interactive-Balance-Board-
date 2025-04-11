/*
const express = require('express');
const router = express.Router();
const { getBoardState, updateBoardState } = require('../db/boardState');

// Helper function to shuffle an array (Fisher-Yates)
const shuffle = (array) => {
  let currentIndex = array.length, temporaryValue, randomIndex;
  while (0 !== currentIndex) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
};

// GET /
// Fetch full board state
router.get('/', async (req, res) => {
  try {
    const boardState = await getBoardState();
    res.json(boardState);
  } catch (error) {
    console.error('Error fetching board state:', error);
    res.status(500).json({ error: 'Failed to fetch board state' });
  }
});

// POST /update
// Generic update for board state fields
router.post('/update', async (req, res) => {
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

// POST /register-board
// Registers a new board (max 3). Assigns ID based on nextTicket.
router.post('/register-board', async (req, res) => {
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

// GET /board-config
// Returns current board configuration including game and flag fields.
router.get('/board-config', async (req, res) => {
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

// POST /set-game-mode
// Sets the game mode and initializes game-specific fields.
router.post('/set-game-mode', async (req, res) => {
  try {
    console.log("POST /set-game-mode called. Body:", req.body);
    const { gameMode } = req.body;
    if (!gameMode || !['Pathway', 'UpNext'].includes(gameMode)) {
      console.error("Invalid or missing gameMode");
      return res.status(400).json({ error: 'gameMode must be "Pathway" or "UpNext"' });
    }

    let updates = { gameModeSelected: gameMode };

    if (gameMode === 'Pathway') {
      // For Pathway: Initialize progress to 0 and set expectedBoard randomly.
      updates.pathwayProgress = 0;
      // Pick a random expected board among 0, 1, 2 (all valid boards)
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

// POST /board-step
// Processes a board step event for game logic.
router.post('/board-step', async (req, res) => {
  try {
    const { boardID } = req.body; // boardID: 0, 1, or 2
    if (boardID === undefined) {
      return res.status(400).json({ error: 'boardID is required' });
    }

    const state = await getBoardState();
    const { gameModeSelected } = state;

    if (gameModeSelected === 'Pathway') {
      // Pathway logic:
      // Check if the stepped board matches the expected board.
      if (boardID === state.expectedBoard) {
        // Correct step; increment pathwayProgress.
        let newProgress = state.pathwayProgress + 1;
        let updates = { pathwayProgress: newProgress };

        // If game is completed (e.g., 3 steps), reset game mode.
        if (newProgress >= 3) {
          updates.gameModeSelected = "";  // Reset game mode (back to connected state)
          updates.pathwayProgress = 0;
          updates.expectedBoard = null;
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

// GET
// routes for fetching valid and end board data
router.get('/board-valid-data-zero', async (req, res) => {
  try {
    const boardState = await getBoardState();
    const data = {
      validBoardZero: boardState.validBoardZero,
    };
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching board data:', error);
    res.status(500).json({ error: 'Failed to fetch board data' });
  }
});

router.get('/board-valid-data-one', async (req, res) => {
  try {
    const boardState = await getBoardState();
    const data = {
      validBoardOne: boardState.validBoardOne,
    };
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching board data:', error);
    res.status(500).json({ error: 'Failed to fetch board data' });
  }
});

router.get('/board-valid-data-two', async (req, res) => {
  try {
    const boardState = await getBoardState();
    const data = {
      validBoardTwo: boardState.validBoardTwo,
    };
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching board data:', error);
    res.status(500).json({ error: 'Failed to fetch board data' });
  }
});

router.get('/board-end-data-zero', async (req, res) => {
  try {
    const boardState = await getBoardState();
    const data = {
      endBoardZero: boardState.endBoardZero,
    };
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching board data:', error);
    res.status(500).json({ error: 'Failed to fetch board data' });
  }
});

router.get('/board-end-data-one', async (req, res) => {
  try {
    const boardState = await getBoardState();
    const data = {
      endBoardOne: boardState.endBoardOne,
    };
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching board data:', error);
    res.status(500).json({ error: 'Failed to fetch board data' });
  }
});

router.get('/board-end-data-two', async (req, res) => {
  try {
    const boardState = await getBoardState();
    const data = {
      endBoardTwo: boardState.endBoardTwo,
    };
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching board data:', error);
    res.status(500).json({ error: 'Failed to fetch board data' });
  }
});

module.exports = router;
*/