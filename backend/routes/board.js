const express = require('express');
const router = express.Router();
const { getBoardState, updateBoardState } = require('../db/boardState');

router.get('/', async (req, res) => {
  try {
    const boardState = await getBoardState();
    res.json(boardState);
  } catch (error) {
    console.error('Error fetching board state:', error);
    res.status(500).json({ error: 'Failed to fetch board state' });
  }
});

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

router.post('/register-board', async (req, res) => {
  try {
    const boardState = await getBoardState();

    // Check if we've reached max boards (3)
    if (boardState.nextTicket > 3) {
      return res.status(400).json({ error: "Max boards reached (3)." });
    }

    // Assign board ID based on nextTicket value
    const assignedID = boardState.nextTicket;
    const newTicket = assignedID + 1;

    let updateField = {};
    if (assignedID === 1) {
      updateField.validBoardZero = 1; // Board 1 corresponds to index 0
    } else if (assignedID === 2) {
      updateField.validBoardOne = 1;  // Board 2 corresponds to index 1
    } else if (assignedID === 3) {
      updateField.validBoardTwo = 1;  // Board 3 corresponds to index 2
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
      // Game logic fields
      pathwayProgress: boardState.pathwayProgress,       // e.g., 0 = not started, 1 = in-progress, 2 = completed
      upNextSequence: boardState.upNextSequence,         // sequence order for UpNext mode
      upNextIndex: boardState.upNextIndex                // current step index in UpNext sequence
    };
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching board config:', error);
    res.status(500).json({ error: 'Failed to fetch board config' });
  }
});

router.post('/set-game-mode', async (req, res) => {
  try {
    console.log("POST /set-game-mode called. Body:", req.body);
    const { gameMode } = req.body;
    if (!gameMode || !['Pathway', 'UpNext'].includes(gameMode)) {
      console.error("Invalid or missing gameMode.");
      return res.status(400).json({ error: 'gameMode must be "Pathway" or "UpNext"' });
    }
    let updates = { gameModeSelected: gameMode };
    if (gameMode === 'Pathway') {
      // Initialize Pathway game logic: start with progress at 1.
      updates.pathwayProgress = 1;
      // Clear any UpNext fields
      updates.upNextSequence = [];
      updates.upNextIndex = 0;
    } else if (gameMode === 'UpNext') {
      // Initialize UpNext game logic with a sample sequence (customize as needed)
      updates.upNextSequence = [0, 1, 2];
      updates.upNextIndex = 0;
      // Reset pathway progress if previously set
      updates.pathwayProgress = 0;
    }
    const newState = await updateBoardState(updates);
    return res.status(200).json({
      message: "Game mode updated and initialized",
      newGameMode: newState.gameModeSelected,
      pathwayProgress: newState.pathwayProgress,
      upNextSequence: newState.upNextSequence,
      upNextIndex: newState.upNextIndex
    });
  } catch (error) {
    console.error("Error setting game mode:", error);
    return res.status(500).json({ error: "Server error setting game mode" });
  }
});

router.post('/board-step', async (req, res) => {
  try {
    const { boardID } = req.body; // boardID should be 0, 1, or 2 corresponding to the board's slot.
    if (boardID === undefined) {
      return res.status(400).json({ error: 'boardID is required' });
    }
    const state = await getBoardState();
    const { gameModeSelected } = state;
    
    if (gameModeSelected === 'Pathway') {
      // Example Pathway logic:
      // If boardID equals 0 and pathwayProgress is 1, mark as complete.
      if (boardID === 0 && state.pathwayProgress === 1) {
        await updateBoardState({ pathwayProgress: 2 });
        return res.status(200).json({ message: 'Pathway step complete' });
      }
      return res.status(200).json({ message: 'Pathway step not processed' });
    } else if (gameModeSelected === 'UpNext') {
      // UpNext logic:
      const { upNextSequence, upNextIndex } = state;
      if (!Array.isArray(upNextSequence) || upNextSequence.length === 0) {
        return res.status(400).json({ error: 'UpNext sequence not set' });
      }
      if (boardID === upNextSequence[upNextIndex]) {
        const newIndex = upNextIndex + 1;
        let updates = { upNextIndex: newIndex };
        // Optionally: If sequence completed, mark game as complete.
        if (newIndex >= upNextSequence.length) {
          updates.endGame = true; // You may define endGame behavior in your system.
        }
        await updateBoardState(updates);
        return res.status(200).json({ message: 'Correct UpNext step', newIndex });
      }
      return res.status(200).json({ message: 'Wrong UpNext step' });
    } else {
      return res.status(200).json({ message: 'No game mode selected' });
    }
  } catch (error) {
    console.error("Error processing board step:", error);
    return res.status(500).json({ error: "Server error processing board step" });
  }
});

router.get('/board-data-zero', async (req, res) => {
  try {
    const boardState = await getBoardState();
    const data = {
      validBoardZero: boardState.validBoardZero,
      endBoardZero: boardState.endBoardZero,
      nextTicket: boardState.nextTicket,
    };
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching board data:', error);
    res.status(500).json({ error: 'Failed to fetch board data' });
  }
});

router.get('/board-data-one', async (req, res) => {
  try {
    const boardState = await getBoardState();
    const data = {
      validBoardOne: boardState.validBoardOne,
      endBoardOne: boardState.endBoardOne,
      nextTicket: boardState.nextTicket,
    };
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching board data:', error);
    res.status(500).json({ error: 'Failed to fetch board data' });
  }
});

router.get('/board-data-two', async (req, res) => {
  try {
    const boardState = await getBoardState();
    const data = {
      validBoardTwo: boardState.validBoardTwo,
      endBoardTwo: boardState.endBoardTwo,
      nextTicket: boardState.nextTicket,
    };
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching board data:', error);
    res.status(500).json({ error: 'Failed to fetch board data' });
  }
});

module.exports = router;
