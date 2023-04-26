import express from "express";
import cors from "cors";
// import session from "express-session";
import session from "cookie-session";
import mongoose from "mongoose";
import playerController from "./controllers/player/player-controller.js";
import userController from "./controllers/user/user-controller.js";
import gameController from "./controllers/game/game-controller.js";

const CONNECTION_STRING =
  process.env.DB_CONNECTION_STRING || "mongodb://127.0.0.1:27017/chess-fans";
const FRONTEND = process.env.FRONTEND || "http://localhost:3000";
mongoose.connect(CONNECTION_STRING);

const app = express();
const sess = {
  secret: "HappyGraduation",
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false },
};
if (process.env.FRONTEND) {
  app.set("trust proxy", 1);
  sess.cookie.secure = true;
  sess.cookie.sameSite = "none";
}
app.use(session(sess));
app.use(
  cors({
    credentials: true,
    origin: FRONTEND,
  })
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
