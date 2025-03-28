const { getDB } = require('../db');

const getBoardState = async () => {
  const db = getDB();
  const collection = db.collection('boardState');
  let boardState = await collection.findOne({});

  if (!boardState) {
    // Default initial state
    boardState = {
      isSystemOn: false,
      deviceCount: 0,
      areLEDsOn: false,
      gameModeSelected: '',
      ledBrightness: 0
    };
    await collection.insertOne(boardState);
  }

  // If ledBrightness or areLEDsOn are missing, initialize them
  if (boardState.ledBrightness === undefined) {
    boardState.ledBrightness = 0;
    await collection.updateOne({}, { $set: { ledBrightness: 0 } });
  }
  if (boardState.areLEDsOn === undefined) {
    boardState.areLEDsOn = false;
    await collection.updateOne({}, { $set: { areLEDsOn: false } });
  }

  return boardState;
};

const updateBoardState = async (updatedFields) => {
  const db = getDB();
  const collection = db.collection('boardState');

  const validFields = [
    'isSystemOn',
    'areLEDsOn',
    'deviceCount',
    'gameModeSelected',
    'ledBrightness'
  ];

  const fieldsToUpdate = {};
  validFields.forEach((field) => {
    if (updatedFields[field] !== undefined) {
      fieldsToUpdate[field] = updatedFields[field];
    }
  });

  await collection.updateOne({}, { $set: fieldsToUpdate }, { upsert: true });

  return collection.findOne({});
};

module.exports = { getBoardState, updateBoardState };