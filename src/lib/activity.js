export const localDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const addDays = (key, amount) => {
  const date = new Date(`${key}T00:00:00`);
  date.setDate(date.getDate() + amount);
  return localDateKey(date);
};

const uniqueDays = (days) =>
  [...new Set((days ?? []).filter((day) => /^\d{4}-\d{2}-\d{2}$/.test(day)))].sort();

export const streakForDays = (days, lastDone) => {
  const completed = new Set(uniqueDays(days));
  let current = lastDone;
  let streak = 0;
  while (current && completed.has(current)) {
    streak += 1;
    current = addDays(current, -1);
  }
  return streak;
};

export const normalizeHabit = (habit) => {
  const completedDays = uniqueDays([
    ...(Array.isArray(habit.completedDays) ? habit.completedDays : []),
    ...(habit.lastDone ? [habit.lastDone] : []),
  ]);
  const lastDone = completedDays.at(-1) || "";
  return {
    ...habit,
    mins: typeof habit.mins === "number" ? habit.mins : 15,
    lastDone,
    completedDays,
    completionLog: Array.isArray(habit.completionLog)
      ? habit.completionLog
      : lastDone
        ? [{ day: lastDone, at: 0, mins: habit.mins || 15, source: "legacy" }]
        : [],
    // Older installs saved only the current streak and last completed day.
    // Keep that earned value until enough day-by-day history exists to replace it.
    streak: Math.max(habit.streak || 0, streakForDays(completedDays, lastDone)),
  };
};

export const completeHabit = (habit, completion) => {
  const day = completion.day;
  const normalized = normalizeHabit(habit);
  if (normalized.completedDays.includes(day)) return normalized;

  const completedDays = uniqueDays([...normalized.completedDays, day]);
  const streak =
    normalized.lastDone === addDays(day, -1) ? normalized.streak + 1 : 1;
  return {
    ...normalized,
    lastDone: day,
    completedDays,
    streak,
    completionLog: [
      ...normalized.completionLog,
      {
        day,
        at: completion.at ?? Date.now(),
        mins: completion.mins ?? normalized.mins,
        source: completion.source ?? "manual",
      },
    ],
  };
};

export const uncompleteHabit = (habit, day) => {
  const normalized = normalizeHabit(habit);
  const completedDays = normalized.completedDays.filter((entry) => entry !== day);
  const lastDone = completedDays.at(-1) || "";
  return {
    ...normalized,
    lastDone,
    completedDays,
    streak:
      normalized.lastDone === day
        ? Math.max(0, normalized.streak - 1)
        : streakForDays(completedDays, lastDone),
    completionLog: normalized.completionLog.filter((entry) => entry.day !== day),
  };
};

export const buildWeeklyActivity = ({ pomo = {}, todos = [], habits = [], now = new Date() }) => {
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return {
      key: localDateKey(date),
      label: date.toLocaleDateString(undefined, { weekday: "short" }),
      date: date.getDate(),
      mins: 0,
      tasks: 0,
      habits: 0,
    };
  });
  const dayIndex = new Map(days.map((day, index) => [day.key, index]));

  (pomo.history ?? []).forEach((entry) => {
    const index = dayIndex.get(entry.day);
    if (index !== undefined) days[index].mins += entry.mins || 0;
  });

  const taskSets = days.map(() => new Set());
  const habitSets = days.map(() => new Set());
  const habitNames = new Set(habits.map((habit) => habit.name.trim().toLocaleLowerCase()));

  (pomo.history ?? []).forEach((entry) => {
    const index = dayIndex.get(entry.day);
    if (index === undefined) return;
    const name = String(entry.name || "").trim();
    const source = entry.sourceType || (habitNames.has(name.toLocaleLowerCase()) ? "habit" : "task");
    if (source === "task") taskSets[index].add(entry.todoId || `name:${name || "task"}`);
    if (source === "habit") habitSets[index].add(entry.habitId || `name:${name || "habit"}`);
  });

  todos.forEach((todo) => {
    if (!todo.done || !todo.doneAt) return;
    const index = dayIndex.get(localDateKey(new Date(todo.doneAt)));
    if (index === undefined) return;
    const legacyKey = `name:${todo.title}`;
    if (taskSets[index].has(legacyKey)) taskSets[index].delete(legacyKey);
    taskSets[index].add(todo.id || legacyKey);
  });

  habits.map(normalizeHabit).forEach((habit) => {
    habit.completedDays.forEach((completedDay) => {
      const index = dayIndex.get(completedDay);
      if (index === undefined) return;
      const legacyKey = `name:${habit.name}`;
      if (habitSets[index].has(legacyKey)) habitSets[index].delete(legacyKey);
      habitSets[index].add(habit.id || legacyKey);
    });
  });

  return days.map((day, index) => ({
    ...day,
    tasks: taskSets[index].size,
    habits: habitSets[index].size,
  }));
};

export const weeklySummary = (activity, habits = []) => ({
  focusMinutes: activity.reduce((total, day) => total + day.mins, 0),
  completedTasks: activity.reduce((total, day) => total + day.tasks, 0),
  completedHabits: activity.reduce((total, day) => total + day.habits, 0),
  bestDay: activity.reduce(
    (best, day) => (day.mins > best.mins ? day : best),
    activity[0] ?? { label: "-", mins: 0 },
  ),
  longestStreak: habits.map(normalizeHabit).reduce((best, habit) => Math.max(best, habit.streak), 0),
});
