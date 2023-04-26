import mongoose from "mongoose";
import gameSchema from "./game-schema.js";
const gameModel = mongoose.model("game", gameSchema);
export default gameModel;
