const express = require('express');
const router = express.Router();
const axios = require('axios');

// Replace with your ESP32's local IP address or hostname
const ESP32_URL = 'http://192.168.0.100'; // Example IP of ESP32

router.post('/command', async (req, res) => {
    const { deviceCount } = req.body;

    if (deviceCount === undefined) {
        return res.status(400).json({ error: 'deviceCount is required' });
    }

    try {
        const db = getDB();
        const collection = db.collection('boardState');

        // Update the deviceCount in the database
        await collection.updateOne({}, { $set: { deviceCount } }, { upsert: true });

        // Fetch the updated document to confirm the change
        const updatedState = await collection.findOne({});
        res.json(updatedState);
    } catch (error) {
        console.error('Error updating deviceCount:', error);
        res.status(500).json({ error: 'Failed to update deviceCount' });
    }
});


module.exports = router;
