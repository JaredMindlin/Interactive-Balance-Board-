// backend/db/boardState.js
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
      ledBrightness: 0,

      validBoardZero: 0,
      validBoardOne: 0,
      validBoardTwo: 0,
      endBoardZero: 0,
      endBoardOne: 0,
      endBoardTwo: 0,

      nextTicket: 1
    };
    await collection.insertOne(boardState);
  }

  // Initialize missing fields if needed
  if (boardState.ledBrightness === undefined) {
    boardState.ledBrightness = 0;
    await collection.updateOne({}, { $set: { ledBrightness: 0 } });
  }
  if (boardState.areLEDsOn === undefined) {
    boardState.areLEDsOn = false;
    await collection.updateOne({}, { $set: { areLEDsOn: false } });
  }

  if (boardState.validBoardZero === undefined) {
    boardState.validBoardZero = 0;
    await collection.updateOne({}, { $set: { validBoardZero: 0 } });
  }
  if (boardState.validBoardOne === undefined) {
    boardState.validBoardOne = 0;
    await collection.updateOne({}, { $set: { validBoardOne: 0 } });
  }
  if (boardState.validBoardTwo === undefined) {
    boardState.validBoardTwo = 0;
    await collection.updateOne({}, { $set: { validBoardTwo: 0 } });
  }

  if (boardState.endBoardZero === undefined) {
    boardState.endBoardZero = 0;
    await collection.updateOne({}, { $set: { endBoardZero: 0 } });
  }
  if (boardState.endBoardOne === undefined) {
    boardState.endBoardOne = 0;
    await collection.updateOne({}, { $set: { endBoardOne: 0 } });
  }
  if (boardState.endBoardTwo === undefined) {
    boardState.endBoardTwo = 0;
    await collection.updateOne({}, { $set: { endBoardTwo: 0 } });
  }

  if (boardState.nextTicket === undefined) {
    boardState.nextTicket = 1;
    await collection.updateOne({}, { $set: { nextTicket: 1 } });
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
    'ledBrightness',

    'validBoardZero',
    'validBoardOne',
    'validBoardTwo',
    'endBoardZero',
    'endBoardOne',
    'endBoardTwo',

    'nextTicket'
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
