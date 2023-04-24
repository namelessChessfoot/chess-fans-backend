import * as userDao from "./db/user-dao.js";

const userCheck = (req, res, user) => {
  const { username, avatar, email, bio, createdAt } = user;
  const verified = { username, avatar, bio };
  verified.createdAt = Math.floor(new Date(createdAt).getTime() / 1000);
  if (username === req.session["currentUser"]?.username) {
    verified.email = email;
  }
  return verified;
};

const register = async (req, res) => {
  try {
    const username = req.body.username;
    const user = await userDao.findUserByUsername(username);
    if (user) {
      res.sendStatus(409);
      return;
    }
    const newUser = await userDao.createUser(req.body);
    req.session["currentUser"] = newUser;
    res.json(userCheck(req, res, newUser));
  } catch (e) {
    res.sendStatus(400);
  }
};
const login = async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const user = await userDao.findUserByCredentials(username, password);
  if (user) {
    req.session["currentUser"] = user;
    res.json(userCheck(req, res, user));
  } else {
    res.sendStatus(404);
  }
};

const profile = async (req, res) => {
  const currentUser = req.session["currentUser"];
  if (!currentUser) {
    res.sendStatus(404);
    return;
  }
  res.json(userCheck(req, res, currentUser));
};

const otherProfile = async (req, res) => {
  const username = req.params.username;
  const user = await userDao.findUserByUsername(username);
  if (!user) {
    res.sendStatus(404);
    return;
  }
  res.json(userCheck(req, res, user));
};

const logout = async (req, res) => {
  req.session.destroy();
  res.sendStatus(200);
};

const update = async (req, res) => {};

export default (app) => {
  app.post("/api/user/register", register);
  app.post("/api/user/login", login);
  app.get("/api/user/profile", profile);
  app.get("/api/user/profile/:username", otherProfile);
  app.post("/api/user/logout", logout);
  app.put("/api/user", update);
};
