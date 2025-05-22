import path from "path";
import dotenv from "dotenv";
import favicon from "serve-favicon";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import express from "express";
import cors from "cors";
import passport from "./utils/passport";
import authRoutes from "./routes/authRoutes";
import session from "express-session";

const app = express();

app.use(favicon(path.join(__dirname, "../public", "favicon.ico")));

app.use(cors());
app.use(express.json());

app.use(
  session({
    secret: process.env.JWT_SECRET!,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use("/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("API is running");
});

export default app;
