import assert from "node:assert/strict";
import test from "node:test";
import {
  buildWeeklyActivity,
  completeHabit,
  normalizeHabit,
  uncompleteHabit,
  weeklySummary,
} from "./activity.js";

test("normalizes legacy habit data into durable history", () => {
  const habit = normalizeHabit({ id: "h1", name: "Read", mins: 20, streak: 2, lastDone: "2026-09-14" });

  assert.deepEqual(habit.completedDays, ["2026-09-14"]);
  assert.equal(habit.completionLog[0].source, "legacy");
  assert.equal(habit.streak, 2);
});

test("records and removes a manual habit completion", () => {
  const habit = { id: "h1", name: "Read", mins: 20, streak: 0, lastDone: "" };
  const completed = completeHabit(habit, { day: "2026-09-14", at: 1, source: "manual" });
  const reverted = uncompleteHabit(completed, "2026-09-14");

  assert.equal(completed.lastDone, "2026-09-14");
  assert.equal(completed.completionLog[0].source, "manual");
  assert.equal(reverted.lastDone, "");
  assert.deepEqual(reverted.completedDays, []);
});

test("weekly activity separates one completed task from three habits", () => {
  const activity = buildWeeklyActivity({
    now: new Date("2026-09-15T12:00:00"),
    pomo: {
      history: [
        { day: "2026-09-14", mins: 25, name: "Portfolio", todoId: "t1", sourceType: "task" },
        { day: "2026-09-14", mins: 15, name: "Read", habitId: "h1", sourceType: "habit" },
        { day: "2026-09-14", mins: 15, name: "Water", habitId: "h2", sourceType: "habit" },
        { day: "2026-09-14", mins: 15, name: "Walk", habitId: "h3", sourceType: "habit" },
      ],
    },
    todos: [{ id: "t1", title: "Portfolio", done: true, doneAt: new Date("2026-09-14T10:00:00").getTime() }],
    habits: [
      { id: "h1", name: "Read", mins: 15, completedDays: ["2026-09-14"] },
      { id: "h2", name: "Water", mins: 15, completedDays: ["2026-09-14"] },
      { id: "h3", name: "Walk", mins: 15, completedDays: ["2026-09-14"] },
    ],
  });
  const sunday = activity.find((day) => day.key === "2026-09-14");
  const summary = weeklySummary(activity);

  assert.equal(sunday.tasks, 1);
  assert.equal(sunday.habits, 3);
  assert.equal(summary.focusMinutes, 70);
});
