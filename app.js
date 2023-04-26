import express from "express";
import cors from "cors";
import session from "express-session";
import mongoose from "mongoose";
import playerController from "./controllers/player/player-controller.js";
import userController from "./controllers/user/user-controller.js";
import gameController from "./controllers/game/game-controller.js";

const CONNECTION_STRING =
  process.env.DB_CONNECTION_STRING || "mongodb://127.0.0.1:27017/chess-fans";
const FRONTEND = process.env.FRONTEND || "http://localhost:3000";
mongoose.connect(CONNECTION_STRING);

const app = express();
app.use(
  cors({
    credentials: true,
    origin: FRONTEND,
  })
);
app.use(
  session({ secret: "HappyGraduation", resave: false, saveUninitialized: true })
);
app.use(express.json());
app.get("/hello", async (req, res) => {
  console.log("Hello world");
  res.json("Hello world");
});
userController(app);
playerController(app);
gameController(app);
app.listen(4000);
