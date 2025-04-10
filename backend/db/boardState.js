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

      validBoards: [false, false, false], // for up to 3 boards
      endBoard: [false, false, false],    // for up to 3 boards
      nextTicket: 1                       // start ticket numbering at 1
    };
    await collection.insertOne(boardState);
  }

  if (boardState.ledBrightness === undefined) {
    boardState.ledBrightness = 0;
    await collection.updateOne({}, { $set: { ledBrightness: 0 } });
  }
  if (boardState.areLEDsOn === undefined) {
    boardState.areLEDsOn = false;
    await collection.updateOne({}, { $set: { areLEDsOn: false } });
  }

  if (!Array.isArray(boardState.validBoards)) {
    boardState.validBoards = [false, false, false];
    await collection.updateOne({}, { $set: { validBoards: boardState.validBoards } });
  }
  if (!Array.isArray(boardState.endBoard)) {
    boardState.endBoard = [false, false, false];
    await collection.updateOne({}, { $set: { endBoard: boardState.endBoard } });
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
    'validBoards',
    'endBoard',
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
