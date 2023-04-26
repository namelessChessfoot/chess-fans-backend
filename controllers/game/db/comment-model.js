import mongoose from "mongoose";
import commentSchema from "./comment-schema.js";
const commentModel = mongoose.model("comment", commentSchema);
export default commentModel;
