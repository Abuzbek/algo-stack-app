export type Rating = "again" | "hard" | "good" | "easy";

export const calculateNextSchedule = (
  rating: Rating,
  currentInterval: number,
): { nextInterval: number; nextReviewAt: string } => {
  let nextInterval = 0;

  if (rating === "again") {
    nextInterval = 1;
  } else {
    // Treat 0 as 1 for multiplication base to avoid stuck at 0
    const baseInterval = currentInterval === 0 ? 1 : currentInterval;

    if (rating === "hard") {
      nextInterval = Math.floor(baseInterval * 1.2);
    } else if (rating === "good") {
      nextInterval = Math.floor(baseInterval * 2.5);
    } else if (rating === "easy") {
      nextInterval = Math.floor(baseInterval * 4.0);
    }
  }

  // Ensure minimum 1 day interval
  if (nextInterval < 1) nextInterval = 1;

  // Calculate Date
  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + nextInterval);

  return {
    nextInterval,
    nextReviewAt: nextReviewAt.toISOString(),
  };
};
