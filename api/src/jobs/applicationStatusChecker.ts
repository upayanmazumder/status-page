import {
  Application,
  IApplication,
  IStatusPeriod,
} from "../models/Application";
import axios from "axios";

/**
 * Checks the status of all applications and updates their statusHistory.
 * Runs every minute.
 */
export async function checkAllApplicationsStatus() {
  const apps = await Application.find();
  const now = new Date();

  for (const app of apps) {
    let status: "online" | "offline" = "offline";
    let statusCode = 0;

    try {
      const res = await axios.get(app.url, { timeout: 10000 });
      statusCode = res.status;
      status = res.status === 200 ? "online" : "offline";
    } catch (err: any) {
      status = "offline";
      statusCode = err?.response?.status || 0;
    }

    // Smart update of statusHistory
    const lastPeriod = app.statusHistory[app.statusHistory.length - 1];

    if (
      lastPeriod &&
      lastPeriod.status === status &&
      lastPeriod.statusCode === statusCode &&
      !lastPeriod.to
    ) {
      // Continue the current period, do nothing
    } else {
      // Close previous period if open
      if (lastPeriod && !lastPeriod.to) {
        lastPeriod.to = now;
      }
      // Start a new period, set from = lastPeriod?.to ?? now to avoid gaps
      app.statusHistory.push({
        status,
        statusCode,
        from: lastPeriod?.to ?? now,
        to: undefined,
      } as IStatusPeriod);
    }

    // Limit history to last 100 entries (optional, for storage)
    if (app.statusHistory.length > 100) {
      app.statusHistory = app.statusHistory.slice(-100);
    }

    await app.save();
  }
}
