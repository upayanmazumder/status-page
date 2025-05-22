import path from "path";
import dotenv from "dotenv";

// Load .env from project root (two levels up from src/)
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import mongoose from "mongoose";
import app from "./app";

const PORT = process.env.PORT || 4000;

async function startServer() {
    try {
        await mongoose.connect(process.env.MONGO_URI!);
        console.log("MongoDB connected");

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

startServer();
