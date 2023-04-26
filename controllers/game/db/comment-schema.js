import mongoose from "mongoose";
const commentSchema = new mongoose.Schema(
  {
    gameid: { type: String, required: true },
    userid: { type: String, required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: "comment" }
);
export default commentSchema;
