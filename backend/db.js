const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://montessori:Askeladd123@cluster0.tq7wo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

const client = new MongoClient(uri, { useUnifiedTopology: true });

let db;

const connectDB = async () => {
  try {
    await client.connect();
    db = client.db('interactive-board');
    console.log('Connected to MongoDB Atlas using native driver...');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

const getDB = () => {
  if (!db) {
    throw new Error('Database not initialized. Call connectDB first.');
  }
  return db;
};

module.exports = { connectDB, getDB };
