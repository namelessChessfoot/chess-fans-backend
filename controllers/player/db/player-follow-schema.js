import mongoose from "mongoose";
const playerFollowSchema = new mongoose.Schema(
  {
    userid: { type: String, required: true },
    playerUsername: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    lastVisit: { type: Date, default: Date.now },
  },
  { collection: "player-follows" }
);
export default playerFollowSchema;
