import playerFollowModel from "./player-follow-model.js";

export const findFollowByPlayer = (playerUsername) =>
  playerFollowModel.find({ playerUsername: playerUsername.toLowerCase() });

export const findFollowByUser = (userid) => playerFollowModel.find({ userid });

export const findFollow = (userid, playerUsername) =>
  playerFollowModel.findOne({
    userid,
    playerUsername: playerUsername.toLowerCase(),
  });

export const follow = (userid, playerUsername) =>
  playerFollowModel.create({
    userid,
    playerUsername: playerUsername.toLowerCase(),
  });
export const unfollow = (userid, playerUsername) =>
  playerFollowModel.findOneAndDelete({
    userid,
    playerUsername: playerUsername.toLowerCase(),
  });

export const touch = (id) =>
  playerFollowModel.updateOne({ _id: id }, { lastVisit: Date.now() });

export const touchIfExist = (userid, playerUsername) =>
  playerFollowModel.updateOne(
    { userid, playerUsername: playerUsername.toLowerCase() },
    { lastVisit: Date.now() }
  );
