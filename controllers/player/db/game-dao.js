import gameModel from "./game-model.js";

export const putGameURL = (gameid, url) =>
  gameModel.updateOne({ gameid }, { gameid, url }, { upsert: true });

export const getGameByGameId = (gameid) => gameModel.findOne({ gameid });
