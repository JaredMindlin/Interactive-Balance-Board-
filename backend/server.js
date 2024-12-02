const express = require('express');
const { connectDB } = require('./db');
const boardRoutes = require('./routes/board');
const path = require('path');
const cors = require('cors');
const espRoutes = require('./routes/esp');

const app = express();

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000', // frontend
  methods: ['GET', 'POST'],
  credentials: true,
}));
app.use('/api/esp', espRoutes); // Add the ESP32 routes here

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

startServer();