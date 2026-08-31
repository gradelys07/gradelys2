import type { Rating } from "@/types";

// ═══════════════════════════════════════════════════════════════
// SM-2 SPACED REPETITION ALGORITHM
// EF initial 2.5 · Interval initial 1 day · Repetitions 0
// q : Again=0 · Hard=2 · Good=4 · Easy=5
// EF(n) = EF(n-1) + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
// EF min = 1.3
// Interval(n) = Interval(n-1) * EF
// ═══════════════════════════════════════════════════════════════

export const RATING_QUALITY: Record<Rating, number> = {
  again: 0,
  hard: 2,
  good: 4,
  easy: 5,
};

export interface SM2State {
  easinessFactor: number;
  intervalDays: number;
  repetitions: number;
}

export interface SM2Result extends SM2State {
  nextReviewAt: string;
}

export function sm2(state: SM2State, rating: Rating): SM2Result {
  const q = RATING_QUALITY[rating];
  let { easinessFactor: ef, intervalDays: interval, repetitions: reps } = state;

  if (q < 3) {
    // Failed recall — reset repetitions, short interval
    reps = 0;
    interval = 1;
  } else {
    reps += 1;
    if (reps === 1) interval = 1;
    else if (reps === 2) interval = 6;
    else interval = Math.round(interval * ef);
  }

  ef = ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  ef = Math.max(1.3, Number(ef.toFixed(2)));

  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + interval);

  return {
    easinessFactor: ef,
    intervalDays: interval,
    repetitions: reps,
    nextReviewAt: nextReviewAt.toISOString(),
  };
}

export const SM2_DEFAULT: SM2State = {
  easinessFactor: 2.5,
  intervalDays: 1,
  repetitions: 0,
};
