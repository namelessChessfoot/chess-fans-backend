import * as gameDao from "./db/game-dao.js";
import * as commentDao from "./db/comment-dao.js";
import * as userDao from "../user/db/user-dao.js";
import * as userFollowDao from "../user/db/user-follow-dao.js";
import { MyPromiseAll } from "../../tools.js";

const commentInfoFilter = (comment) => {
  const { gameid, userid, content, createdAt, _id } = comment;
  return {
    _id,
    gameid,
    content,
    createdAt: Math.floor(new Date(createdAt).getTime() / 1000),
  };
};

const generateFullComments = async (comments) => {
  return await MyPromiseAll(
    comments.map((c) => [
      async (cc) => {
        const uid = cc.userid;
        const pcc = commentInfoFilter(cc);
        const user = await userDao.findUserById(uid);
        pcc.avatar = user.avatar;
        pcc.username = user.username;
        return pcc;
      },
      [c],
    ])
  );
};

const postComment = async (req, res) => {
  const currentUser = req.session["currentUser"];
  if (!currentUser) {
    res.sendStatus(401);
    return;
  }
  const userid = currentUser._id;
  const { gameid, content } = req.body;
  if (!gameid || !content) {
    res.sendStatus(400);
    return;
  }
  const comment = await commentDao.createComment(gameid, userid, content);
  const ret = commentInfoFilter(comment);
  ret.avatar = currentUser.avatar;
  ret.username = currentUser.username;
  res.json(ret);
};

const getGameComment = async (req, res) => {
  const gameid = req.params.gameid;
  const comments = await commentDao.getCommentByGame(gameid);
  const ret = await generateFullComments(comments);
  res.json(ret);
};

const deleteComment = async (req, res) => {
  const commentid = req.params.commentid;
  const currentUser = req.session["currentUser"];
  if (!currentUser) {
    res.sendStatus(401);
    return;
  }
  const query = { _id: commentid };
  if (!currentUser.isAdmin) {
    // If the current user is not admin, they can only delete their own comments
    query.userid = currentUser._id;
  }
  const removed = await commentDao.deleteComment(query);
  if (!removed) {
    res.sendStatus(403);
    return;
  }
  res.sendStatus(200);
};

const getUserComment = async (req, res) => {
  let username = req.params.username,
    uid = "";
  if (username) {
    const user = await userDao.findUserByUsername(username);
    if (!user) {
      res.sendStatus(404);
      return;
    }
    uid = user._id;
  } else {
    const currentUser = req.session["currentUser"];
    if (!currentUser) {
      res.sendStatus(401);
      return;
    }
    uid = currentUser._id;
  }
  const comments = await commentDao.getCommentByUser(uid);
  const ret = await generateFullComments(comments);
  res.json(ret);
};

const getRecentComments = async (req, res) => {
  const currentUser = req.session["currentUser"];
  if (!currentUser) {
    res.sendStatus(401);
    return;
  }
  const fid = currentUser._id;
  // const fid = "644892126b278197485d387c";
  const follows = await userFollowDao.findFollowByFid(fid);
  const threshold_date = new Date();
  threshold_date.setDate(threshold_date.getDate() - 3);
  const ret = [];
  await MyPromiseAll(
    follows.map((f) => [
      async (ff) => {
        const [comments, user] = await MyPromiseAll([
          [commentDao.getRecentComments, [ff.tid, threshold_date]],
          [userDao.findUserById, [ff.tid]],
        ]);
        comments.forEach((c) => {
          const tmp = commentInfoFilter(c);
          tmp.username = user.username;
          tmp.avatar = user.avatar;
          ret.push(tmp);
        });
        return true;
      },
      [f],
    ])
  );
  ret.sort((a, b) => b.createdAt - a.createdAt);
  res.json(ret);
};

export default (app) => {
  app.post("/api/game/comment", postComment);
  app.get("/api/game/comment/:gameid", getGameComment);
  app.get("/api/game/user/comment/:username", getUserComment);
  app.get("/api/game/user/comment", getUserComment);
  app.delete("/api/game/comment/:commentid", deleteComment);
  app.get("/api/game/following/comment", getRecentComments);
};
