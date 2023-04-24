import mongoose from "mongoose";
import playerFollowSchema from "./player-follow-schema.js";
const playerFollowModel = mongoose.model("player-follows", playerFollowSchema);
export default playerFollowModel;
