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

    // ff we reached 3 boards, or if we want 3 as max boards
    if (boardState.nextTicket > 3) {
      return res.status(400).json({ error: "Max boards reached (3)." });
    }

    // assign board ID and inc nextTicket
    const assignedID = boardState.nextTicket;
    const newTicket = assignedID + 1;

    // database udate
    await updateBoardState({ nextTicket: newTicket });

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

    // more fields if needed
    const data = {
      validBoards: boardState.validBoards,
      endBoard: boardState.endBoard,
      gameModeSelected: boardState.gameModeSelected,
      ledBrightness: boardState.ledBrightness
    };

    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching board config:', error);
    res.status(500).json({ error: 'Failed to fetch board config' });
  }
});

router.post("/update-boards-array", async (req, res) => {
  try {
    const { validBoards, endBoard } = req.body;
    let updates = {};

    if (Array.isArray(validBoards)) {
      updates.validBoards = validBoards;
    }
    if (Array.isArray(endBoard)) {
      updates.endBoard = endBoard;
    }

    const newState = await updateBoardState(updates);
    return res.status(200).json({
      message: "Board arrays updated",
      validBoards: newState.validBoards,
      endBoard: newState.endBoard
    });
  } catch (error) {
    console.error("Error updating board arrays:", error);
    return res.status(500).json({ error: "Error updating board arrays" });
  }
});

module.exports = router;