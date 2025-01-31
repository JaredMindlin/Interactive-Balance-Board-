const express = require("express");
const mongoose = require("mongoose");

const { MongoClient } = require('mongodb');

const client = new MongoClient(uri, { useUnifiedTopology: true });

const app = express();
app.use(express.json());

// Connect to MongoDB Atlas
mongoose.connect("mongodb+srv://montessori:Askeladd123@cluster0.tq7wo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0", { useNewUrlParser: true, useUnifiedTopology: true });

const DataSchema = new mongoose.Schema({
    value: String,
    timestamp: { type: Date, default: Date.now }
});

const DataModel = mongoose.model("BLEData", DataSchema);

// Endpoint to receive BLE data
app.post("/ble-data", async (req, res) => {
    const { value } = req.body;
    const newData = new DataModel({ value });

    try {
        await newData.save();
        res.status(201).send("Data saved");
    } catch (err) {
        res.status(500).send("Error saving data");
    }
});

app.listen(5000, () => console.log("Server running on port 5000"));
