import commentModel from "./comment-model.js";

export const createComment = (gameid, userid, content) =>
  commentModel.create({ gameid, userid, content });

export const getCommentByGame = (gameid) => commentModel.find({ gameid });

export const getCommentByUser = (userid) => commentModel.find({ userid });

export const deleteComment = (query) => commentModel.findOneAndDelete(query);

export const getRecentComments = (userid, date) =>
  commentModel.find({ userid, createdAt: { $gte: date } });
