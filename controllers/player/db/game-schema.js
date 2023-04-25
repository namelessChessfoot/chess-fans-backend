import mongoose from "mongoose";
const gameSchema = new mongoose.Schema(
  {
    gameid: { type: String, unique: true, required: true },
    url: { type: String, required: true },
  },
  { collection: "game" }
);
export default gameSchema;
