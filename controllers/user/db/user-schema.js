import mongoose from "mongoose";
const userSchema = new mongoose.Schema(
  {
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    avatar: { type: String, required: true },
    email: String,
    bio: String,
    createdAt: { type: Date, default: Date.now },
    isAdmin: { type: Boolean, default: false },
  },
  { collection: "users" }
);
export default userSchema;
