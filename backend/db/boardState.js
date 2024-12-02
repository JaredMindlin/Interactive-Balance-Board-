const { getDB } = require('../db');

const getBoardState = async () => {
  const db = getDB();
  const collection = db.collection('boardState');
  let boardState = await collection.findOne({});
  if (!boardState) {  // def state
    boardState = {
      isSystemOn: false,
      deviceCount: 0,
      areLEDsOn: false,
      gameModeSelected: '',
    };
    await collection.insertOne(boardState);
  }
  return boardState;
};

const updateBoardState = async (updatedFields) => {
  const db = getDB();
  const collection = db.collection('boardState');

  const validFields = ['isSystemOn', 'areLEDsOn', 'deviceCount', 'gameModeSelected'];
  const fieldsToUpdate = {};
  validFields.forEach((field) => {
    if (updatedFields[field] !== undefined) {
      fieldsToUpdate[field] = updatedFields[field];
    }
  });

  await collection.updateOne(
    {},
    { $set: fieldsToUpdate },
    { upsert: true }
  );

  return collection.findOne({});
};

module.exports = { getBoardState, updateBoardState };