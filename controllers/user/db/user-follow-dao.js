import userFollowModel from "./user-follow-model.js";

export const follow = (fid, tid) => userFollowModel.create({ fid, tid });

export const unfollow = (fid, tid) =>
  userFollowModel.findOneAndDelete({ fid, tid });

export const findFollowByFid = (fid) => userFollowModel.find({ fid });

export const findFollowByTid = (tid) => userFollowModel.find({ tid });

export const findFollow = (fid, tid) => userFollowModel.findOne({ fid, tid });
