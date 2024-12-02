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

module.exports = router;