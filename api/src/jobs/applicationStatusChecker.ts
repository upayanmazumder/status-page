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
      status = "online";
    } catch (err: any) {
      status = "offline";
      statusCode = err?.response?.status || 0;
    }

    const lastPeriod = app.statusHistory[app.statusHistory.length - 1];

    if (
      lastPeriod &&
      lastPeriod.status === status &&
      lastPeriod.statusCode === statusCode &&
      !lastPeriod.to
    ) {
    } else {
      if (lastPeriod && !lastPeriod.to) {
        lastPeriod.to = now;
      }

      app.statusHistory.push({
        status,
        statusCode,
        from: lastPeriod?.to ?? now,
        to: undefined,
      } as IStatusPeriod);
    }

    if (app.statusHistory.length > 100) {
      app.statusHistory = app.statusHistory.slice(-100);
    }

    await app.save();
  }
}
