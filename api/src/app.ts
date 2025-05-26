import path from "path";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
import session from "express-session";
import passport from "./utils/passport";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import applicationRoutes from "./routes/applicationRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import { checkAllApplicationsStatus } from "./jobs/applicationStatusChecker";

setInterval(() => {
  checkAllApplicationsStatus().catch((err) =>
    console.error("Status check error:", err)
  );
}, 60 * 1000);

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
  res.json({
    message: "API is running",
    uptime: Math.round(process.uptime()),
  });
});

app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/applications", applicationRoutes);
app.use("/dashboards", dashboardRoutes);

export default app;
