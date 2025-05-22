import path from "path";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
import session from "express-session";
import passport from "./utils/passport";
import authRoutes from "./routes/authRoutes";

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);
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

app.get("/", (req, res) => {
  res.json({ message: "API is running" });
});

app.use("/auth", authRoutes);

export default app;
