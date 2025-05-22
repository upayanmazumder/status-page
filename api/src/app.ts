import path from "path";
import dotenv from "dotenv";

// Load .env from project root (two levels up from src/)
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import express from "express";
import cors from "cors";
import passport from "./utils/passport";
import authRoutes from "./routes/authRoutes";
import session from "express-session";

const app = express();

app.use(cors());
app.use(express.json());

// Passport session setup
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
