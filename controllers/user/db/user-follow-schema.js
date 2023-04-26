import mongoose from "mongoose";
const userFollowSchema = new mongoose.Schema(
  {
    fid: { type: String, required: true },
    tid: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: "user-follows" }
);

export default userFollowSchema;
