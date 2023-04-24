import axios from "axios";
import NodeCache from "node-cache";
import PgnParser from "pgn-parser";
import * as playerFollowDao from "./db/player-follow-dao.js";
import * as userDao from "../user/db/user-dao.js";

//https://www.chess.com/news/view/published-data-api

const urlCache = new NodeCache({ stdTTL: 60 * 60 * 24, checkperiod: 120 });
const pgnCache = new NodeCache({ stdTTL: 5 * 60, checkperiod: 60 });

const playerInfoFilter = (player) => {
  const { url, avatar, title, name, location, country, joined, last_online } =
    player;
  return {
    url,
    username: url.split("/").slice(-1)[0],
    avatar,
    joined,
    last_online,
    location,
    name,
  };
};

const fetchPlayer = async (req, res, username) => {
  const currentUser = req.session["currentUser"];
  // const uid = currentUser?._id || "6444c8661d857fe2c12d4b38";
  const uid = currentUser?._id || "";
  const [{ data: player }, { data: stat }, follow] = await Promise.all([
    axios.get(`https://api.chess.com/pub/player/${username}`),
    axios.get(`https://api.chess.com/pub/player/${username}/stats`),
    playerFollowDao.findFollow(uid, username),
  ]);
  let lastVisit = 0;
  if (follow) {
    lastVisit = Math.floor(new Date(follow.lastVisit).getTime() / 1000);
  }
  return {
    ...playerInfoFilter(player),
    rating: stat?.chess_blitz?.last?.rating,
    subscribed: lastVisit,
  };
};

const getPlayer = async (req, res) => {
  const rusername = req.params.username;
  try {
    const player = await fetchPlayer(req, res, rusername);
    res.json(player);
  } catch (e) {
    res.sendStatus(404);
  }
};

const cacheGame = (game, url) => {
  const id = game.uuid;
  const pgn = game.pgn;
  const [res] = PgnParser.parse(pgn);
  game.result = res.result;
  pgnCache.set(id, pgn);
  urlCache.set(id, url);
};

const getPlayerGames = async (req, res) => {
  const rusername = req.params.username;
  const rtime = new Date(req.params.time);
  if (isNaN(rtime)) {
    res.sendStatus(400);
    return;
  }
  try {
    const chess_archives = (
      await axios.get(
        `https://api.chess.com/pub/player/${rusername}/games/archives`
      )
    ).data.archives;
    const archives = chess_archives.filter((url) => {
      const [y, m] = url.split("/").slice(-2);
      return new Date(y, m, 1) >= rtime;
    });
    const all_games = (
      await Promise.all(archives.map((url) => axios.get(url)))
    ).map((i) => i.data.games);
    const ret = [];
    let go = true;
    for (let i = all_games.length - 1; go && i >= 0; --i) {
      const monthly_games = all_games[i],
        url = archives[i];
      for (let j = monthly_games.length - 1; j >= 0; --j) {
        const game = monthly_games[j];
        const d = new Date(game.end_time * 1000); // Stupid JS use timestamp in milliseconds
        if (d < rtime) {
          go = false;
          break;
        }
        cacheGame(game, url);
        ret.push(game);
      }
    }
    res.json(
      ret.map((g) => {
        return {
          id: g.uuid,
          url: g.url,
          initial: g.initial_setup,
          final: g.fen,
          white: g.white,
          black: g.black,
          result: g.result,
          time: g.end_time,
        };
      })
    );
  } catch (e) {
    res.sendStatus(400);
  }
};

const getPGN = async (req, res) => {
  const id = req.params.id;
  let pgn = pgnCache.get(id);
  if (pgn !== undefined) {
    res.json(pgn);
    return;
  }
  const url = urlCache.get(id);
  if (url === undefined) {
    res.sendStatus(404);
    return;
  }
  try {
    const games = (await axios.get(url)).data.games;
    games.forEach((g) => {
      if (g.uuid === id) {
        pgn = g.pgn;
      }
      cacheGame(g, url);
    });
    if (pgn === undefined) {
      res.sendStatus(404);
      return;
    }
    res.json(pgn);
  } catch (e) {
    res.sendStatus(404);
  }
};

const getTopPalyer = async (req, res) => {
  const tmp = [];
  try {
    const chess_leaderboard = (
      await axios.get(`https://api.chess.com/pub/leaderboards`)
    ).data;
    let { live_blitz, live_bullet } = chess_leaderboard;
    const currentUser = req.session["currentUser"];
    const ban = {};
    if (currentUser) {
      const follows = await playerFollowDao.findFollowByUser(currentUser._id);
      follows.forEach((f) => {
        ban[f.playerUsername] = 1;
      });
    }
    for (let i = 0; i < live_blitz.length && tmp.length < 5; ++i) {
      const player = live_blitz[i];
      if (player.username.toLowerCase() in ban) {
        continue;
      }
      tmp.push(player);
    }
    const ret = await Promise.all(
      tmp.map((t) => fetchPlayer(req, res, t.username))
    );
    res.json(ret);
  } catch (e) {
    res.sendStatus(404);
  }
};

const followPlayer = async (req, res) => {
  // Can be used to follow and unfollow
  const currentUser = req.session["currentUser"];
  if (!currentUser) {
    // This API needs login
    res.sendStatus(401);
    return;
  }
  const playerUsername = req.body.target;
  const ret = { subscribed: false, followPlayerTarget: playerUsername };
  const userid = currentUser._id;
  const removed = await playerFollowDao.unfollow(userid, playerUsername);
  if (!removed) {
    await playerFollowDao.follow(userid, playerUsername);
    ret.subscribed = true;
  }
  res.json(ret);
};

const touchPlayer = async (req, res) => {
  const currentUser = req.session["currentUser"];
  const playerUsername = req.body.target;
  if (currentUser) {
    await playerFollowDao.touchIfExist(currentUser._id, playerUsername);
  }
  res.sendStatus(200);
};

const getSubscribePlayers = (self) => {
  return async (req, res) => {
    try {
      let uid = null;
      if (self) {
        const currentUser = req.session["currentUser"];
        if (!currentUser) {
          res.sendStatus(401);
          return;
        }
        // uid = currentUser?._id || "6444c8661d857fe2c12d4b38";
        uid = currentUser._id;
      } else {
        const username = req.params.username;
        const user = await userDao.findUserByUsername(username);
        if (!user) {
          res.sendStatus(404);
          return;
        }
        uid = user._id;
      }
      const follows = await playerFollowDao.findFollowByUser(uid);
      const players = await Promise.all(
        follows.map((f) => fetchPlayer(req, res, f.playerUsername))
      );
      res.json(players);
    } catch (e) {
      res.sendStatus(400);
    }
  };
};

export default (app) => {
  app.get("/api/player/:username", getPlayer);
  app.get("/api/player/pgn/:id", getPGN);
  app.get("/api/player/games/:username/:time", getPlayerGames);
  app.get("/api/player/top/players", getTopPalyer);
  app.post("/api/player/follow", followPlayer);
  app.post("/api/player/touch", touchPlayer);
  app.get("/api/player/subscribe/players", getSubscribePlayers(true));
  app.get(
    "/api/player/subscribe/players/:username",
    getSubscribePlayers(false)
  );
};
