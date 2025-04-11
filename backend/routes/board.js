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

    // Map assignedID to the corresponding field
    let updateField = {};
    if (assignedID === 1) {
      updateField.validBoardZero = 1; // Board 1 corresponds to index 0
    } else if (assignedID === 2) {
      updateField.validBoardOne = 1;  // Board 2 corresponds to index 1
    } else if (assignedID === 3) {
      updateField.validBoardTwo = 1;  // Board 3 corresponds to index 2
    }
    updateField.nextTicket = newTicket;

    // Update the board state
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
      // New individual flag fields
      validBoardZero: boardState.validBoardZero,
      validBoardOne: boardState.validBoardOne,
      validBoardTwo: boardState.validBoardTwo,
      endBoardZero: boardState.endBoardZero,
      endBoardOne: boardState.endBoardOne,
      endBoardTwo: boardState.endBoardTwo,
      nextTicket: boardState.nextTicket
    };

    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching board config:', error);
    res.status(500).json({ error: 'Failed to fetch board config' });
  }
});

router.post('/update-board-flags', async (req, res) => {
  try {
    const {
      validBoardZero,
      validBoardOne,
      validBoardTwo,
      endBoardZero,
      endBoardOne,
      endBoardTwo
    } = req.body;
    let updates = {};
    if (validBoardZero !== undefined) updates.validBoardZero = validBoardZero;
    if (validBoardOne !== undefined) updates.validBoardOne = validBoardOne;
    if (validBoardTwo !== undefined) updates.validBoardTwo = validBoardTwo;
    if (endBoardZero !== undefined) updates.endBoardZero = endBoardZero;
    if (endBoardOne !== undefined) updates.endBoardOne = endBoardOne;
    if (endBoardTwo !== undefined) updates.endBoardTwo = endBoardTwo;

    const newState = await updateBoardState(updates);
    return res.status(200).json({
      message: "Board flags updated",
      validBoardZero: newState.validBoardZero,
      validBoardOne: newState.validBoardOne,
      validBoardTwo: newState.validBoardTwo,
      endBoardZero: newState.endBoardZero,
      endBoardOne: newState.endBoardOne,
      endBoardTwo: newState.endBoardTwo
    });
  } catch (error) {
    console.error("Error updating board flags:", error);
    return res.status(500).json({ error: "Error updating board flags" });
  }
});

module.exports = router;
