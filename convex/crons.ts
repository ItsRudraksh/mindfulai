import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
  "send_daily_emails",
  { hourUTC: 9, minuteUTC: 0 },
  internal.email.sendDailyEmailsToProUsers
);

crons.weekly(
  "send_weekly_report_emails",
  { dayOfWeek: "monday", hourUTC: 9, minuteUTC: 0 },
  internal.email.sendWeeklyEmailsToProUsers
);

export default crons;
