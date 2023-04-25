import userModel from "./user-model.js";

export const findAllUsers = () => userModel.find();

export const findUserById = (uid) => userModel.findById(uid);

export const findUserByUsername = (username) => userModel.findOne({ username });

export const findUserByCredentials = (username, password) =>
  userModel.findOne({ username, password });

export const createUser = (user) => userModel.create(user);

export const updateUser = (uid, user) =>
  userModel.findOneAndUpdate({ _id: uid }, user, { returnDocument: "after" });

export const deleteUser = (uid) => userModel.deleteOne({ _id: uid });
