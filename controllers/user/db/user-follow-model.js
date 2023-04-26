import mongoose from "mongoose";
import userFollowSchema from "./user-follow-schema.js";
const userFollowModel = mongoose.model("user-follows", userFollowSchema);
export default userFollowModel;
