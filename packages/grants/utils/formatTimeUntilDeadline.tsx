import { DateTime } from "luxon";

export const formatTimeUntilDeadline = (deadline: Date): string => {
  const date1 = DateTime.fromISO(new Date().toISOString());
  const date2 = DateTime.fromISO(deadline?.toISOString());
  const diff = date2.diff(date1, ["days", "hours", "minutes", "seconds"]).toObject();
  if (diff.days >= 1) return `${diff.days} days left`;
  if (diff.hours > 1) return `${diff.hours} hours and ${diff.minutes} minutes left`;
  if (diff.hours === 1) return `${diff.hours} hour and ${diff.minutes} minutes left`;
  if (diff.minutes > 1) return `${diff.minutes} minutes left`;
  if (diff.minutes === 1) return `${diff.minutes} minute left`;
  if (diff.seconds === 1) return `${diff.seconds} second left`;
  if (diff.seconds > 0) return `${diff.seconds} seconds left`;
  return "Voting has ended";
};
