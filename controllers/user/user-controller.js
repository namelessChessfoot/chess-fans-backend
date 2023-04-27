import { MyPromiseAll } from "../../tools.js";
import * as userDao from "./db/user-dao.js";
import * as userFollowDao from "./db/user-follow-dao.js";

const userCheck = (req, res, user) => {
  const { username, avatar, email, bio, createdAt, isAdmin } = user;
  const verified = { username, avatar, bio };
  verified.createdAt = Math.floor(new Date(createdAt).getTime() / 1000);
  if (username === req.session["currentUser"]?.username) {
    verified.email = email;
    if (isAdmin) {
      verified.isAdmin = true;
    }
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
    const incomingUser = req.body;
    incomingUser.isAdmin = incomingUser.username === "ADMIN";
    const newUser = await userDao.createUser(incomingUser);
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
  const ret = userCheck(req, res, user);
  const currentUser = req.session["currentUser"];
  if (currentUser) {
    const fo = await userFollowDao.findFollow(currentUser._id, user._id);
    if (fo) {
      ret.followed = Math.floor(new Date(fo.createdAt).getTime() / 1000);
    }
  }
  res.json(ret);
};

const logout = async (req, res) => {
  req.session.destroy();
  res.sendStatus(200);
};

const update = async (req, res) => {
  const currentUser = req.session["currentUser"];
  const body = req.body;
  if (!currentUser) {
    // did not log in
    res.sendStatus(401);
    return;
  }
  if (currentUser.password !== body.oldpassword) {
    // wrong password
    res.sendStatus(403);
    return;
  }
  try {
    delete body.createdAt;
    delete body.isAdmin;
    const user = await userDao.updateUser(currentUser._id, body);
    req.session["currentUser"] = user;
    res.json(userCheck(req, res, user));
  } catch (e) {
    res.sendStatus(400);
  }
};

const followUser = async (req, res) => {
  const currentUser = req.session["currentUser"];
  if (!currentUser) {
    res.sendStatus(401);
    return;
  }
  const fid = currentUser._id;
  const tname = req.body.username;
  const tuser = await userDao.findUserByUsername(tname);
  if (!tuser) {
    res.sendStatus(404);
    return;
  }
  const tid = tuser._id;
  const removed = await userFollowDao.unfollow(fid, tid);
  const ret = { follow: false };
  if (!removed) {
    await userFollowDao.follow(fid, tid);
    ret.follow = true;
  }
  res.json(ret);
};

const getFollowing = async (req, res) => {
  let username = req.params.username;
  if (!username) {
    const currentUser = req.session["currentUser"];
    if (!currentUser) {
      res.sendStatus(401);
      return;
    } else {
      username = currentUser.username;
    }
  }
  const user = await userDao.findUserByUsername(username);
  if (!user) {
    res.sendStatus(404);
    return;
  }
  const follows = await userFollowDao.findFollowByFid(user._id);
  const following = (
    await MyPromiseAll(
      follows.map((f) => [
        async (fo) => {
          const { tid, createdAt } = fo;
          const user = await userDao.findUserById(tid);
          if (!user) {
            return null;
          }
          const uc = userCheck(req, res, user);
          uc.followed = Math.floor(new Date(createdAt).getTime() / 1000);
          return uc;
        },
        [f],
      ])
    )
  ).filter((r) => r !== null);
  res.json(following);
};

const getFollower = async (req, res) => {
  let username = req.params.username;
  if (!username) {
    const currentUser = req.session["currentUser"];
    if (!currentUser) {
      res.sendStatus(401);
      return;
    } else {
      username = currentUser.username;
    }
  }
  const user = await userDao.findUserByUsername(username);
  if (!user) {
    res.sendStatus(404);
    return;
  }
  const follows = await userFollowDao.findFollowByTid(user._id);
  const follower = (
    await MyPromiseAll(
      follows.map((f) => [
        async (fo) => {
          const { fid, createdAt } = fo;
          const user = await userDao.findUserById(fid);
          if (!user) {
            return null;
          }
          const uc = userCheck(req, res, user);
          uc.followed = Math.floor(new Date(createdAt).getTime() / 1000);
          return uc;
        },
        [f],
      ])
    )
  ).filter((r) => r !== null);
  res.json(follower);
};

export default (app) => {
  app.post("/api/user/register", register);
  app.post("/api/user/login", login);
  app.get("/api/user/profile", profile);
  app.get("/api/user/profile/:username", otherProfile);
  app.post("/api/user/logout", logout);
  app.put("/api/user/update", update);
  app.post("/api/user/follow", followUser);
  app.get("/api/user/following/:username", getFollowing);
  app.get("/api/user/follower/:username", getFollower);
  app.get("/api/user/following", getFollowing);
  app.get("/api/user/follower", getFollower);
};
