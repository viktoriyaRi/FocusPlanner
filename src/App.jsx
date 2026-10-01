import {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Toaster, toast } from "react-hot-toast";
import confetti from "canvas-confetti";
import {
  buildWeeklyActivity,
  completeHabit,
  normalizeHabit,
  uncompleteHabit,
  weeklySummary,
} from "./lib/activity";
import focusPlannerMark from "./assets/focusplanner-logo.png";

/* ===================== Theme boot ===================== */
const THEME_KEY = "theme";
const ACTIVE_POMO_KEY = "ff.activePomo";
const PAGE_THEME_KEY = "ff.pageTheme";
const AVATAR_KEY = "ff.avatar";
const PROFILE_NAME_KEY = "ff.profileName";
const ONBOARDING_DONE_KEY = "ff.onboardingDone";
const NATIVE_TODO_IDS_KEY = "ff.nativeTodoNotifIds";
const NATIVE_POMO_NOTIFICATION_ID = 900001;
const assetUrl = (name) =>
  `${location.origin}${import.meta.env.BASE_URL}${name}`;
const svgToDataUrl = (svg) =>
  `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
const makeEmojiAvatarSvg = ({
  bgA,
  bgB,
  emoji,
  accent = "rgba(255,255,255,0.22)",
}) => `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
    <defs>
      <linearGradient id="g" x1="8" y1="8" x2="88" y2="88" gradientUnits="userSpaceOnUse">
        <stop stop-color="${bgA}" />
        <stop offset="1" stop-color="${bgB}" />
      </linearGradient>
    </defs>
    <rect width="96" height="96" rx="32" fill="url(#g)" />
    <circle cx="48" cy="48" r="26" fill="${accent}" />
    <text x="48" y="58" text-anchor="middle" font-size="34">${emoji}</text>
  </svg>
`;
const PRESET_AVATARS = [
  {
    id: "spark",
    label: "Spark",
    src: svgToDataUrl(
      makeEmojiAvatarSvg({
        bgA: "#38BDF8",
        bgB: "#2563EB",
        emoji: "✨",
      }),
    ),
  },
  {
    id: "smile",
    label: "Smile",
    src: svgToDataUrl(
      makeEmojiAvatarSvg({
        bgA: "#FDE68A",
        bgB: "#F59E0B",
        emoji: "😊",
      }),
    ),
  },
  {
    id: "cool",
    label: "Cool",
    src: svgToDataUrl(
      makeEmojiAvatarSvg({
        bgA: "#C4B5FD",
        bgB: "#7C3AED",
        emoji: "😎",
      }),
    ),
  },
  {
    id: "love",
    label: "Love",
    src: svgToDataUrl(
      makeEmojiAvatarSvg({
        bgA: "#F9A8D4",
        bgB: "#EC4899",
        emoji: "😍",
      }),
    ),
  },
  {
    id: "calm",
    label: "Calm",
    src: svgToDataUrl(
      makeEmojiAvatarSvg({
        bgA: "#6EE7B7",
        bgB: "#0F766E",
        emoji: "😌",
      }),
    ),
  },
  {
    id: "party",
    label: "Party",
    src: svgToDataUrl(
      makeEmojiAvatarSvg({
        bgA: "#FCA5A5",
        bgB: "#F97316",
        emoji: "🥳",
      }),
    ),
  },
  {
    id: "dream",
    label: "Dream",
    src: svgToDataUrl(
      makeEmojiAvatarSvg({
        bgA: "#93C5FD",
        bgB: "#4F46E5",
        emoji: "🌙",
      }),
    ),
  },
  {
    id: "heart",
    label: "Heart",
    src: svgToDataUrl(
      makeEmojiAvatarSvg({
        bgA: "#FDBA74",
        bgB: "#EF4444",
        emoji: "🧡",
      }),
    ),
  },
];
const PAGE_THEMES = {
  midnight: {
    label: "Default",
    lightFrom: "#f8fafc",
    lightTo: "#e2e8f0",
    darkFrom: "#020617",
    darkTo: "#0f172a",
    glowA: "rgba(56, 189, 248, 0.14)",
    glowB: "rgba(99, 102, 241, 0.14)",
    glowC: "rgba(15, 23, 42, 0.20)",
    card: "bg-white/88 border-slate-200/80 dark:bg-slate-800/88 dark:border-slate-700/85",
    primaryButton:
      "bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200",
    secondaryButton:
      "bg-white/85 border-slate-200 text-slate-700 hover:bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800",
    selectShell:
      "bg-white/80 border-slate-200 text-slate-700 dark:bg-slate-800/90 dark:text-slate-100 dark:border-slate-700",
    progress: "from-sky-500 to-indigo-500 dark:from-sky-400 dark:to-indigo-400",
    rangeAccent: "#0f172a",
    rangeAccentDark: "#e2e8f0",
    chart: "#0ea5e9",
    chartDark: "#60a5fa",
  },
  ocean: {
    label: "Ocean",
    lightFrom: "#ecfeff",
    lightTo: "#dbeafe",
    darkFrom: "#082f49",
    darkTo: "#0f172a",
    glowA: "rgba(34, 211, 238, 0.18)",
    glowB: "rgba(59, 130, 246, 0.18)",
    glowC: "rgba(14, 116, 144, 0.18)",
    card: "bg-cyan-50/82 border-cyan-100/90 dark:bg-sky-950/45 dark:border-cyan-900/70",
    primaryButton:
      "bg-cyan-600 text-white hover:bg-cyan-500 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300",
    secondaryButton:
      "bg-white/85 border-cyan-100 text-cyan-900 hover:bg-white dark:bg-sky-950/80 dark:border-cyan-900 dark:text-cyan-100 dark:hover:bg-sky-900",
    selectShell:
      "bg-white/80 border-cyan-100 text-cyan-900 dark:bg-sky-950/85 dark:text-cyan-100 dark:border-cyan-900",
    progress: "from-cyan-500 to-blue-500 dark:from-cyan-300 dark:to-sky-400",
    rangeAccent: "#0891b2",
    rangeAccentDark: "#67e8f9",
    chart: "#0891b2",
    chartDark: "#67e8f9",
  },
  mint: {
    label: "Mint",
    lightFrom: "#f0fdf4",
    lightTo: "#dcfce7",
    darkFrom: "#052e2b",
    darkTo: "#0f172a",
    glowA: "rgba(52, 211, 153, 0.18)",
    glowB: "rgba(16, 185, 129, 0.16)",
    glowC: "rgba(13, 148, 136, 0.16)",
    card: "bg-emerald-50/84 border-emerald-100/90 dark:bg-emerald-950/35 dark:border-emerald-900/70",
    primaryButton:
      "bg-emerald-600 text-white hover:bg-emerald-500 dark:bg-emerald-400 dark:text-slate-950 dark:hover:bg-emerald-300",
    secondaryButton:
      "bg-white/85 border-emerald-100 text-emerald-900 hover:bg-white dark:bg-emerald-950/70 dark:border-emerald-900 dark:text-emerald-100 dark:hover:bg-emerald-900",
    selectShell:
      "bg-white/80 border-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-100 dark:border-emerald-900",
    progress:
      "from-emerald-500 to-teal-500 dark:from-emerald-300 dark:to-teal-300",
    rangeAccent: "#059669",
    rangeAccentDark: "#6ee7b7",
    chart: "#10b981",
    chartDark: "#6ee7b7",
  },
  sunset: {
    label: "Sunset",
    lightFrom: "#fff7ed",
    lightTo: "#ffe4e6",
    darkFrom: "#431407",
    darkTo: "#1f2937",
    glowA: "rgba(251, 146, 60, 0.18)",
    glowB: "rgba(244, 114, 182, 0.16)",
    glowC: "rgba(239, 68, 68, 0.14)",
    card: "bg-orange-50/84 border-orange-100/90 dark:bg-orange-950/35 dark:border-rose-900/70",
    primaryButton:
      "bg-orange-500 text-white hover:bg-orange-400 dark:bg-rose-400 dark:text-slate-950 dark:hover:bg-rose-300",
    secondaryButton:
      "bg-white/85 border-orange-100 text-orange-900 hover:bg-white dark:bg-orange-950/75 dark:border-rose-900 dark:text-orange-100 dark:hover:bg-orange-900",
    selectShell:
      "bg-white/80 border-orange-100 text-orange-900 dark:bg-orange-950/80 dark:text-orange-100 dark:border-rose-900",
    progress:
      "from-orange-500 to-rose-500 dark:from-orange-300 dark:to-pink-300",
    rangeAccent: "#ea580c",
    rangeAccentDark: "#fdba74",
    chart: "#f97316",
    chartDark: "#fdba74",
  },
  aurora: {
    label: "Aurora",
    lightFrom: "#f5f3ff",
    lightTo: "#e0f2fe",
    darkFrom: "#1e1b4b",
    darkTo: "#0f172a",
    glowA: "rgba(168, 85, 247, 0.18)",
    glowB: "rgba(34, 211, 238, 0.16)",
    glowC: "rgba(59, 130, 246, 0.16)",
    card: "bg-violet-50/84 border-violet-100/90 dark:bg-indigo-950/40 dark:border-violet-900/70",
    primaryButton:
      "bg-violet-600 text-white hover:bg-violet-500 dark:bg-violet-400 dark:text-slate-950 dark:hover:bg-violet-300",
    secondaryButton:
      "bg-white/85 border-violet-100 text-violet-900 hover:bg-white dark:bg-indigo-950/80 dark:border-violet-900 dark:text-violet-100 dark:hover:bg-indigo-900",
    selectShell:
      "bg-white/80 border-violet-100 text-violet-900 dark:bg-indigo-950/85 dark:text-violet-100 dark:border-violet-900",
    progress:
      "from-violet-500 to-cyan-500 dark:from-violet-300 dark:to-cyan-300",
    rangeAccent: "#7c3aed",
    rangeAccentDark: "#c4b5fd",
    chart: "#8b5cf6",
    chartDark: "#c4b5fd",
  },
};
const NOTIFICATION_THEME = {
  icon: assetUrl("notification-energy-icon.svg"),
  badge: assetUrl("notification-energy-badge.svg"),
  shell:
    "bg-slate-950/95 border-sky-800 text-slate-50 dark:bg-slate-950/95 dark:border-sky-800 dark:text-slate-50",
  orb: "bg-gradient-to-br from-cyan-400 via-blue-500 to-violet-600 text-white shadow-sky-500/35",
  orbSymbol: "✦",
  kicker: "bg-amber-400/20 text-amber-200 dark:text-amber-200",
  subtext: "text-slate-300 dark:text-slate-300",
  taskChip:
    "bg-violet-500/20 text-violet-100 dark:bg-violet-500/20 dark:text-violet-100",
  minutesChip: "bg-cyan-400/20 text-cyan-100 dark:text-cyan-100",
  sessionChip: "bg-amber-400/20 text-amber-100 dark:text-amber-100",
  close:
    "text-slate-400 hover:bg-white/10 hover:text-white dark:hover:bg-white/10 dark:hover:text-white",
};
const getPageThemeKey = () =>
  localStorage.getItem(PAGE_THEME_KEY) || "midnight";
const getPageThemeConfig = () =>
  PAGE_THEMES[getPageThemeKey()] || PAGE_THEMES.midnight;
const uiTheme = getPageThemeConfig;
(() => {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved) {
    if (saved === "dark") document.documentElement.classList.add("dark");
  } else {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    if (prefersDark) document.documentElement.classList.add("dark");
    localStorage.setItem(THEME_KEY, prefersDark ? "dark" : "light");
  }
})();

/* ===================== Helpers ===================== */
const load = (k, d) => {
  try {
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) : d;
  } catch {
    return d;
  }
};
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const loadActivePomodoro = () => load(ACTIVE_POMO_KEY, null);
const saveActivePomodoro = (session) => save(ACTIVE_POMO_KEY, session);
const clearActivePomodoro = () => localStorage.removeItem(ACTIVE_POMO_KEY);
const POMODORO_ACTION_BUTTON =
  "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500";
async function fileToAvatarDataUrl(file, size = 256) {
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("read_failed"));
    reader.readAsDataURL(file);
  });

  const image = await loadImageElement(dataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas_failed");

  // Crop uploads to a square so the profile image stays consistent everywhere.
  const scale = Math.max(size / image.width, size / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  ctx.drawImage(
    image,
    (size - drawWidth) / 2,
    (size - drawHeight) / 2,
    drawWidth,
    drawHeight,
  );
  return canvas.toDataURL("image/jpeg", 0.9);
}

function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("image_load_failed"));
    image.src = src;
  });
}
const uid = () => Math.random().toString(36).slice(2);
const isNativeApp = () => Capacitor.isNativePlatform();

// Use local date key (not UTC) to avoid day shift at midnight
const todayKey = () => {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d - off * 60_000).toISOString().slice(0, 10);
};

const isDark = () => document.documentElement.classList.contains("dark");
const secureOk = () =>
  window.isSecureContext || location.hostname === "localhost";
const hashNotificationId = (value) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) || 1;
};

// Minutes done TODAY
function sumTodayMinutes(history) {
  const day = todayKey();
  return (history ?? []).reduce(
    (acc, e) => acc + (e.day === day ? e.mins : 0),
    0,
  );
}

/* ---------- Web Notifications ---------- */
const canNotify = () => !isNativeApp() && "Notification" in window;

async function hasNativeNotificationPermission() {
  if (!isNativeApp()) return false;
  const { display } = await LocalNotifications.checkPermissions();
  return display === "granted";
}

async function ensurePermission() {
  if (isNativeApp()) {
    const current = await LocalNotifications.checkPermissions();
    if (current.display === "granted") return true;
    const requested = await LocalNotifications.requestPermissions();
    return requested.display === "granted";
  }
  if (!canNotify()) return false;
  if (!secureOk()) return false; // only HTTPS/localhost
  if (Notification.permission === "granted") return true;
  const p = await Notification.requestPermission();
  return p === "granted";
}

async function cancelNativePomodoroNotification() {
  if (!isNativeApp()) return;
  await LocalNotifications.cancel({
    notifications: [{ id: NATIVE_POMO_NOTIFICATION_ID }],
  });
}

async function scheduleNativePomodoroNotification(endAt) {
  if (!isNativeApp()) return;
  if (!(await hasNativeNotificationPermission())) return;
  await cancelNativePomodoroNotification();
  if (!endAt || endAt <= Date.now()) return;
  await LocalNotifications.schedule({
    notifications: [
      {
        id: NATIVE_POMO_NOTIFICATION_ID,
        title: "Pomodoro complete",
        body: "Take a short break.",
        schedule: { at: new Date(endAt), allowWhileIdle: true },
      },
    ],
  });
}

function buildNativeTodoReminder(todo) {
  if (!todo || todo.done || !todo.due || !todo.time) return null;
  const remindMins = Number(todo.remindMins) || 0;
  if (remindMins <= 0) return null;

  const dueMs = new Date(`${todo.due}T${todo.time}:00`).getTime();
  if (Number.isNaN(dueMs)) return null;

  const remindAt = dueMs - remindMins * 60 * 1000;
  if (remindAt <= Date.now()) return null;

  return {
    id: hashNotificationId(
      `todo:${todo.id}:${todo.due}:${todo.time}:${remindMins}`,
    ),
    title: "Task reminder",
    body: `${todo.title}${todo.time ? ` at ${todo.time}` : ""}`,
    schedule: { at: new Date(remindAt), allowWhileIdle: true },
  };
}

async function syncNativeTodoReminders(todos) {
  if (!isNativeApp()) return;

  const previousIds = load(NATIVE_TODO_IDS_KEY, []);
  if (previousIds.length) {
    await LocalNotifications.cancel({
      notifications: previousIds.map((id) => ({ id })),
    });
  }

  if (!(await hasNativeNotificationPermission())) {
    save(NATIVE_TODO_IDS_KEY, []);
    return;
  }

  const notifications = (todos || [])
    .map(buildNativeTodoReminder)
    .filter(Boolean);

  if (notifications.length) {
    await LocalNotifications.schedule({ notifications });
  }

  save(
    NATIVE_TODO_IDS_KEY,
    notifications.map((notification) => notification.id),
  );
}

async function clearNativeNotifications() {
  if (!isNativeApp()) return;

  const todoIds = load(NATIVE_TODO_IDS_KEY, []);
  const ids = [NATIVE_POMO_NOTIFICATION_ID, ...todoIds].filter(Boolean);
  if (!ids.length) return;

  await LocalNotifications.cancel({
    notifications: ids.map((id) => ({ id })),
  });
}
// put this once near the top of the file (after helpers/imports)
async function notify(title, options = {}) {
  try {
    if (isNativeApp()) {
      if (!(await hasNativeNotificationPermission())) return;
      await LocalNotifications.schedule({
        notifications: [
          {
            id:
              options.id ||
              hashNotificationId(
                `${options.tag || "focusflow"}:${title}:${Date.now()}`,
              ),
            title,
            body: options.body || "",
            schedule: { at: new Date(Date.now() + 250), allowWhileIdle: true },
          },
        ],
      });
      return;
    }
    if (!canNotify()) return;
    if (!secureOk()) return;
    if (Notification.permission !== "granted") return;
    new Notification(title, {
      // user-provided options first…
      ...options,

      // …but enforce safe defaults
      requireInteraction: true,
      renotify: true,
      tag: options.tag || "focusflow",
      silent: false,
      icon: options.icon ?? NOTIFICATION_THEME.icon,
      badge: options.badge ?? NOTIFICATION_THEME.badge,
      timestamp: Date.now(),
    });
  } catch (e) {
    console.warn("notify failed", e);
  }
}

function showPomodoroCompleteToast() {
  toast.custom(
    (t) => (
      <div
        className={[
          "pointer-events-auto w-[min(92vw,380px)] rounded-2xl border shadow-2xl",
          NOTIFICATION_THEME.shell,
          "backdrop-blur-xl transition-all duration-300",
          t.visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
        ].join(" ")}
      >
        <div className="flex items-start gap-3 p-4">
          <div
            className={[
              "mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl shadow-lg",
              NOTIFICATION_THEME.orb,
            ].join(" ")}
          >
            <span>{NOTIFICATION_THEME.orbSymbol}</span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold tracking-tight">
                Pomodoro complete
              </p>
              <span
                className={[
                  "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em]",
                  NOTIFICATION_THEME.kicker,
                ].join(" ")}
              >
                Break time
              </span>
            </div>

            <p
              className={["mt-1 text-sm", NOTIFICATION_THEME.subtext].join(" ")}
            >
              Take a short break.
            </p>
          </div>
        </div>
      </div>
    ),
    {
      duration: 4000,
      position: "top-right",
    },
  );
}

function showUndoToast(message, onUndo) {
  toast.custom(
    (toastItem) => (
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-100">
          {message}
        </span>
        <button
          type="button"
          onClick={() => {
            onUndo();
            toast.dismiss(toastItem.id);
          }}
          className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-violet-500"
        >
          Undo
        </button>
      </div>
    ),
    { duration: 6000 },
  );
}

function roundRectPath(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function wrapCanvasText(ctx, text, maxWidth) {
  const words = String(text).split(" ");
  const lines = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

async function createAchievementCardBlob({
  avatarSrc,
  profileName,
  doneToday,
  goal,
  sessionCount,
  topSessionName,
  habitsDoneToday,
  longestStreak,
}) {
  const width = 1080;
  const height = 1920;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas_failed");

  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, "#7C3AED");
  bg.addColorStop(0.5, "#2563EB");
  bg.addColorStop(1, "#22C55E");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  const blob1 = ctx.createRadialGradient(180, 240, 50, 180, 240, 360);
  blob1.addColorStop(0, "rgba(255,255,255,0.28)");
  blob1.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = blob1;
  ctx.fillRect(0, 0, width, height);

  const blob2 = ctx.createRadialGradient(870, 1540, 60, 870, 1540, 400);
  blob2.addColorStop(0, "rgba(253,224,71,0.24)");
  blob2.addColorStop(1, "rgba(253,224,71,0)");
  ctx.fillStyle = blob2;
  ctx.fillRect(0, 0, width, height);

  roundRectPath(ctx, 62, 62, width - 124, height - 124, 56);
  ctx.fillStyle = "rgba(255,255,255,0.10)";
  ctx.fill();

  roundRectPath(ctx, 82, 82, width - 164, height - 164, 50);
  ctx.fillStyle = "rgba(15, 23, 42, 0.16)";
  ctx.fill();

  const avatar = await loadImageElement(avatarSrc);
  ctx.save();
  ctx.beginPath();
  ctx.arc(168, 170, 62, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(avatar, 106, 108, 124, 124);
  ctx.restore();
  ctx.lineWidth = 8;
  ctx.strokeStyle = "rgba(255,255,255,0.88)";
  ctx.beginPath();
  ctx.arc(168, 170, 66, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.88)";
  ctx.font = "600 28px Avenir Next, Inter, sans-serif";
  ctx.fillText("FocusPlanner", 260, 150);
  ctx.font = '600 34px Georgia, "Times New Roman", serif';
  ctx.fillText(profileName || "achievement card", 260, 190);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "700 96px Avenir Next, Inter, sans-serif";
  ctx.fillText("Today's", 96, 370);
  ctx.fillText("little win ✨", 96, 470);

  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = "500 34px Avenir Next, Inter, sans-serif";
  ctx.fillText("showing up still counts", 100, 540);

  roundRectPath(ctx, 88, 612, width - 176, 310, 42);
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.fill();

  ctx.fillStyle = "#0F172A";
  ctx.font = "700 142px Avenir Next, Inter, sans-serif";
  ctx.fillText(`${doneToday}`, 126, 810);
  ctx.font = "700 46px Avenir Next, Inter, sans-serif";
  ctx.fillText("minutes of focus", 410, 796);
  ctx.font = "600 28px Avenir Next, Inter, sans-serif";
  ctx.fillStyle = "#475569";
  ctx.fillText(
    `${sessionCount} session${sessionCount === 1 ? "" : "s"} completed today`,
    132,
    862,
  );

  const progress = Math.min(doneToday / Math.max(goal, 1), 1);
  roundRectPath(ctx, 130, 940, width - 260, 30, 15);
  ctx.fillStyle = "rgba(15,23,42,0.10)";
  ctx.fill();
  roundRectPath(ctx, 130, 940, Math.max(30, (width - 260) * progress), 30, 15);
  const meter = ctx.createLinearGradient(130, 940, width - 130, 970);
  meter.addColorStop(0, "#A855F7");
  meter.addColorStop(0.5, "#EC4899");
  meter.addColorStop(1, "#F59E0B");
  ctx.fillStyle = meter;
  ctx.fill();

  ctx.fillStyle = "#334155";
  ctx.font = "600 30px Avenir Next, Inter, sans-serif";
  ctx.fillText(
    doneToday >= goal
      ? `goal crushed: ${doneToday}/${goal} min 🏆`
      : `progress check: ${doneToday}/${goal} min 💫`,
    132,
    1035,
  );

  roundRectPath(ctx, 88, 1095, width - 176, 570, 42);
  ctx.fillStyle = "rgba(8, 15, 32, 0.26)";
  ctx.fill();

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "700 30px Avenir Next, Inter, sans-serif";
  ctx.fillText("THE GOOD STUFF", 132, 1168);

  const chips = [
    topSessionName ? `main character task: ${topSessionName}` : null,
    habitsDoneToday.length
      ? `habits checked: ${habitsDoneToday
          .map((h) => h.name)
          .slice(0, 2)
          .join(" + ")} ✅`
      : null,
    longestStreak > 0
      ? `streak: ${longestStreak} day${longestStreak === 1 ? "" : "s"} 🔥`
      : null,
  ].filter(Boolean);

  const gradients = [
    ["#F472B6", "#EC4899"],
    ["#22C55E", "#14B8A6"],
    ["#F59E0B", "#F97316"],
  ];

  let chipY = 1230;
  chips.forEach((chip, idx) => {
    const [g1, g2] = gradients[idx % gradients.length];
    const chipGrad = ctx.createLinearGradient(
      132,
      chipY,
      width - 132,
      chipY + 84,
    );
    chipGrad.addColorStop(0, g1);
    chipGrad.addColorStop(1, g2);
    roundRectPath(ctx, 132, chipY, width - 264, 84, 26);
    ctx.fillStyle = chipGrad;
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "600 28px Avenir Next, Inter, sans-serif";
    const lines = wrapCanvasText(ctx, chip, width - 340);
    ctx.fillText(lines[0], 164, chipY + 51);
    chipY += 108;
  });

  ctx.fillStyle = "rgba(255,255,255,0.96)";
  ctx.font = "700 52px Avenir Next, Inter, sans-serif";
  ctx.fillText("proud of myself today  ♡", 132, 1594);

  ctx.fillStyle = "rgba(255,255,255,0.82)";
  ctx.font = "600 28px Avenir Next, Inter, sans-serif";
  ctx.fillText("#FocusPlanner   #productivevibes   #littlewins", 132, 1696);

  return await new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("blob_failed"));
        return;
      }
      resolve(blob);
    }, "image/png");
  });
}

/* ---------- Melodies (WebAudio) ---------- */
const NOTE_OFFSETS = {
  C: -9,
  "C#": -8,
  Db: -8,
  D: -7,
  "D#": -6,
  Eb: -6,
  E: -5,
  F: -4,
  "F#": -3,
  Gb: -3,
  G: -2,
  "G#": -1,
  Ab: -1,
  A: 0,
  "A#": 1,
  Bb: 1,
  B: 2,
};
function noteToFreq(name) {
  const m = String(name).match(/^([A-G](?:#|b)?)(-?\d)$/);
  if (!m) return null;
  const [, pitch, octStr] = m;
  const oct = parseInt(octStr, 10);
  const semis = (oct - 4) * 12 + NOTE_OFFSETS[pitch];
  return 440 * Math.pow(2, semis / 12);
}
const MELODIES = {
  victory: {
    label: "Victory",
    bpm: 140,
    type: "triangle",
    notes: [
      ["C5", 1],
      ["E5", 1],
      ["G5", 1],
      ["C6", 1.5],
      ["G5", 0.5],
      ["E5", 1],
      ["C5", 1],
    ],
  },
  chill: {
    label: "Chill",
    bpm: 96,
    type: "sine",
    notes: [
      ["G4", 1],
      ["B4", 1],
      ["D5", 1],
      ["G5", 1.5],
      [null, 0.5],
      ["D5", 1],
      ["B4", 1],
      ["G4", 1.5],
    ],
  },
  arcade: {
    label: "Arcade",
    bpm: 160,
    type: "square",
    notes: [
      ["E5", 0.5],
      [null, 0.25],
      ["G5", 0.5],
      ["B5", 0.5],
      ["E6", 0.75],
      ["D6", 0.25],
      ["C6", 0.75],
    ],
  },
  bells: {
    label: "Bells",
    bpm: 120,
    type: "sine",
    notes: [
      ["C5", 0.75],
      ["G5", 0.75],
      ["E5", 1],
      [null, 0.25],
      ["C6", 0.75],
    ],
  },
  sunrise: {
    label: "Sunrise",
    bpm: 110,
    type: "triangle",
    notes: [
      ["A4", 0.5],
      ["C5", 0.5],
      ["E5", 0.5],
      ["A5", 1],
      ["E5", 0.5],
      ["C5", 0.5],
      ["A4", 1],
    ],
  },
};

// ===== WebAudio core =====
let gAudioCtx = null;
function ensureAudioContext() {
  try {
    if (!gAudioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      gAudioCtx = new Ctx();
    }
    if (gAudioCtx.state === "suspended") gAudioCtx.resume();
    return gAudioCtx;
  } catch {
    return null;
  }
}

// ---- PRIME AUDIO (single “wake up” to allow sound later) ----
let gAudioPrimed = false;
function primeAudio() {
  const ctx = ensureAudioContext();
  if (!ctx || gAudioPrimed) return ctx;
  try {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    g.gain.value = 0.00001; // nearly silent
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.01);
  } catch {
    // Ignore browsers that block the priming tick.
  }
  gAudioPrimed = true;
  return ctx;
}

function playMelodyByName(ctx, name, vol = 0.9) {
  if (!ctx) return;
  const conf = MELODIES[name] || MELODIES.victory;
  const secPerBeat = 60 / conf.bpm;
  let t = ctx.currentTime;
  const g = ctx.createGain();
  g.gain.value = 0.0001;
  g.connect(ctx.destination);
  conf.notes.forEach(([n, beats]) => {
    const dur = Math.max(0.12, beats * secPerBeat);
    if (n) {
      const f = noteToFreq(n);
      if (f) {
        const o = ctx.createOscillator();
        o.type = conf.type || "triangle";
        o.frequency.setValueAtTime(f, t);
        o.connect(g);
        o.start(t);
        o.stop(t + dur);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.03, dur * 0.2));
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      }
    }
    t += dur;
  });
}
function playBeep(ctx, vol = 0.7) {
  // Two short beeps (audible but not annoying)
  const mk = (freq, startOffset, dur = 0.28) => {
    const t0 = ctx.currentTime + startOffset;
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(freq, t0);
    const g = ctx.createGain();
    g.gain.value = 0.0001;
    o.connect(g);
    g.connect(ctx.destination);
    o.start(t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.stop(t0 + dur + 0.02);
  };
  mk(880, 0.0);
  mk(1320, 0.35);
}

/* ===================== Storage bootstrap ===================== */
const LEGACY_SEED_MIGRATION_KEY = "ff.migration.cleanupLegacySeeds.v2";
const LEGACY_SEED_TODO_MATCHERS = ["ship portfolio", "english practice"];
const LEGACY_SEED_HABIT_MATCHERS = ["english", "code"];

const matchesLegacySeedTodo = (todo) => {
  const title = String(todo?.title || "")
    .trim()
    .toLowerCase();
  return LEGACY_SEED_TODO_MATCHERS.some((sample) => title.includes(sample));
};

const matchesLegacySeedHabit = (habit) => {
  const name = String(habit?.name || "")
    .trim()
    .toLowerCase();
  return LEGACY_SEED_HABIT_MATCHERS.includes(name);
};

const cleanupLegacySeedData = () => {
  if (localStorage.getItem(LEGACY_SEED_MIGRATION_KEY) === "1") return;

  const todos = load("ff.todos", []);
  const habits = load("ff.habits", []);

  const hasLegacyTodos = Array.isArray(todos)
    ? todos.some((t) => matchesLegacySeedTodo(t))
    : false;
  const hasLegacyHabits = Array.isArray(habits)
    ? habits.some((h) => matchesLegacySeedHabit(h))
    : false;

  if (hasLegacyTodos) {
    save(
      "ff.todos",
      todos.filter((t) => !matchesLegacySeedTodo(t)),
    );
  }

  if (hasLegacyHabits) {
    save(
      "ff.habits",
      habits.filter((h) => !matchesLegacySeedHabit(h)),
    );
  }

  localStorage.setItem(LEGACY_SEED_MIGRATION_KEY, "1");
};

const initIfEmpty = () => {
  if (!localStorage.getItem("ff.todos")) {
    save("ff.todos", []);
  }
  if (!localStorage.getItem("ff.habits")) {
    save("ff.habits", []);
  }
  if (!localStorage.getItem("ff.pomo")) {
    save("ff.pomo", { minutes: 25, sessions: 0, history: [] });
  }
  if (!localStorage.getItem("ff.goalMins")) {
    save("ff.goalMins", 60);
  }
};
initIfEmpty();
cleanupLegacySeedData();

/* ===================== App ===================== */
const DEFAULT_AVATAR_URL = PRESET_AVATARS[0].src;

const loadStoredText = (key, fallback = "") => {
  const stored = localStorage.getItem(key);
  if (!stored) return fallback;

  // Read both the current JSON format and values saved by earlier versions.
  try {
    const value = JSON.parse(stored);
    return typeof value === "string" ? value : fallback;
  } catch {
    return stored;
  }
};

const getSavedAvatar = () => loadStoredText(AVATAR_KEY, DEFAULT_AVATAR_URL);
const getSavedProfileName = () => loadStoredText(PROFILE_NAME_KEY, "");
/** @typedef {{ id: string, title: string, done: boolean, createdAt: number, doneAt?: number,
      priority?: 'low'|'med'|'high', due?: string, time?: string, remindMins?: number,
      estimateMins?: number, startedAt?: number|null }} Todo */
/** @typedef {{ id: string, name: string, streak: number, lastDone: string, mins: number,
      completedDays?: string[] }} Habit */

export default function FocusFlow() {
  const [themeTick, setThemeTick] = useState(0);
  const [pageTheme, setPageTheme] = useState(getPageThemeKey);
  const [avatarSrc, setAvatarSrc] = useState(getSavedAvatar);
  const [profileName, setProfileName] = useState(getSavedProfileName);
  const [onboardingDone, setOnboardingDone] = useState(
    () => localStorage.getItem(ONBOARDING_DONE_KEY) === "1",
  );
  const [showWelcome, setShowWelcome] = useState(
    () => localStorage.getItem(ONBOARDING_DONE_KEY) !== "1",
  );
  const [tourStepIndex, setTourStepIndex] = useState(-1);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const tasksRef = useRef(null);
  const pomoRef = useRef(null);
  const habitsRef = useRef(null);
  const goalRef = useRef(null);
  const headerRef = useRef(null);
  const pageThemeConfig = PAGE_THEMES[pageTheme] || PAGE_THEMES.midnight;
  const darkMode = isDark();
  const shellStyle = {
    backgroundColor: darkMode
      ? pageThemeConfig.darkFrom
      : pageThemeConfig.lightFrom,
    backgroundImage: `linear-gradient(to bottom, ${
      darkMode ? pageThemeConfig.darkFrom : pageThemeConfig.lightFrom
    }, ${darkMode ? pageThemeConfig.darkTo : pageThemeConfig.lightTo})`,
  };

  const glowStyleA = {
    background: `radial-gradient(circle, ${pageThemeConfig.glowA} 0%, transparent 68%)`,
  };
  const glowStyleB = {
    background: `radial-gradient(circle, ${pageThemeConfig.glowB} 0%, transparent 70%)`,
  };
  const glowStyleC = {
    background: `radial-gradient(circle, ${pageThemeConfig.glowC} 0%, transparent 72%)`,
  };

  // Enable AudioContext after the first user interaction (so later sounds work)
  useEffect(() => {
    const onPointer = () => primeAudio();
    const onKey = () => primeAudio();
    window.addEventListener("pointerdown", onPointer, { once: true });
    window.addEventListener("keydown", onKey, { once: true });
    return () => {
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    const onBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    const onInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      toast.success("FocusPlanner installed");
    };

    const standalone =
      window.matchMedia?.("(display-mode: standalone)")?.matches ||
      window.navigator.standalone === true;
    if (standalone) setIsInstalled(true);

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const installApp = useCallback(async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice?.outcome !== "accepted") {
      toast("Install dismissed");
    }
    setInstallPrompt(null);
  }, [installPrompt]);

  const markHabitDoneById = (id, minutes) => {
    if (!id) return;
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== id) return h;
        return completeHabit(h, {
          day: todayKey(),
          mins: minutes ?? h.mins,
          source: "pomodoro",
        });
      }),
    );
    setActiveHabitId(null); // скидаємо "активну" звичку після автопозначення
  };

  const markTodoDoneById = useCallback((id) => {
    if (!id) return;
    setTodos((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, done: true, doneAt: Date.now(), startedAt: null }
          : t,
      ),
    );
    setActiveTodoId((current) => (current === id ? null : current));
  }, []);

  // Todos (backfill extra fields)
  const [todos, setTodos] = useState(
    /** @type {Todo[]} */ (
      (load("ff.todos", []) || []).map((t) => ({
        ...t,
        priority: t.priority || "med",
        due: t.due || "",
        time: t.time || "",
        remindMins: typeof t.remindMins === "number" ? t.remindMins : 60,
        estimateMins:
          typeof t.estimateMins === "number" ? t.estimateMins : null,
        startedAt: typeof t.startedAt === "number" ? t.startedAt : null,
      }))
    ),
  );
  useEffect(() => save("ff.todos", todos), [todos]);

  // Habits (backfill mins)
  const [habits, setHabits] = useState(
    /** @type {Habit[]} */ (
      (load("ff.habits", []) || []).map((h) => ({
        ...normalizeHabit(h),
      }))
    ),
  );
  useEffect(() => save("ff.habits", habits), [habits]);

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationTick, setNotificationTick] = useState(Date.now());
  useEffect(() => {
    const intervalId = window.setInterval(
      () => setNotificationTick(Date.now()),
      30 * 1000,
    );
    return () => window.clearInterval(intervalId);
  }, []);

  const todayReminders = useMemo(() => {
    const now = notificationTick;
    const today = todayKey();

    return (todos ?? [])
      .filter((todo) => !todo.done && todo.due === today && todo.time)
      .map((todo) => {
        const dueAt = new Date(`${todo.due}T${todo.time}:00`).getTime();
        const reminderMinutes = Number(todo.remindMins) || 0;
        return {
          ...todo,
          dueAt,
          reminderAt: dueAt - reminderMinutes * 60 * 1000,
          isApproaching: now >= dueAt - reminderMinutes * 60 * 1000,
        };
      })
      .filter((todo) => Number.isFinite(todo.dueAt) && todo.dueAt >= now)
      .sort((a, b) => a.dueAt - b.dueAt);
  }, [notificationTick, todos]);

  // Pomodoro
  const [pomo, setPomo] = useState(
    load("ff.pomo", { minutes: 25, sessions: 0, history: [] }),
  );
  useEffect(() => save("ff.pomo", pomo), [pomo]);

  // Start from habit
  const [startSignal, setStartSignal] = useState(0);
  const [stopSignal, setStopSignal] = useState(0);
  const [currentTask, setCurrentTask] = useState("");
  const [activeHabitId, setActiveHabitId] = useState(null);
  const [activeTodoId, setActiveTodoId] = useState(null);
  // Start from habit
  const startHabit = async (habit) => {
    ensureAudioContext();
    await ensurePermission();
    const m = Math.max(5, Math.min(60, Number(habit.mins) || 15));
    setPomo({ ...pomo, minutes: m });
    setCurrentTask(`${habit.name} • ${m}m`);
    setActiveHabitId(habit.id); // ← позначаємо, що сесію запущено зі звички
    setActiveTodoId(null);
    setStartSignal((s) => s + 1);
  };

  // Start from task (use estimateMins if set)
  const startTask = async (todo) => {
    ensureAudioContext();
    await ensurePermission();
    const est = Number(todo.estimateMins);
    const m = Math.max(
      5,
      Math.min(60, Number.isFinite(est) && est > 0 ? est : pomo.minutes),
    );
    setPomo({ ...pomo, minutes: m });
    setTodos((prev) =>
      prev.map((t) =>
        t.id === todo.id ? { ...t, startedAt: t.startedAt || Date.now() } : t,
      ),
    );
    setCurrentTask(`${todo.title} • ${m}m`);
    setActiveHabitId(null); // ← сесію запущено НЕ зі звички
    setActiveTodoId(todo.id);
    setStartSignal((s) => s + 1);
  };

  const clearActiveSessionUi = useCallback(() => {
    setCurrentTask("");
    setActiveHabitId(null);
    setActiveTodoId(null);
  }, []);

  const stopActiveTask = useCallback(() => {
    clearActivePomodoro();
    cancelNativePomodoroNotification().catch((error) => {
      console.warn("native pomodoro notification cancel failed", error);
    });
    setStopSignal((signal) => signal + 1);
    clearActiveSessionUi();
  }, [clearActiveSessionUi]);

  useEffect(() => {
    const saved = loadActivePomodoro();
    if (!saved?.endAt || saved.endAt <= Date.now()) return;
    setCurrentTask(saved.taskLabel || "");
    setActiveHabitId(saved.habitId || null);
    setActiveTodoId(saved.todoId || null);
  }, []);

  const tourSteps = useMemo(
    () => [
      {
        key: "header",
        title: "Your workspace",
        description:
          "Use the header to move between pages, change the colour theme, update your avatar and name, or reset all app data to start fresh.",
        ref: headerRef,
      },
      {
        key: "tasks",
        title: "Tasks",
        description:
          "Add what you need to do, set a due time, reminder and estimate, then start a focus session from the task itself.",
        ref: tasksRef,
      },
      {
        key: "pomodoro",
        title: "Pomodoro",
        description:
          "Run a timed focus session here. Start, pause, reset, and adjust the session length whenever you need.",
        ref: pomoRef,
      },
      {
        key: "habits",
        title: "Habits & Streaks",
        description:
          "Build routines you want to repeat daily. Start a habit session or mark it done to keep your streak going.",
        ref: habitsRef,
      },
      {
        key: "goal",
        title: "Daily Goal",
        description:
          "Track your focused minutes and sessions. Use Share to preview a personal result card, then send it to friends or download it.",
        ref: goalRef,
      },
    ],
    [],
  );
  const tourActive = tourStepIndex >= 0;
  const currentTourStep = tourActive ? tourSteps[tourStepIndex] : null;
  const [tourPopoverPosition, setTourPopoverPosition] = useState(null);

  const completeOnboarding = useCallback(() => {
    localStorage.setItem(ONBOARDING_DONE_KEY, "1");
    setOnboardingDone(true);
    setShowWelcome(false);
    setTourStepIndex(-1);
  }, []);

  const startTour = useCallback(() => {
    setShowWelcome(false);
    setTourStepIndex(0);
  }, []);

  const restartTour = useCallback(() => {
    setCurrentPage("dashboard");
    setShowWelcome(false);
    setTourStepIndex(0);
  }, []);

  const nextTourStep = useCallback(() => {
    setTourStepIndex((prev) => {
      if (prev >= tourSteps.length - 1) {
        completeOnboarding();
        return -1;
      }
      return prev + 1;
    });
  }, [completeOnboarding, tourSteps.length]);

  const prevTourStep = useCallback(() => {
    setTourStepIndex((prev) => Math.max(0, prev - 1));
  }, []);

  useEffect(() => {
    if (!tourActive || !currentTourStep?.ref?.current) return;
    currentTourStep.ref.current.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [currentTourStep, tourActive]);

  useLayoutEffect(() => {
    if (!tourActive || !currentTourStep?.ref?.current) {
      setTourPopoverPosition(null);
      return undefined;
    }

    const updatePosition = () => {
      const rect = currentTourStep.ref.current.getBoundingClientRect();
      const margin = 16;
      const gap = 14;
      const width = Math.min(400, window.innerWidth - margin * 2);
      const estimatedHeight = currentTourStep.key === "goal" ? 270 : 215;
      const left = Math.max(
        margin,
        Math.min(rect.left + rect.width / 2 - width / 2, window.innerWidth - width - margin),
      );
      const belowTop = rect.bottom + gap;
      const top =
        belowTop + estimatedHeight <= window.innerHeight - margin
          ? belowTop
          : Math.max(margin, rect.top - estimatedHeight - gap);

      setTourPopoverPosition({ top: Math.round(top), left: Math.round(left), width });
    };

    const frame = requestAnimationFrame(updatePosition);
    window.addEventListener("resize", updatePosition);
    document.addEventListener("scroll", updatePosition, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updatePosition);
      document.removeEventListener("scroll", updatePosition, true);
    };
  }, [currentTourStep, tourActive]);

  // One-time "today tasks" summary (do NOT ask for permission here)
  useEffect(() => {
    if (!onboardingDone) return;
    const day = todayKey();
    const key = "ff.todoSummary@" + day;
    if (localStorage.getItem(key) === "1") return;

    const dueToday = (todos || []).filter((t) => !t.done && t.due === day);
    if (dueToday.length === 0) return;

    localStorage.setItem(key, "1");
    toast(
      `📅 ${dueToday.length} task(s) today: ${dueToday[0].title}${
        dueToday.length > 1 ? " +" + (dueToday.length - 1) : ""
      }`,
      { duration: 5000 },
    );

    if (canNotify() && Notification.permission === "granted") {
      notify("Today's tasks", {
        body: dueToday
          .slice(0, 5)
          .map((t) => "• " + t.title)
          .join("\n"),
        silent: true,
      });
    }
  }, [onboardingDone, todos, setTodos]);

  useEffect(() => {
    if (!isNativeApp()) return undefined;

    syncNativeTodoReminders(todos).catch((error) => {
      console.warn("native todo reminder sync failed", error);
    });
  }, [todos]);

  const resetApp = useCallback(async () => {
    try {
      await clearNativeNotifications();
    } catch (error) {
      console.warn("native notification reset cleanup failed", error);
    }

    localStorage.clear();
    initIfEmpty();
    window.location.reload();
  }, []);

  // === Task reminders / due-now alerts (even when tab is focused) ===
  useEffect(() => {
    if (!onboardingDone) return undefined;

    const REMINDER_KEY = (t) =>
      `ff.todoRem@${t.id}@${t.due}@${t.remindMins || 0}`;
    const DUE_NOW_KEY = (t) => `ff.todoDueNow@${t.id}@${t.due}@${t.time || ""}`;
    const DUE_NOW_GRACE_MIN = 5;

    // Fire a single reminder per task/date/reminder combination
    const fireReminder = (t) => {
      const key = REMINDER_KEY(t);
      if (localStorage.getItem(key) === "1") return;
      localStorage.setItem(key, "1");

      const mins = Number(t.remindMins) || 0;
      const label =
        mins >= 60 && mins % 60 === 0 ? `${mins / 60}h` : `${mins}m`;

      toast(`Reminder: ${t.title} in ${label}`, { duration: 5000 });

      if (canNotify() && Notification.permission === "granted") {
        notify("Task reminder", {
          body: `${t.title}${t.time ? ` at ${t.time}` : ""}`,
          silent: false,
          tag: `todo-${t.id}`,
        });
      }
    };

    const fireDueNow = (t) => {
      const key = DUE_NOW_KEY(t);
      if (localStorage.getItem(key) === "1") return;
      localStorage.setItem(key, "1");

      toast(`Time to start: ${t.title}`, {
        duration: 5000,
        icon: "⏰",
      });

      if (canNotify() && Notification.permission === "granted") {
        notify("Time to start", {
          body: `${t.title}${t.time ? ` • ${t.time}` : ""}`,
          silent: false,
          tag: `todo-due-now-${t.id}`,
        });
      }
    };

    // One-time UX tip if notifications are not enabled/unsupported
    const WARN_KEY = "ff.notifWarned";
    const notifGranted = canNotify() && Notification.permission === "granted";
    if (
      !isNativeApp() &&
      (!secureOk() || !notifGranted) &&
      localStorage.getItem(WARN_KEY) !== "1"
    ) {
      localStorage.setItem(WARN_KEY, "1");
      toast.error(
        canNotify()
          ? "Enable notifications (HTTPS or localhost) — click 'Enable notifications' above."
          : "This browser doesn't support Web Notifications.",
      );
    }

    // Poll tasks so reminders still fire if the tab stays open
    const check = () => {
      const now = Date.now();

      todos.forEach((t) => {
        if (!t || t.done || !t.due || !t.time) return;

        const dueMs = new Date(`${t.due}T${t.time}:00`).getTime();
        if (Number.isNaN(dueMs)) return;

        const dueNowEnd = dueMs + DUE_NOW_GRACE_MIN * 60 * 1000;
        if (now >= dueMs && now < dueNowEnd) fireDueNow(t);

        const remindMins = Number(t.remindMins) || 0;
        if (remindMins <= 0) return;

        const remindAt = dueMs - remindMins * 60 * 1000;
        if (now >= remindAt && now < dueMs) fireReminder(t);
      });
    };

    check();
    const id = setInterval(check, 10 * 1000);
    const onVis = () => check();
    const onFocus = () => check();
    const onBlur = () => check();

    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);
    };
  }, [onboardingDone, todos]);

  return (
    <div
      className="
      relative isolate flex min-h-dvh w-full overflow-x-hidden
      transition-colors duration-300
      text-slate-900 dark:text-slate-100
    "
      style={shellStyle}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -left-24 top-10 h-72 w-72 rounded-full blur-3xl"
          style={glowStyleA}
        />
        <div
          className="absolute right-0 top-1/3 h-80 w-80 rounded-full blur-3xl"
          style={glowStyleB}
        />
        <div
          className="absolute left-1/3 bottom-0 h-72 w-72 rounded-full blur-3xl"
          style={glowStyleC}
        />
      </div>

      {/* Main Content Area */}
      <div className="min-w-0 flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header
          ref={headerRef}
          className={`relative z-30 border-b border-slate-200/80 bg-white/75 px-4 backdrop-blur transition-shadow dark:border-slate-700/80 dark:bg-slate-950/75 sm:px-7 ${
            tourActive && currentTourStep?.key === "header"
              ? "z-50 ring-2 ring-sky-300/85 shadow-[0_0_0_9999px_rgba(15,23,42,0.18)]"
              : ""
          }`}
        >
          <div className="flex h-16 items-center gap-2 sm:gap-5">
            <button
              type="button"
              onClick={() => setCurrentPage("dashboard")}
              className="flex shrink-0 items-center gap-2.5 text-left"
              aria-label="Go to dashboard"
            >
              <img
                src={focusPlannerMark}
                alt="FocusPlanner"
                className="h-10 w-10 scale-[1.15] object-contain"
              />
              <span className="inline text-base font-bold tracking-tight sm:text-2xl">
                Focus<span className="text-violet-600 dark:text-violet-300">Planner</span>
              </span>
            </button>

            <nav className="hidden h-full items-stretch gap-1 md:flex" aria-label="Main navigation">
              {[
                ["dashboard", "Dashboard"],
                ["tasks", "Tasks"],
                ["pomodoro", "Focus"],
                ["habits", "Habits"],
                ["statistics", "Statistics"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setCurrentPage(id)}
                  className={`relative px-4 text-sm font-medium transition-colors ${
                    currentPage === id
                      ? "text-violet-600 dark:text-violet-300"
                      : "text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
                  }`}
                >
                  {label}
                  {currentPage === id && (
                    <span className="absolute inset-x-3 bottom-2 h-0.5 rounded-full bg-violet-500" />
                  )}
                </button>
              ))}
            </nav>

            <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
              <div className="relative hidden sm:block">
                <button
                  type="button"
                  onClick={async () => {
                    await ensurePermission();
                    setNotificationsOpen((open) => !open);
                  }}
                  className={`relative inline-flex h-9 w-9 items-center justify-center rounded-xl border transition hover:-translate-y-0.5 hover:shadow-md sm:h-11 sm:w-11 sm:rounded-2xl ${pageThemeConfig.secondaryButton}`}
                  title="Today's reminders"
                  aria-label="Today's reminders"
                  aria-expanded={notificationsOpen}
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                    <path d="M10 21h4" />
                  </svg>
                  {todayReminders.length > 0 && (
                    <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-violet-600 px-1 text-[10px] font-bold text-white">
                      {todayReminders.length}
                    </span>
                  )}
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 top-[calc(100%+10px)] z-[70] w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold">Today&apos;s reminders</p>
                      <button
                        type="button"
                        onClick={() => setNotificationsOpen(false)}
                        className="text-sm text-slate-400 transition hover:text-slate-700 dark:hover:text-slate-200"
                        aria-label="Close reminders"
                      >
                        ×
                      </button>
                    </div>
                    {todayReminders.length === 0 ? (
                      <p className="mt-4 rounded-xl bg-slate-50 px-3 py-4 text-center text-sm text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">
                        No tasks with a reminder today.
                      </p>
                    ) : (
                      <ul className="mt-3 space-y-2">
                        {todayReminders.map((todo) => (
                          <li
                            key={todo.id}
                            className="rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800/70"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="truncate text-sm font-medium">
                                {todo.title}
                              </span>
                              <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
                                {todo.time}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              {todo.isApproaching
                                ? "Reminder active"
                                : `Reminder at ${new Date(todo.reminderAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      "Clear all FocusPlanner data and restart the app? This cannot be undone.",
                    )
                  ) {
                    resetApp();
                  }
                }}
                className={`hidden h-9 w-9 items-center justify-center rounded-xl border transition hover:-translate-y-0.5 hover:shadow-md sm:inline-flex sm:h-11 sm:w-11 sm:rounded-2xl ${pageThemeConfig.secondaryButton}`}
                title="Reset all data"
                aria-label="Reset all data"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 11a8 8 0 1 0 2 5.2" />
                  <path d="M20 4v7h-7" />
                </svg>
              </button>
              <button
                onClick={() => {
                  const r = document.documentElement;
                  const next = r.classList.toggle("dark");
                  localStorage.setItem(THEME_KEY, next ? "dark" : "light");
                  setThemeTick((t) => t + 1);
                  primeAudio();
                }}
                className={`hidden h-9 w-9 items-center justify-center rounded-xl border transition hover:-translate-y-0.5 hover:shadow-md sm:inline-flex sm:h-11 sm:w-11 sm:rounded-2xl ${pageThemeConfig.secondaryButton}`}
                title="Toggle theme"
                aria-label="Toggle theme"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
                  <circle cx="12" cy="12" r="3.5" />
                  <path d="M12 2v2.5M12 19.5V22M4.93 4.93 6.7 6.7m10.6 10.6 1.77 1.77M2 12h2.5M19.5 12H22M4.93 19.07 6.7 17.3M17.3 6.7l1.77-1.77" />
                </svg>
              </button>
              <details className="static sm:hidden">
                <summary
                  className={`flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-xl border text-lg transition hover:shadow-md marker:content-none ${pageThemeConfig.secondaryButton}`}
                  aria-label="Open app controls"
                >
                  ⋯
                </summary>
                <div className="absolute right-3 top-[calc(100%+8px)] z-[80] w-64 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                  <div className="flex items-center justify-between gap-2 px-1 pb-2">
                    <span className="text-sm font-semibold">Quick controls</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {todayReminders.length} reminders
                    </span>
                  </div>
                  <div className="max-h-32 space-y-1 overflow-y-auto rounded-xl bg-slate-50 p-2 text-xs dark:bg-slate-800/70">
                    {todayReminders.length === 0 ? (
                      <p className="px-2 py-2 text-slate-500 dark:text-slate-400">No reminders for today.</p>
                    ) : (
                      todayReminders.map((todo) => (
                        <div key={todo.id} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5">
                          <span className="truncate font-medium">{todo.title}</span>
                          <span className="shrink-0 text-slate-500 dark:text-slate-400">{todo.time}</span>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="mt-3 grid gap-2 border-t border-slate-200 pt-3 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => {
                        const root = document.documentElement;
                        const next = root.classList.toggle("dark");
                        localStorage.setItem(THEME_KEY, next ? "dark" : "light");
                        setThemeTick((tick) => tick + 1);
                        primeAudio();
                      }}
                      className={`rounded-xl border px-3 py-2 text-left text-sm font-medium ${pageThemeConfig.secondaryButton}`}
                    >
                      ◐ Change theme
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm("Clear all FocusPlanner data and restart the app? This cannot be undone.")) resetApp();
                      }}
                      className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-left text-sm font-medium text-rose-600 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300"
                    >
                      ↻ Reset all data
                    </button>
                  </div>
                </div>
              </details>
              <AvatarPicker
                compact
                avatarSrc={avatarSrc}
                profileName={profileName}
                onChangeAvatar={setAvatarSrc}
                onChangeName={setProfileName}
                tourOpen={tourActive && currentTourStep?.key === "header"}
              />
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto pb-2 md:hidden" aria-label="Mobile navigation">
            {[
              ["dashboard", "Dashboard"],
              ["tasks", "Tasks"],
              ["pomodoro", "Focus"],
              ["habits", "Habits"],
              ["statistics", "Stats"],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setCurrentPage(id)}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  currentPage === id
                    ? "bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300"
                    : "text-slate-600 dark:text-slate-300"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </header>

        {/* Content Area */}
        <div className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-3 py-4 sm:px-6 sm:py-5">
          {currentPage === "dashboard" && (
          <div className="w-full min-w-0">
              <div className="mb-6">
                <h1 className="text-lg font-semibold tracking-tight sm:text-xl">
                  Welcome to FocusPlanner! 👋
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Let's plan your day and make it productive.
                </p>
              </div>
              <div className="grid gap-3 xl:grid-cols-12">
              {/* Tasks Section */}
              <SectionCard
                ref={tasksRef}
                highlight={tourActive && currentTourStep?.key === "tasks"}
                className="xl:col-span-6"
              >
                <h2 className="text-lg font-semibold mb-4">
                  Tasks (Mini-Kanban)
                </h2>
                <Board
                  todos={todos}
                  setTodos={setTodos}
                  onStartTask={startTask}
                  onStopTask={stopActiveTask}
                  activeTodoId={activeTodoId}
                />
              </SectionCard>

              {/* Pomodoro Section */}
              <SectionCard
                ref={pomoRef}
                highlight={tourActive && currentTourStep?.key === "pomodoro"}
                className="xl:col-span-6 sm:!p-3 md:!p-3 bg-[radial-gradient(ellipse_at_50%_62%,rgba(196,181,253,0.46)_0%,rgba(237,233,254,0.34)_48%,transparent_84%)] dark:bg-[radial-gradient(ellipse_at_50%_62%,rgba(124,58,237,0.38)_0%,rgba(49,46,129,0.22)_55%,transparent_84%)]"
              >
                <Pomodoro
                  pomo={pomo}
                  setPomo={setPomo}
                  externalStartSignal={startSignal}
                  externalStopSignal={stopSignal}
                  currentTask={currentTask}
                  activeHabitId={activeHabitId}
                  activeTodoId={activeTodoId}
                  onSessionClear={clearActiveSessionUi}
                  onHabitAutoDone={markHabitDoneById}
                  onTodoAutoDone={markTodoDoneById}
                />
              </SectionCard>

              {/* Habits Section */}
              <SectionCard
                ref={habitsRef}
                highlight={tourActive && currentTourStep?.key === "habits"}
                className="xl:col-span-6"
              >
                <Habits
                  habits={habits}
                  setHabits={setHabits}
                  onStartHabit={startHabit}
                  onStopHabit={stopActiveTask}
                  activeHabitId={activeHabitId}
                />
              </SectionCard>

              {/* Daily Goal Section */}
              <SectionCard
                ref={goalRef}
                highlight={tourActive && currentTourStep?.key === "goal"}
                className="xl:col-span-6"
              >
                <DailyGoal
                  pomo={pomo}
                  habits={habits}
                  avatarSrc={avatarSrc}
                  profileName={profileName}
                  tourPreviewOpen={tourActive && currentTourStep?.key === "goal"}
                />
              </SectionCard>

              {/* Weekly summary */}
              <div className="xl:col-span-12">
                <SectionCard>
                  <WeeklyChart
                    key={themeTick}
                    pomo={pomo}
                    todos={todos}
                    habits={habits}
                  />
                </SectionCard>
              </div>
              </div>
            </div>
          )}

          {currentPage === "tasks" && (
            <div>
              <Board
                todos={todos}
                setTodos={setTodos}
                onStartTask={startTask}
                onStopTask={stopActiveTask}
                activeTodoId={activeTodoId}
              />
            </div>
          )}

          {currentPage === "pomodoro" && (
            <div className="max-w-md">
              <Pomodoro
                pomo={pomo}
                setPomo={setPomo}
                externalStartSignal={startSignal}
                externalStopSignal={stopSignal}
                currentTask={currentTask}
                activeHabitId={activeHabitId}
                activeTodoId={activeTodoId}
                onSessionClear={clearActiveSessionUi}
                onHabitAutoDone={markHabitDoneById}
                onTodoAutoDone={markTodoDoneById}
              />
            </div>
          )}

          {currentPage === "habits" && (
            <div>
              <Habits
                habits={habits}
                setHabits={setHabits}
                onStartHabit={startHabit}
                onStopHabit={stopActiveTask}
                activeHabitId={activeHabitId}
              />
            </div>
          )}

          {currentPage === "statistics" && (
            <div className="grid gap-4 xl:grid-cols-12">
              <SectionCard className="xl:col-span-7">
                <WeeklyChart
                  key={themeTick}
                  pomo={pomo}
                  todos={todos}
                  habits={habits}
                />
              </SectionCard>
              <SectionCard className="xl:col-span-5">
                <DailyGoal
                  pomo={pomo}
                  habits={habits}
                  avatarSrc={avatarSrc}
                  profileName={profileName}
                />
              </SectionCard>
              <SectionCard className="xl:col-span-12">
                <WeeklyInsights pomo={pomo} todos={todos} habits={habits} />
              </SectionCard>
            </div>
          )}

          {currentPage === "settings" && (
            <div className="max-w-md space-y-4">
    <div className="space-y-2">
                <h3 className="font-semibold">App Settings</h3>
                <label className="flex items-center justify-between gap-3 text-sm">
                  <span>Color theme</span>
                  <select
                    value={pageTheme}
                    onChange={(e) => {
                      const next = e.target.value;
                      setPageTheme(next);
                      localStorage.setItem(PAGE_THEME_KEY, next);
                    }}
                    className="rounded-lg border bg-white px-2 py-1 dark:border-slate-700 dark:bg-slate-900"
                  >
                    {Object.entries(PAGE_THEMES).map(([key, cfg]) => (
                      <option key={key} value={key} className="text-slate-900">
                        {cfg.label}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  onClick={() => resetApp()}
                  className={`w-full px-4 py-2 rounded-lg text-sm ${pageThemeConfig.primaryButton}`}
                >
                  Reset App
                </button>
                <button
                  type="button"
                  onClick={restartTour}
                  className={`w-full rounded-lg border px-4 py-2 text-sm ${pageThemeConfig.secondaryButton}`}
                >
                  Replay app tour
                </button>
              </div>
              {!isNativeApp() && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Notifications</h3>
                  <button
                    onClick={async () => {
                      primeAudio();
                      const okSecure = secureOk();
                      if (!okSecure) {
                        toast.error("Notifications need HTTPS or localhost");
                        return;
                      }
                      const ok = await ensurePermission();
                      if (ok) {
                        notify("✅ Notifications enabled", {
                          body: "I'll alert you here.",
                          silent: false,
                        });
                        const ctx = ensureAudioContext();
                        if (ctx) playBeep(ctx, 0.9);
                        toast.success("Notifications enabled");
                      } else {
                        toast.error(
                          "Allow notifications in the browser settings",
                        );
                      }
                    }}
                    className={`w-full px-4 py-2 rounded-lg border text-sm ${pageThemeConfig.secondaryButton}`}
                  >
                    Enable Notifications
                  </button>
                </div>
              )}
              {!isInstalled && installPrompt && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Install</h3>
                  <button
                    onClick={installApp}
                    className={`w-full px-4 py-2 rounded-lg text-sm ${pageThemeConfig.primaryButton}`}
                  >
                    Install App
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Toaster */}
      <Toaster
        key={themeTick}
        position="top-right"
        toastOptions={{
          style: {
            background: isDark() ? "#0f172a" : "#ffffff",
            color: isDark() ? "#e2e8f0" : "#0f172a",
            border: `1px solid ${isDark() ? "#334155" : "#e2e8f0"}`,
          },
        }}
      />

      {showWelcome && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-[2px]">
          <div
            className={`w-full max-w-md rounded-3xl border border-slate-200/90 !bg-white p-6 shadow-2xl backdrop-blur-xl dark:border-slate-700/90 dark:!bg-slate-900 ${pageThemeConfig.card}`}
          >
            <p className="text-xs uppercase tracking-[0.22em] text-sky-400/90">
              Welcome
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">
              Meet FocusPlanner
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Manage tasks, focus sessions, habits and your daily goal in one
              place. I can quickly show you what each section is for.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={startTour}
                className={`rounded-xl px-4 py-2 text-sm ${pageThemeConfig.primaryButton}`}
              >
                Start tour
              </button>
              <button
                onClick={completeOnboarding}
                className={`rounded-xl border px-4 py-2 text-sm ${pageThemeConfig.secondaryButton}`}
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {tourActive && currentTourStep && (
        <>
          <div className="fixed inset-0 z-40 bg-slate-950/28 backdrop-blur-[1px]" />
          {createPortal(
          <div
            className="fixed z-[100] w-[calc(100vw-2rem)] max-w-md transition-[top,left] duration-200"
            style={
              tourPopoverPosition
                ? {
                    top: tourPopoverPosition.top,
                    left: tourPopoverPosition.left,
                    width: tourPopoverPosition.width,
                  }
                : { top: 16, left: 16 }
            }
          >
            <div
              className={`rounded-3xl border border-slate-200/90 !bg-white p-4 shadow-2xl backdrop-blur-xl dark:border-slate-700/90 dark:!bg-slate-900 md:p-5 ${pageThemeConfig.card}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-sky-400/90">
                    Step {tourStepIndex + 1} of {tourSteps.length}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold">
                    {currentTourStep.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {currentTourStep.description}
                  </p>
                </div>
                {tourStepIndex < tourSteps.length - 1 && (
                  <button
                    onClick={completeOnboarding}
                    className={`rounded-full border px-3 py-1 text-xs ${pageThemeConfig.secondaryButton}`}
                  >
                    Skip
                  </button>
                )}
              </div>
              <div className="mt-4 flex items-center justify-between gap-3">
                <button
                  onClick={prevTourStep}
                  disabled={tourStepIndex === 0}
                  className={`rounded-xl border px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50 ${pageThemeConfig.secondaryButton}`}
                >
                  Back
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={nextTourStep}
                    className={`rounded-xl px-4 py-2 text-sm ${pageThemeConfig.primaryButton}`}
                  >
                    {tourStepIndex === tourSteps.length - 1 ? "Finish" : "Next"}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
          )}
        </>
      )}
    </div>
  );
}

/* ======= Small UI helpers (Pill) ======= */
const PILL = {
  slate: "bg-slate-500/15 text-slate-300",
  sky: "bg-sky-500/15 text-sky-300",
  rose: "bg-rose-500/15 text-rose-300",
  emerald: "bg-emerald-500/15 text-emerald-300",
  amber: "bg-amber-500/15 text-amber-300",
  indigo: "bg-indigo-500/15 text-indigo-300",
  violet: "bg-violet-500/15 text-violet-300",
};
function Pill({ children, variant = "slate" }) {
  const cls = PILL[variant] || PILL.slate;
  return (
    <span className={`text-[11px] rounded-full px-2 py-0.5 ${cls}`}>
      {children}
    </span>
  );
}

/* Small clickable help tooltip */
function HelpTip({ label = "Help", symbol = "?", children }) {
  const [open, setOpen] = useState(false);
  const tipRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!tipRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <span ref={tipRef} className="relative inline-block">
      <button
        className="inline-flex items-center justify-center w-6 h-6 rounded-full border text-xs opacity-70 hover:opacity-100 transition
                   bg-white dark:bg-slate-900 dark:border-slate-700"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        title={label}
      >
        {symbol}
      </button>

      {open && (
        <div
          className="absolute z-50 mt-2 w-64 p-3 rounded-xl border shadow-lg
                     bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
        >
          <div className="text-xs leading-relaxed">{children}</div>
        </div>
      )}
    </span>
  );
}

function AvatarPicker({
  avatarSrc,
  profileName,
  onChangeAvatar,
  onChangeName,
  compact = false,
  tourOpen = false,
}) {
  const theme = uiTheme();
  const [open, setOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [draftName, setDraftName] = useState(profileName);

  useEffect(() => {
    if (open) setDraftName(profileName);
  }, [open, profileName]);

  useEffect(() => {
    setOpen(tourOpen);
  }, [tourOpen]);

  const applyAvatar = useCallback(
    (src) => {
      save(AVATAR_KEY, src);
      onChangeAvatar(src);
      setOpen(false);
    },
    [onChangeAvatar],
  );

  const onUpload = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const dataUrl = await fileToAvatarDataUrl(file);
        applyAvatar(dataUrl);
        toast.success("Avatar updated");
      } catch {
        toast.error("Couldn't load this image");
      } finally {
        e.target.value = "";
      }
    },
    [applyAvatar],
  );

  const saveName = useCallback(() => {
    const next = draftName.trim();
    if (next) {
      save(PROFILE_NAME_KEY, next);
      onChangeName(next);
      toast.success("Name updated");
    } else {
      localStorage.removeItem(PROFILE_NAME_KEY);
      onChangeName("");
      toast("Name cleared");
    }
  }, [draftName, onChangeName]);

  return (
    <div className={`relative shrink-0 ${open ? "z-[60]" : "z-20"}`}>
      {compact ? (
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex items-center gap-2 rounded-2xl border border-transparent py-1 pl-1 pr-2.5 transition hover:border-violet-100 hover:bg-violet-50/70 dark:hover:border-violet-900 dark:hover:bg-violet-950/30"
          aria-expanded={open}
          aria-label="Open profile settings"
        >
          <img
            src={avatarSrc}
            alt={profileName || "Profile"}
            className="h-10 w-10 rounded-xl border-2 border-white/80 object-cover shadow-md shadow-violet-500/15 sm:h-12 sm:w-12 sm:rounded-2xl dark:border-slate-700"
          />
          <span className="hidden max-w-28 text-left sm:block">
            <span className="block truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
              {profileName || "Your profile"}
            </span>
            <span className="block text-xs text-slate-500 dark:text-slate-400">
              Profile
            </span>
          </span>
          <span className="text-sm text-violet-600 dark:text-violet-300">⌄</span>
        </button>
      ) : (
        <div className="flex flex-col items-center">
          <div className="relative">
            <button
              onClick={() => setPreviewOpen(true)}
              className="group relative"
              aria-label="Open avatar preview"
              title="Open avatar preview"
            >
              <img
                src={avatarSrc}
                alt="Profile avatar"
                className="h-20 w-20 rounded-[1.75rem] object-cover border-2 border-white/70 shadow-lg shadow-slate-900/10 transition-transform group-hover:scale-[1.03] dark:border-slate-800"
              />
            </button>

            <button
              onClick={() => setOpen((value) => !value)}
              className={`absolute -bottom-1 -right-1 rounded-full px-2 py-1 text-[10px] font-medium shadow ${theme.primaryButton}`}
              aria-label="Change avatar"
              title="Change avatar"
            >
              Edit
            </button>
          </div>

          {profileName ? (
            <p className="profile-name mt-2 max-w-[144px] truncate text-center text-[1.05rem] italic text-slate-500/95 dark:text-slate-300/90">
              {profileName}
            </p>
          ) : null}
        </div>
      )}

      {previewOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
          <div className="relative">
            <button
              onClick={() => setPreviewOpen(false)}
              className={`absolute -right-3 -top-3 h-10 w-10 rounded-full border text-lg ${theme.secondaryButton}`}
              aria-label="Close avatar preview"
            >
              ×
            </button>
            <img
              src={avatarSrc}
              alt="Large avatar preview"
              className="h-56 w-56 rounded-[2rem] object-cover border-4 border-white/80 shadow-2xl shadow-black/35 sm:h-72 sm:w-72 dark:border-slate-800"
            />
          </div>
        </div>
      )}

      {open && (
        <div
          className={`absolute top-[calc(100%+12px)] z-[100] max-h-[min(78vh,640px)] w-[min(92vw,420px)] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl custom-scroll sm:p-5 dark:border-slate-700 dark:bg-slate-900 ${compact ? "right-0" : "left-0"}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-lg font-semibold">My Profile</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Choose a photo and name for your shared Daily Goal card.
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className={`h-8 w-8 rounded-xl border text-sm ${theme.secondaryButton}`}
              aria-label="Close avatar picker"
            >
              ×
            </button>
          </div>

          <div className="mt-5 flex flex-col gap-4 border-t border-slate-200/70 pt-5 sm:flex-row dark:border-slate-700/70">
            <label className="group relative shrink-0 cursor-pointer">
              <img
                src={avatarSrc}
                alt="Current profile avatar"
                className="h-20 w-20 rounded-3xl object-cover shadow-md"
              />
              <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-violet-600 text-sm text-white shadow-sm dark:border-slate-900">
                +
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={onUpload}
                className="hidden"
              />
            </label>
            <div className="min-w-0 flex-1">
              <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                Your name
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      saveName();
                    }
                  }}
                  placeholder="Your name"
                  maxLength={24}
                  className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white/90 px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-violet-400 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={saveName}
                  className={`rounded-xl border px-3 py-2 text-sm font-medium ${theme.primaryButton}`}
                >
                  Save
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                This name appears on your shared achievement card.
              </p>
            </div>
          </div>

          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              Profile photo
            </p>
            <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5 sm:gap-3">
            {PRESET_AVATARS.map((avatar) => {
              const active = avatar.src === avatarSrc;
              return (
                <button
                  key={avatar.id}
                  onClick={() => applyAvatar(avatar.src)}
                  className={`rounded-2xl border p-1.5 transition ${
                    active
                      ? "border-violet-400 ring-2 ring-violet-300/50"
                      : "border-transparent hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                  title={avatar.label}
                >
                  <img
                    src={avatar.src}
                    alt={avatar.label}
                    className="h-11 w-11 rounded-xl object-cover sm:h-12 sm:w-12"
                  />
                </button>
              );
            })}
            <label
              className="flex h-11 w-11 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-violet-300 text-violet-600 transition hover:bg-violet-50 sm:h-[60px] sm:w-[60px] sm:rounded-2xl dark:border-violet-700 dark:text-violet-300 dark:hover:bg-violet-950/30"
            >
              <span className="text-lg leading-none sm:text-2xl">+</span>
              <span className="mt-0.5 text-[8px] font-medium sm:mt-1 sm:text-[10px]">Upload</span>
              <input
                type="file"
                accept="image/*"
                onChange={onUpload}
                className="hidden"
              />
            </label>
            </div>
          </div>

          <div className="mt-5 border-t border-slate-200/70 pt-4 dark:border-slate-700/70">
            <button
              onClick={() => applyAvatar(PRESET_AVATARS[0].src)}
              className={`rounded-xl border px-3 py-2 text-xs font-medium ${theme.secondaryButton}`}
            >
              Reset avatar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===================== UI blocks ===================== */
const SectionCard = forwardRef(function SectionCard(
  { children, className = "", highlight = false },
  ref,
) {
  const MotionSection = motion.section;
  const theme = uiTheme();
  return (
    <MotionSection
      ref={ref}
      layout
      className={
        "relative w-full min-w-0 max-w-full overflow-hidden border rounded-xl md:rounded-2xl shadow-sm p-3 sm:p-4 md:p-5 backdrop-blur-sm " +
        theme.card +
        " transition-colors duration-300 " +
        (highlight
          ? "z-50 ring-2 ring-sky-300/85 shadow-[0_0_0_9999px_rgba(15,23,42,0.18)] "
          : "") +
        className
      }
    >
      {children}
    </MotionSection>
  );
});

function ActionIcon({ name }) {
  const className = "h-4 w-4";

  if (name === "play") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <path d="m8 5 11 7-11 7V5Z" fill="currentColor" />
      </svg>
    );
  }

  if (name === "stop") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <rect x="7" y="7" width="10" height="10" rx="1.5" fill="currentColor" />
      </svg>
    );
  }

  if (name === "edit") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v5M14 11v5" />
    </svg>
  );
}

/* ---------- Tasks board (DnD-ish, priorities, deadlines, search/filters) ---------- */
function Board({ todos, setTodos, onStartTask, onStopTask, activeTodoId }) {
  const theme = uiTheme();
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("med");
  const [due, setDue] = useState("");
  const [time, setTime] = useState("");
  const [remind, setRemind] = useState(60);
  const [estimate, setEstimate] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [view, setView] = useState("all");
  const [nowTick, setNowTick] = useState(Date.now());
  const [formOpen, setFormOpen] = useState(false);
  const taskInputRef = useRef(null);
  const taskEditorOpenRef = useRef(false);

  const resetTaskForm = () => {
    setText("");
    setPriority("med");
    setDue("");
    setTime("");
    setRemind(60);
    setEstimate("");
  };

  const openTaskForm = () => {
    setFormOpen(true);
  };

  const closeTaskForm = () => {
    resetTaskForm();
    setFormOpen(false);
  };

  useEffect(() => {
    if (formOpen) taskInputRef.current?.focus();
  }, [formOpen]);

  const isOverdue = (d) => d && d < todayKey();
  const isToday = (d) => d && d === todayKey();
  const DUE_NOW_GRACE_MIN = 5;
  const isDueNow = useCallback(
    (t) => {
      if (!t || !t.due || !t.time || t.done) return false;
      const dueMs = new Date(`${t.due}T${t.time}:00`).getTime();
      if (Number.isNaN(dueMs)) return false;
      const now = nowTick;
      return now >= dueMs && now < dueMs + DUE_NOW_GRACE_MIN * 60 * 1000;
    },
    [nowTick],
  );

  const isReminderActive = useCallback(
    (t) => {
      if (!t || !t.due || !t.time || t.done) return false;
      const remindMins = Number(t.remindMins) || 0;
      if (remindMins <= 0) return false;
      const dueMs = new Date(`${t.due}T${t.time}:00`).getTime();
      if (Number.isNaN(dueMs)) return false;
      const remindAt = dueMs - remindMins * 60 * 1000;
      return nowTick >= remindAt && nowTick < dueMs;
    },
    [nowTick],
  );

  const isDueToday = useCallback(
    (t) => !t?.done && t?.due === todayKey(),
    [],
  );

  // Missed: has date+time, they passed (with grace), not done and not started
  const GRACE_MIN = 5;
  const isMissed = useCallback(
    (t) => {
      if (!t || !t.due || !t.time) return false;
      if (t.done || t.startedAt) return false;
      const dueMs = new Date(`${t.due}T${t.time}:00`).getTime();
      return nowTick > dueMs + GRACE_MIN * 60 * 1000;
    },
    [nowTick],
  );

  useEffect(() => {
    const refresh = () => {
      if (!taskEditorOpenRef.current) setNowTick(Date.now());
    };
    const id = setInterval(refresh, 10 * 1000);
    const onFocus = () => refresh();
    const onVisibility = () => refresh();

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // Key to avoid boosting the same task multiple times
  const PRIO_KEY = (t) => `ff.boostHigh@${t.id}@${t.due || ""}@${t.time || ""}`;

  // Auto-boost priority for “Missed” tasks
  useEffect(() => {
    let changed = false;
    const updated = todos.map((t) => {
      if (!t || t.done) return t;
      if (!isMissed(t)) return t;
      if (t.priority === "high") return t;
      const k = PRIO_KEY(t);
      if (localStorage.getItem(k) === "1") return t;
      localStorage.setItem(k, "1");
      changed = true;
      toast("⚠️ Missed task - priority set to High", { duration: 2500 });
      return { ...t, priority: "high" };
    });
    if (changed) setTodos(updated);
  }, [isMissed, setTodos, todos]);

  const add = () => {
    if (!text.trim()) return;
    const t = {
      id: uid(),
      title: text.trim(),
      done: false,
      createdAt: Date.now(),
      priority,
      due,
      time,
      remindMins: Number(remind) || 0,
      estimateMins: estimate ? Number(estimate) : null,
      startedAt: null,
    };
    setTodos([t, ...todos]);
    resetTaskForm();
    setFormOpen(false);
    if (Number(remind) > 0) ensurePermission();
  };

  const remove = (id) => {
    const todo = todos.find((item) => item.id === id);
    if (!todo) return;
    if (!window.confirm(`Delete "${todo.title}"?`)) return;
    setTodos((current) => current.filter((item) => item.id !== id));
    showUndoToast("Task deleted", () => {
      setTodos((current) =>
        current.some((item) => item.id === todo.id) ? current : [todo, ...current],
      );
    });
  };
  const update = (id, patch) =>
    setTodos(todos.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  const rawTodo = todos.filter((t) => !t.done);
  const done = todos.filter((t) => t.done);

  const match = (t) => {
    const okPriority =
      priorityFilter === "all" || t.priority === priorityFilter;
    const okView =
      view === "all" ||
      view === "done" ||
      (view === "today" && isToday(t.due)) ||
      (view === "upcoming" && t.due && t.due > todayKey());
    return okPriority && okView;
  };

  const visibleItems = (view === "done" ? done : rawTodo)
    .slice()
    .sort((a, b) => {
      const adn = isDueNow(a),
        bdn = isDueNow(b);
      if (adn !== bdn) return adn ? -1 : 1;
      const arn = isReminderActive(a),
        brn = isReminderActive(b);
      if (arn !== brn) return arn ? -1 : 1;
      const am = isMissed(a),
        bm = isMissed(b);
      if (am !== bm) return am ? -1 : 1; // keep Missed on top
      const atd = isDueToday(a),
        btd = isDueToday(b);
      if (atd !== btd) return atd ? -1 : 1;
      const ao = isOverdue(a.due),
        bo = isOverdue(b.due);
      if (ao !== bo) return ao ? -1 : 1;
      const at = isToday(a.due),
        bt = isToday(b.due);
      if (at !== bt) return at ? -1 : 1;
      if (a.due && b.due && a.due !== b.due) return a.due < b.due ? -1 : 1;
      return b.createdAt - a.createdAt;
    })
    .filter(match);

  return (
    <div className="w-full min-w-0 max-w-full">
      <div>
        {/* The task composer stays out of the way until it is needed. */}
        <div className="mb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={openTaskForm}
                aria-expanded={formOpen}
                className={`h-9 rounded-xl px-4 text-sm font-medium ${POMODORO_ACTION_BUTTON}`}
              >
                + Add task
              </button>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className={`h-9 rounded-xl border px-3 text-sm ${theme.secondaryButton}`}
                title="Filter by priority"
              >
                <option value="all">All priorities</option>
                <option value="high">High priority</option>
                <option value="med">Medium priority</option>
                <option value="low">Low priority</option>
              </select>
            </div>
            <div className="flex w-full items-center gap-1 overflow-x-auto text-sm sm:w-auto">
              {[
                ["all", "All"],
                ["today", "Today"],
                ["upcoming", "Upcoming"],
                ["done", `Done (${done.length})`],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setView(key)}
                  className={`shrink-0 rounded-lg px-3 py-2 font-medium transition ${
                    view === key
                      ? "bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {formOpen && (
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl border border-violet-200 bg-violet-50/60 p-3 dark:border-violet-900/70 dark:bg-violet-950/20">
            <input
              ref={taskInputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") add();
                if (e.key === "Escape") closeTaskForm();
              }}
              placeholder="Add a task…"
              className="h-9 min-w-0 grow basis-full md:basis-[240px] rounded-xl border border-slate-200 bg-white text-slate-900 px-3
                 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-400"
            />

            {/* Priority — send to the end on mobile */}
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              title="Priority"
              className="order-10 md:order-none h-9 shrink-0 w-[88px] rounded-xl border px-3 bg-white dark:bg-slate-900 dark:border-slate-700"
            >
              <option value="high">High</option>
              <option value="med">Med</option>
              <option value="low">Low</option>
            </select>

            {/* Date */}
            <input
              type="date"
              value={due}
              onChange={(e) => setDue(e.target.value)}
              title="Due date"
              className="h-9 shrink-0 basis-[150px] rounded-xl border px-3 bg-white dark:bg-slate-900 dark:border-slate-700"
            />

            {/* Time */}
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              title="Time"
              className="h-9 shrink-0 basis-[110px] rounded-xl border px-3 bg-white dark:bg-slate-900 dark:border-slate-700"
            />

            <select
              value={estimate}
              onChange={(e) => setEstimate(e.target.value)}
              title="Task duration"
              aria-label="Task duration"
              className="h-9 shrink-0 basis-[132px] rounded-xl border px-3 bg-white dark:bg-slate-900 dark:border-slate-700"
            >
              <option value="">Duration</option>
              <option value="5">5 min</option>
              <option value="10">10 min</option>
              <option value="15">15 min</option>
              <option value="20">20 min</option>
              <option value="25">25 min</option>
              <option value="30">30 min</option>
              <option value="45">45 min</option>
              <option value="60">1 hour</option>
              <option value="90">1.5 hours</option>
              <option value="120">2 hours</option>
            </select>

            {/* Remind — a bit wider so “before” is fully visible */}
            <select
              value={remind}
              onChange={(e) => setRemind(parseInt(e.target.value))}
              title="Remind"
              className="h-9 shrink-0 basis-[132px] rounded-xl border px-3 bg-white dark:bg-slate-900 dark:border-slate-700"
            >
              <option value={0}>No alert</option>
              <option value={5}>5m before</option>
              <option value={15}>15m before</option>
              <option value={30}>30m before</option>
              <option value={60}>1h before</option>
              <option value={120}>2h before</option>
              <option value={1440}>1 day before</option>
            </select>

            <button
              onClick={add}
              className={`order-20 md:order-none h-9 shrink-0 px-3 rounded-xl w-full sm:w-auto ${POMODORO_ACTION_BUTTON}`}
            >
              Add task
            </button>
            <button
              type="button"
              onClick={closeTaskForm}
              className={`order-20 h-9 shrink-0 rounded-xl border px-3 text-sm ${theme.secondaryButton}`}
            >
              Cancel
            </button>
            </div>
          )}
        </div>

        {rawTodo.length === 0 && view !== "done" ? (
          <div className="flex min-h-[180px] w-full max-w-full flex-col items-center justify-center px-4 py-10 text-center sm:min-h-[260px] sm:py-16">
            <div className="text-5xl" aria-hidden="true">
              📋
            </div>
            <h3 className="mt-5 text-lg font-semibold text-slate-800 dark:text-slate-100">
              No tasks yet
            </h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Add your first task and get started!
            </p>
            <button
              type="button"
              onClick={openTaskForm}
              className="mt-6 rounded-xl border border-violet-200 bg-white px-4 py-2 text-sm font-medium text-violet-600 hover:bg-violet-50 dark:border-violet-800 dark:bg-slate-900 dark:text-violet-300 dark:hover:bg-violet-950/40"
            >
              + Add task
            </button>
          </div>
        ) : (
          <Column
            title=""
            items={visibleItems}
            onRemove={remove}
            onUpdate={update}
            isDueNow={isDueNow}
            isReminderActive={isReminderActive}
            isDueToday={isDueToday}
            isOverdue={isOverdue}
            isToday={isToday}
            isMissed={isMissed}
            onStartTask={onStartTask}
            onStopTask={onStopTask}
            activeTodoId={activeTodoId}
            taskEditorOpenRef={taskEditorOpenRef}
            scrollMax={300}
            showFade={false}
            emptyMessage={
              view === "done"
                ? "Completed tasks will show up here ✨"
                : "No tasks match your filters"
            }
          />
        )}
      </div>
    </div>
  );
}

function Column({
  title,
  items,
  onRemove,
  onUpdate,
  isDueNow,
  isReminderActive,
  isDueToday,
  isMissed,
  onStartTask,
  onStopTask,
  activeTodoId,
  taskEditorOpenRef,
  scrollMax = 180,
  showFade = true,
  emptyMessage = "Nothing here yet ✨",
}) {
  const MotionLi = motion.li;
  const theme = uiTheme();
  const Row = ({ item }) => {
    const [editing, setEditing] = useState(false);
    const [titleV, setTitleV] = useState(item.title);
    const [priorityV, setPriorityV] = useState(item.priority || "med");
    const [dueV, setDueV] = useState(item.due || "");
    const [timeV, setTimeV] = useState(item.time || "");
    const [remindV, setRemindV] = useState(
      typeof item.remindMins === "number" ? item.remindMins : 60,
    );
    const [estimateV, setEstimateV] = useState(
      typeof item.estimateMins === "number" ? item.estimateMins : "",
    );

    const inProgress = activeTodoId === item.id && !item.done;
    const dueNow = !inProgress && isDueNow(item);
    const reminderActive = !inProgress && isReminderActive(item);
    const dueToday = !inProgress && isDueToday(item);
    const missed = !inProgress && isMissed(item);
    const needsAttention = dueNow || reminderActive || dueToday;

    const save = () => {
      onUpdate?.(item.id, {
        title: titleV.trim() || item.title,
        priority: priorityV,
        due: dueV,
        time: timeV,
        remindMins: Number(remindV) || 0,
        estimateMins: estimateV ? Number(estimateV) : null,
      });
      taskEditorOpenRef.current = false;
      setEditing(false);
    };

    const priorityClass =
      item.priority === "high"
        ? "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300"
        : item.priority === "low"
          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300"
          : "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300";
    const dateLabel = item.due
      ? `${new Date(`${item.due}T00:00:00`).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        })}${item.time ? `, ${item.time}` : ""}`
      : "No date";
    const estimateLabel =
      Number.isFinite(Number(item.estimateMins)) && Number(item.estimateMins) > 0
        ? `${item.estimateMins} min`
        : null;

    return (
      <MotionLi
        className={
          "group relative rounded-xl border border-slate-200/90 bg-white/60 px-3 py-2.5 dark:border-slate-700/90 dark:bg-slate-900/40 " +
          "transition hover:border-violet-200 hover:bg-white dark:hover:border-violet-800 dark:hover:bg-slate-800/40 " +
          (inProgress
            ? "bg-violet-50/80 shadow-[inset_3px_0_0_rgb(124_58_237)] dark:bg-violet-950/25 "
            : "") +
          (dueNow
            ? "bg-amber-50/70 dark:bg-amber-950/20 "
            : "") +
          (needsAttention
            ? "border-amber-300 bg-amber-50/70 shadow-[inset_3px_0_0_rgb(245_158_11)] dark:border-amber-800 dark:bg-amber-950/20 "
            : "") +
          (missed
            ? "border-rose-300 bg-rose-50/70 shadow-[inset_3px_0_0_rgb(244_63_94)] dark:border-rose-800 dark:bg-rose-950/20 "
            : "")
        }
      >
        {!editing ? (
          <>
          <div className="grid w-full max-w-[710px] grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1 2xl:grid-cols-[minmax(180px,1fr)_60px_72px_minmax(150px,1fr)] 2xl:gap-2 2xl:pr-32">
            <span
              className={
                "truncate font-medium " +
                (item.done ? "line-through text-slate-400" : "")
              }
              title={item.title}
            >
              {item.title}
            </span>
            <span className={`justify-self-end rounded-full px-3 py-1 text-xs font-medium 2xl:justify-self-center ${priorityClass}`}>
              {item.priority === "high"
                ? "High"
                : item.priority === "low"
                  ? "Low"
                  : "Med"}
            </span>
            {inProgress ? (
              <span className="hidden justify-self-center rounded-full bg-violet-100 px-2 py-1 text-[10px] font-semibold text-violet-700 2xl:inline-flex dark:bg-violet-900/60 dark:text-violet-200">
                In focus
              </span>
            ) : missed ? (
              <span className="hidden justify-self-center rounded-full bg-rose-100 px-2 py-1 text-[10px] font-semibold text-rose-700 2xl:inline-flex dark:bg-rose-950/60 dark:text-rose-200">
                Overdue
              </span>
            ) : dueNow ? (
              <span className="hidden justify-self-center rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-700 2xl:inline-flex dark:bg-amber-950/60 dark:text-amber-200">
                Due now
              </span>
            ) : reminderActive ? (
              <span className="hidden justify-self-center rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-700 2xl:inline-flex dark:bg-amber-950/60 dark:text-amber-200">
                Due soon
              </span>
            ) : dueToday ? (
              <span className="hidden justify-self-center rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-700 2xl:inline-flex dark:bg-amber-950/60 dark:text-amber-200">
                Due today
              </span>
            ) : (
              <span aria-hidden="true" className="hidden 2xl:block" />
            )}
            <span className="col-span-2 inline-flex min-w-0 justify-self-start items-center gap-2 truncate text-sm font-medium text-slate-600 2xl:col-span-1 dark:text-slate-300">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 shrink-0"
              >
                <rect x="3.5" y="5.5" width="17" height="15" rx="2.5" />
                <path d="M7.5 3.5v4M16.5 3.5v4M3.5 10h17" />
              </svg>
              {dateLabel}
              {estimateLabel && (
                <>
                  <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">•</span>
                  <span>{estimateLabel}</span>
                </>
              )}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-end gap-3 2xl:absolute 2xl:right-3 2xl:top-1/2 2xl:mt-0 2xl:-translate-y-1/2">
            {!item.done && (
              <button
                onClick={() => {
                  if (inProgress) onStopTask?.();
                  else onStartTask?.(item);
                }}
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium ${
                  inProgress
                    ? "border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300 dark:hover:bg-rose-950"
                    : POMODORO_ACTION_BUTTON
                }`}
                title={inProgress ? "Stop active task" : "Start task"}
                aria-label={inProgress ? `Stop ${item.title}` : `Start ${item.title}`}
              >
                <ActionIcon name={inProgress ? "stop" : "play"} />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                taskEditorOpenRef.current = true;
                setEditing(true);
              }}
              className={`flex h-8 w-8 items-center justify-center rounded-lg border text-sm ${theme.secondaryButton}`}
              title="Edit task"
              aria-label={`Edit ${item.title}`}
            >
              <ActionIcon name="edit" />
            </button>
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50/50 text-sm text-rose-600 hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300 dark:hover:bg-rose-950/50"
              title="Delete task"
              aria-label={`Delete ${item.title}`}
            >
              <ActionIcon name="delete" />
            </button>
          </div>
          </>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={titleV}
              onChange={(e) => setTitleV(e.target.value)}
              className="h-9 min-w-0 flex-[1_1_220px] rounded-lg border px-3 bg-white dark:bg-slate-900 dark:border-slate-700"
            />

            <select
              value={priorityV}
              onChange={(e) => setPriorityV(e.target.value)}
              className="h-9 shrink-0 w-[92px] rounded-lg border px-3 bg-white dark:bg-slate-900 dark:border-slate-700"
            >
              <option value="high">High</option>
              <option value="med">Med</option>
              <option value="low">Low</option>
            </select>

            <input
              type="date"
              value={dueV}
              onChange={(e) => setDueV(e.target.value)}
              className="h-9 shrink-0 w-[150px] rounded-lg border px-3 bg-white dark:bg-slate-900 dark:border-slate-700"
            />

            <input
              type="time"
              value={timeV}
              onChange={(e) => setTimeV(e.target.value)}
              className="h-9 shrink-0 w-[110px] rounded-lg border px-3 bg-white dark:bg-slate-900 dark:border-slate-700"
            />

            <select
              value={estimateV}
              onChange={(e) => setEstimateV(e.target.value)}
              aria-label="Task duration"
              className="h-9 shrink-0 w-[132px] rounded-lg border px-3 bg-white dark:bg-slate-900 dark:border-slate-700"
            >
              <option value="">Duration</option>
              <option value="5">5 min</option>
              <option value="10">10 min</option>
              <option value="15">15 min</option>
              <option value="20">20 min</option>
              <option value="25">25 min</option>
              <option value="30">30 min</option>
              <option value="45">45 min</option>
              <option value="60">1 hour</option>
              <option value="90">1.5 hours</option>
              <option value="120">2 hours</option>
            </select>

            <select
              value={remindV}
              onChange={(e) => setRemindV(parseInt(e.target.value))}
              className="h-9 shrink-0 w-[110px] rounded-lg border px-3 bg-white dark:bg-slate-900 dark:border-slate-700"
            >
              <option value={0}>No alert</option>
              <option value={5}>5m</option>
              <option value={15}>15m</option>
              <option value={30}>30m</option>
              <option value={60}>1h</option>
              <option value={120}>2h</option>
              <option value={1440}>1 day</option>
            </select>

            <div className="ml-auto flex gap-2">
              <button
                onClick={save}
                className={`h-9 px-3 rounded-lg border ${theme.secondaryButton}`}
              >
                Save
              </button>
              <button
                onClick={() => {
                  taskEditorOpenRef.current = false;
                  setEditing(false);
                }}
                className={`h-9 px-3 rounded-lg border ${theme.secondaryButton}`}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </MotionLi>
    );
  };

  return (
    <div>
      {title && (
        <h3 className="font-medium text-slate-700 dark:text-slate-300 mb-2">
          {title}
        </h3>
      )}

      {/* Scroll container */}
      <div className="relative">
        <div
          className="overflow-y-auto pr-2 custom-scroll pb-4"
          style={{ maxHeight: `${scrollMax}px` }}
        >
          <ul className="space-y-2">
            {items.map((item) => (
              <Row key={item.id} item={item} />
            ))}
            {items.length === 0 && (
              <li className="text-sm text-slate-400 dark:text-slate-500">
                {emptyMessage}
              </li>
            )}
          </ul>
        </div>

        {showFade && (
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-5 bg-gradient-to-t from-slate-100/90 dark:from-slate-800/90 to-transparent rounded-b-xl" />
        )}
      </div>
    </div>
  );
}

/* ===================== Pomodoro ===================== */
/* ===================== Pomodoro ===================== */
function Pomodoro({
  pomo,
  setPomo,
  externalStartSignal,
  externalStopSignal,
  currentTask,
  activeHabitId,
  activeTodoId,
  onSessionClear,
  onHabitAutoDone,
  onTodoAutoDone,
}) {
  const theme = uiTheme();
  const [running, setRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(pomo.minutes * 60);
  const [sessionTaskLabel, setSessionTaskLabel] = useState("");
  const [sessionHabitId, setSessionHabitId] = useState(null);
  const [sessionTodoId, setSessionTodoId] = useState(null);
  const timerRef = useRef(0);
  const endTimeRef = useRef(null);
  const completedRef = useRef(false);
  // Prevent an old start signal from restarting a restored session on tab change.
  const handledStartSignalRef = useRef(externalStartSignal);
  const handledStopSignalRef = useRef(externalStopSignal);
  const latestStartContextRef = useRef({
    minutes: pomo.minutes,
    currentTask,
    activeHabitId,
    activeTodoId,
  });

  // Sound
  const [volume, setVolume] = useState(load("ff.soundVol", 0.9));
  useEffect(() => save("ff.soundVol", volume), [volume]);
  const [melody, setMelody] = useState(load("ff.melody", "victory"));
  useEffect(() => save("ff.melody", melody), [melody]);

  useEffect(() => {
    latestStartContextRef.current = {
      minutes: pomo.minutes,
      currentTask,
      activeHabitId,
      activeTodoId,
    };
  }, [activeHabitId, activeTodoId, currentTask, pomo.minutes]);

  const persistActiveSession = useCallback(
    ({ endAt, taskLabel, habitId, todoId, minutes }) => {
      saveActivePomodoro({
        endAt,
        taskLabel: taskLabel || "",
        habitId: habitId || null,
        todoId: todoId || null,
        minutes,
      });
      scheduleNativePomodoroNotification(endAt).catch((error) => {
        console.warn("native pomodoro notification schedule failed", error);
      });
    },
    [],
  );

  useEffect(() => {
    const saved = loadActivePomodoro();
    if (!saved?.endAt) return;

    completedRef.current = false;
    endTimeRef.current = saved.endAt;
    setSessionTaskLabel(saved.taskLabel || "");
    setSessionHabitId(saved.habitId || null);
    setSessionTodoId(saved.todoId || null);

    const next = Math.max(0, Math.ceil((saved.endAt - Date.now()) / 1000));
    setSecondsLeft(next);
    setRunning(true);
    scheduleNativePomodoroNotification(saved.endAt).catch((error) => {
      console.warn("native pomodoro notification restore failed", error);
    });
  }, []);

  useEffect(() => {
    if (
      !externalStartSignal ||
      externalStartSignal === handledStartSignalRef.current
    ) {
      return;
    }
    handledStartSignalRef.current = externalStartSignal;

    const {
      minutes,
      currentTask: taskLabel,
      activeHabitId: habitId,
      activeTodoId: todoId,
    } = latestStartContextRef.current;

    completedRef.current = false;
    endTimeRef.current = Date.now() + minutes * 60 * 1000;
    setSessionTaskLabel(taskLabel || "");
    setSessionHabitId(habitId || null);
    setSessionTodoId(todoId || null);
    persistActiveSession({
      endAt: endTimeRef.current,
      taskLabel: taskLabel || "",
      habitId: habitId || null,
      todoId: todoId || null,
      minutes,
    });
    setSecondsLeft(minutes * 60);
    setRunning(true);
  }, [externalStartSignal, persistActiveSession]);

  useEffect(() => {
    if (
      !externalStopSignal ||
      externalStopSignal === handledStopSignalRef.current
    ) {
      return;
    }
    handledStopSignalRef.current = externalStopSignal;
    completedRef.current = false;
    endTimeRef.current = null;
    clearActivePomodoro();
    cancelNativePomodoroNotification().catch((error) => {
      console.warn("native pomodoro notification cancel failed", error);
    });
    setSessionTaskLabel("");
    setSessionHabitId(null);
    setSessionTodoId(null);
    setRunning(false);
    setSecondsLeft(pomo.minutes * 60);
  }, [externalStopSignal, pomo.minutes]);

  useEffect(() => {
    if (!running) return;
    const syncRemaining = () => {
      if (!endTimeRef.current) return;
      const next = Math.max(
        0,
        Math.ceil((endTimeRef.current - Date.now()) / 1000),
      );
      setSecondsLeft(next);
    };

    syncRemaining();
    timerRef.current = setInterval(syncRemaining, 250);
    return () => clearInterval(timerRef.current);
  }, [running]);

  useEffect(() => {
    const syncOnVisibility = () => {
      if (!running || !endTimeRef.current) return;
      const next = Math.max(
        0,
        Math.ceil((endTimeRef.current - Date.now()) / 1000),
      );
      setSecondsLeft(next);
    };

    document.addEventListener("visibilitychange", syncOnVisibility);
    window.addEventListener("focus", syncOnVisibility);
    return () => {
      document.removeEventListener("visibilitychange", syncOnVisibility);
      window.removeEventListener("focus", syncOnVisibility);
    };
  }, [running]);

  const baseName = (label) => {
    const s = String(label || "")
      .split("•")[0]
      .trim();
    return s || "Pomodoro";
  };

  useEffect(() => {
    if (secondsLeft <= 0 && running && !completedRef.current) {
      completedRef.current = true;
      endTimeRef.current = null;
      clearActivePomodoro();
      cancelNativePomodoroNotification().catch((error) => {
        console.warn("native pomodoro notification cancel failed", error);
      });
      setRunning(false);
      setSecondsLeft(pomo.minutes * 60);

      const day = todayKey();
      const sessions = (pomo.sessions ?? 0) + 1;

      const entry = {
        day,
        mins: pomo.minutes,
        at: Date.now(),
        name: baseName(sessionTaskLabel || currentTask),
        habitId: sessionHabitId || null,
        todoId: sessionTodoId || null,
        sourceType: sessionHabitId
          ? "habit"
          : sessionTodoId
            ? "task"
            : "pomodoro",
      };
      const newHistory = [...(pomo.history ?? []), entry];
      setPomo({ ...pomo, sessions, history: newHistory });

      if (sessionHabitId && typeof onHabitAutoDone === "function") {
        onHabitAutoDone(sessionHabitId, pomo.minutes);
      }
      if (sessionTodoId && typeof onTodoAutoDone === "function") {
        onTodoAutoDone(sessionTodoId);
      }

      setSessionTaskLabel("");
      setSessionHabitId(null);
      setSessionTodoId(null);
      onSessionClear?.();

      playMelodyByName(ensureAudioContext(), melody, volume);
      if ("vibrate" in navigator) navigator.vibrate([200, 80, 200]);
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
      showPomodoroCompleteToast();
      notify("Pomodoro complete", {
        body: "Take a short break.",
        silent: true,
        tag: "focusflow-pomodoro-done",
      });

      if (sessions % 4 === 0)
        toast("Time for a longer break ☕️", { icon: "⏱️" });

      // Daily goal check
      const goal = load("ff.goalMins", 60);
      const todayTotal = sumTodayMinutes(newHistory);
      const hitKey = "ff.goalHit@" + day;
      if (todayTotal >= goal && localStorage.getItem(hitKey) !== "1") {
        localStorage.setItem(hitKey, "1");
        confetti({ particleCount: 180, spread: 80, origin: { y: 0.6 } });
        toast.success(`Daily goal reached: ${todayTotal} / ${goal} min 🏆`, {
          duration: 5000,
        });
        notify("Daily goal achieved 🏆", {
          body: `${todayTotal} / ${goal} minutes today`,
          silent: true,
        });
      }
    }
  }, [
    currentTask,
    melody,
    onSessionClear,
    onHabitAutoDone,
    onTodoAutoDone,
    pomo,
    running,
    secondsLeft,
    sessionHabitId,
    sessionTodoId,
    sessionTaskLabel,
    setPomo,
    volume,
  ]);

  const reset = useCallback(() => {
    completedRef.current = false;
    endTimeRef.current = null;
    clearActivePomodoro();
    cancelNativePomodoroNotification().catch((error) => {
      console.warn("native pomodoro notification cancel failed", error);
    });
    setSessionTaskLabel("");
    setSessionHabitId(null);
    setSessionTodoId(null);
    setRunning(false);
    setSecondsLeft(pomo.minutes * 60);
    onSessionClear?.();
  }, [onSessionClear, pomo.minutes]);
  const restart = useCallback(() => {
    completedRef.current = false;
    endTimeRef.current = null;
    clearActivePomodoro();
    cancelNativePomodoroNotification().catch((error) => {
      console.warn("native pomodoro notification cancel failed", error);
    });
    setSecondsLeft(pomo.minutes * 60);
    setRunning(false);
  }, [pomo.minutes]);
  const inc = (delta) => {
    const nextMinutes = Math.max(5, Math.min(60, pomo.minutes + delta));
    if (nextMinutes === pomo.minutes) return;

    setPomo({ ...pomo, minutes: nextMinutes });

    if (!running) {
      setSecondsLeft(nextMinutes * 60);
      return;
    }

    const nextSeconds = Math.max(
      0,
      secondsLeft + (nextMinutes - pomo.minutes) * 60,
    );
    endTimeRef.current = Date.now() + nextSeconds * 1000;
    setSecondsLeft(nextSeconds);
    persistActiveSession({
      endAt: endTimeRef.current,
      taskLabel: sessionTaskLabel || currentTask || "",
      habitId: sessionHabitId || activeHabitId || null,
      todoId: sessionTodoId || activeTodoId || null,
      minutes: nextMinutes,
    });
  };

  const mm = Math.floor(secondsLeft / 60)
    .toString()
    .padStart(2, "0");
  const ss = (secondsLeft % 60).toString().padStart(2, "0");
  const progress = Math.min(
    100,
    Math.max(
      0,
      ((pomo.minutes * 60 - secondsLeft) / (pomo.minutes * 60)) * 100,
    ),
  );
  const ringRadius = 106;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const startButtonRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      const target = e.target;
      const isEditing =
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

      // Keep Pomodoro shortcuts from stealing keystrokes while the user types.
      if (isEditing) return;

      if (e.code === "Space") {
        e.preventDefault();
        ensureAudioContext();
        ensurePermission();
        setRunning((prev) => {
          const next = !prev;
          if (next) {
            completedRef.current = false;
            endTimeRef.current = Date.now() + secondsLeft * 1000;
            persistActiveSession({
              endAt: endTimeRef.current,
              taskLabel: sessionTaskLabel || currentTask || "",
              habitId: sessionHabitId || activeHabitId || null,
              todoId: sessionTodoId || activeTodoId || null,
              minutes: Math.ceil(secondsLeft / 60),
            });
          } else {
            endTimeRef.current = null;
            clearActivePomodoro();
            cancelNativePomodoroNotification().catch((error) => {
              console.warn("native pomodoro notification cancel failed", error);
            });
          }
          return next;
        });
      }
      if (e.key.toLowerCase() === "r") reset();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    activeHabitId,
    activeTodoId,
    currentTask,
    persistActiveSession,
    reset,
    secondsLeft,
    sessionHabitId,
    sessionTodoId,
    sessionTaskLabel,
  ]);

  return (
    <div className="space-y-1 px-2 py-1 sm:px-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Pomodoro
        </h2>
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
          Session {pomo.sessions ?? 0}
        </span>
      </div>
      <div className="flex justify-center">
        <div className="relative h-[200px] w-[200px] sm:h-[252px] sm:w-[252px]">
          <svg
            className="h-full w-full -rotate-90 drop-shadow-[0_10px_20px_rgba(124,58,237,0.14)]"
            viewBox="0 0 236 236"
            aria-hidden="true"
          >
            <circle
              cx="118"
              cy="118"
              r={ringRadius}
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              strokeDasharray="2 7"
              className="text-violet-300 dark:text-violet-700"
            />
            <circle
              cx="118"
              cy="118"
              r={ringRadius}
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={ringCircumference}
              strokeDashoffset={ringCircumference * (1 - progress / 100)}
              className="text-violet-500 transition-[stroke-dashoffset] duration-300 dark:text-violet-300"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="rounded-md bg-violet-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-violet-600 dark:bg-violet-950/50 dark:text-violet-300">
              Focus time
            </span>
            <span className="mt-2 text-4xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-slate-100 sm:mt-3 sm:text-6xl">
              {mm}:{ss}
            </span>
            <button
              ref={startButtonRef}
              onClick={async () => {
                ensureAudioContext();
                await ensurePermission();
                setRunning((prev) => {
                  const next = !prev;
                  if (next) {
                    completedRef.current = false;
                    endTimeRef.current = Date.now() + secondsLeft * 1000;
                    persistActiveSession({
                      endAt: endTimeRef.current,
                      taskLabel: sessionTaskLabel || currentTask || "",
                      habitId: sessionHabitId || activeHabitId || null,
                      todoId: sessionTodoId || activeTodoId || null,
                      minutes: Math.ceil(secondsLeft / 60),
                    });
                  } else {
                    endTimeRef.current = null;
                    clearActivePomodoro();
                    cancelNativePomodoroNotification().catch((error) => {
                      console.warn(
                        "native pomodoro notification cancel failed",
                        error,
                      );
                    });
                  }
                  return next;
                });
              }}
              className="mt-3 min-w-28 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-[0_14px_30px_rgba(124,58,237,0.38)] transition hover:from-violet-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 dark:focus:ring-offset-slate-900 sm:mt-5"
            >
              {running ? "Ⅱ Pause" : "▶ Start"}
            </button>
          </div>
        </div>
      </div>
      <div
        className={`mx-auto flex h-8 max-w-[240px] items-center rounded-xl border border-violet-200/80 bg-violet-50/70 px-3 dark:border-violet-900/70 dark:bg-violet-950/30 ${
          sessionTaskLabel || currentTask ? "" : "invisible"
        }`}
        aria-hidden={!(sessionTaskLabel || currentTask)}
      >
          <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">
            <span className="font-normal text-slate-500 dark:text-slate-400">Working on: </span>
            {sessionTaskLabel || currentTask}
          </p>
      </div>

      <div className="mx-auto flex w-full max-w-md items-center justify-between gap-2 text-sm sm:gap-3">
        <button
          onClick={() => inc(-5)}
          className={`h-9 shrink-0 rounded-lg border px-3 text-xs font-medium ${theme.secondaryButton}`}
        >
          − 5 min
        </button>
        <span className="whitespace-nowrap text-xs font-medium text-slate-600 dark:text-slate-300">
          Length: {pomo.minutes} min
        </span>
        <button
          onClick={() => inc(5)}
          className={`h-9 shrink-0 rounded-lg border px-3 text-xs font-medium ${theme.secondaryButton}`}
        >
          + 5 min
        </button>
      </div>

      <div className="flex items-center justify-center gap-5 pt-1">
        <button
          type="button"
          onClick={restart}
          className="text-xs font-medium text-slate-500 transition hover:text-violet-600 dark:text-slate-400 dark:hover:text-violet-300"
          title="Restart the focus timer from the selected duration"
        >
          ↻ Restart
        </button>
        <details>
          <summary className="cursor-pointer text-xs font-medium text-slate-500 marker:content-none dark:text-slate-400">
            ⚙ Timer settings
          </summary>
        <div className="mt-3 space-y-3">
          {/* Volume */}
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Volume</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-40"
              style={{
                accentColor: isDark()
                  ? theme.rangeAccentDark
                  : theme.rangeAccent,
              }}
              aria-label="Win sound volume"
            />
            <span>{Math.round(volume * 100)}%</span>
          </div>

          {/* Melody */}
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Melody</span>
            <select
              value={melody}
              onChange={(e) => setMelody(e.target.value)}
              className="h-8 rounded-lg border px-2 bg-white dark:bg-slate-900 dark:border-slate-700"
              aria-label="Win melody"
            >
              {Object.entries(MELODIES).map(([key, cfg]) => (
                <option key={key} value={key}>
                  {cfg.label}
                </option>
              ))}
            </select>
            <button
              onClick={() =>
                playMelodyByName(ensureAudioContext(), melody, volume)
              }
              className={`h-8 rounded-lg border px-2 ${theme.secondaryButton}`}
            >
              Test
            </button>
          </div>
          </div>
        </details>
      </div>
    </div>
  );
}

/* ===================== Habits ===================== */
function Habits({
  habits,
  setHabits,
  onStartHabit,
  onStopHabit,
  activeHabitId,
}) {
  const theme = uiTheme();
  const [name, setName] = useState("");
  const [mins, setMins] = useState(15);
  const [formOpen, setFormOpen] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editMins, setEditMins] = useState(15);
  const habitInputRef = useRef(null);
  const focusHabitInput = () => setFormOpen(true);
  useEffect(() => {
    if (formOpen) habitInputRef.current?.focus();
  }, [formOpen]);

  const toggleDone = (id) => {
    const day = todayKey();
    setHabits(
      habits.map((h) => {
        if (h.id !== id) return h;

        const isToday = h.lastDone === day;

        if (isToday) {
          return uncompleteHabit(h, day);
        }

        return completeHabit(h, { day, mins: h.mins, source: "manual" });
      }),
    );
  };

  const remove = (id) => {
    const habit = habits.find((item) => item.id === id);
    if (!habit) return;
    if (!window.confirm(`Delete "${habit.name}"?`)) return;
    setHabits((current) => current.filter((item) => item.id !== id));
    showUndoToast("Habit deleted", () => {
      setHabits((current) =>
        current.some((item) => item.id === habit.id) ? current : [habit, ...current],
      );
    });
  };
  const startEdit = (habit) => {
    setEditingHabitId(habit.id);
    setEditName(habit.name);
    setEditMins(habit.mins);
  };
  const saveEdit = () => {
    if (!editName.trim()) return;
    const nextMins = Math.max(5, Math.min(60, Number(editMins) || 15));
    setHabits(
      habits.map((habit) =>
        habit.id === editingHabitId
          ? { ...habit, name: editName.trim(), mins: nextMins }
          : habit,
      ),
    );
    setEditingHabitId(null);
  };
  const todayColumn = (new Date().getDay() + 6) % 7;
  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - todayColumn);
  const completedToday = habits.filter((h) => h.lastDone === todayKey()).length;
  const habitIconStyles = [
    "bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300",
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
    "bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300",
    "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
  ];

  const add = () => {
    if (!name.trim()) return;
    const m = Math.max(5, Math.min(60, Number(mins) || 15));
    setHabits([
      {
        id: uid(),
        name: name.trim(),
        mins: m,
        streak: 0,
        lastDone: "",
        completedDays: [],
      },
      ...habits,
    ]);
    setName("");
    setMins(15);
    setFormOpen(false);
  };

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Habits &amp; Streaks
          </h2>
          {habits.length > 0 && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {habits.length} active {habits.length === 1 ? "habit" : "habits"}
              <span className="mx-2 text-slate-300 dark:text-slate-600">•</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                {completedToday} completed today
              </span>
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={focusHabitInput}
          className="rounded-xl bg-violet-50 px-3 py-2 text-sm font-medium text-violet-600 transition hover:bg-violet-100 hover:text-violet-700 dark:bg-violet-950/50 dark:text-violet-300 dark:hover:bg-violet-950"
        >
          + Add habit
        </button>
      </div>
      {/* Input row */}
      <div className={`mb-3 flex flex-wrap gap-2 ${formOpen ? "" : "hidden"}`}>
        <input
          ref={habitInputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Add a habit…"
          className="w-full rounded-xl border border-slate-200 bg-white text-slate-900 px-3 py-2
                     focus:outline-none focus:ring-2 focus:ring-slate-300
                     dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-400"
        />
        <select
          value={mins}
          onChange={(e) => setMins(Number(e.target.value))}
          className="rounded-xl border px-3 py-2 dark:bg-slate-900 dark:border-slate-700"
          title="Habit duration"
          aria-label="Habit duration"
        >
          <option value="5">5 min</option>
          <option value="10">10 min</option>
          <option value="15">15 min</option>
          <option value="20">20 min</option>
          <option value="25">25 min</option>
          <option value="30">30 min</option>
          <option value="45">45 min</option>
          <option value="60">1 hour</option>
        </select>
        <button
          className={`px-3 py-2 rounded-xl ${theme.primaryButton}`}
          onClick={add}
        >
          Add
        </button>
      </div>

      {habits.length > 0 && (
        <div className="mt-3 mb-2 ml-3 hidden w-full max-w-[710px] grid-cols-[minmax(240px,1fr)_68px_72px_repeat(7,26px)] items-center gap-2 text-xs font-semibold text-slate-400 2xl:grid dark:text-slate-500">
            <span />
            <span />
            <span />
            {"MTWTFSS".split("").map((day, index) => (
              <span key={`${day}-${index}`} className="text-center">
                {day}
              </span>
            ))}
        </div>
      )}

      {/* Scroll list */}
      <div
        className={`pr-2 overflow-y-auto custom-scroll ${habits.length > 4 ? "max-h-[340px] 2xl:max-h-[220px]" : ""}`}
      >
        <ul className={habits.length > 0 ? "space-y-1" : "space-y-2"}>
          {habits.map((h, habitIndex) => {
            const isDoneToday = h.lastDone === todayKey();
            const lastDoneDate = h.lastDone
              ? new Date(`${h.lastDone}T00:00:00`)
              : null;
            const lastDoneColumn =
              lastDoneDate && !Number.isNaN(lastDoneDate.getTime())
                ? Math.round((lastDoneDate.getTime() - weekStart.getTime()) / 86400000)
                : -1;
            const activeDays = Math.min(7, Math.max(1, h.streak || 0));
            const firstActiveDay = Math.max(0, lastDoneColumn - activeDays + 1);
            const habitIcon = inferTag(h.name)?.icon || "✦";
            return (
              <li
                key={h.id}
                className={`group relative rounded-xl border px-3 py-2.5 transition
                  ${
                    isDoneToday
                      ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-900/20"
                      : "border-slate-200/80 bg-white/60 hover:border-violet-200 dark:border-slate-700/80 dark:bg-slate-900/40 dark:hover:border-violet-800"
                  }`}
              >
                {editingHabitId === h.id ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      value={editName}
                      onChange={(event) => setEditName(event.target.value)}
                      onKeyDown={(event) => event.key === "Enter" && saveEdit()}
                      className="h-8 min-w-0 flex-1 rounded-lg border px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                      aria-label="Habit name"
                    />
                    <select
                      value={editMins}
                      onChange={(event) => setEditMins(event.target.value)}
                      className="h-8 rounded-lg border px-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                      aria-label="Habit duration"
                    >
                      <option value="5">5 min</option>
                      <option value="10">10 min</option>
                      <option value="15">15 min</option>
                      <option value="20">20 min</option>
                      <option value="25">25 min</option>
                      <option value="30">30 min</option>
                      <option value="45">45 min</option>
                      <option value="60">1 hour</option>
                    </select>
                    <button
                      type="button"
                      onClick={saveEdit}
                      className={`h-8 rounded-lg px-3 text-sm ${theme.primaryButton}`}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingHabitId(null)}
                      className={`h-8 rounded-lg border px-3 text-sm ${theme.secondaryButton}`}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="grid w-full max-w-[710px] grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1 2xl:grid-cols-[minmax(240px,1fr)_68px_72px_repeat(7,26px)] 2xl:gap-2 2xl:pr-0">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 font-medium">
                          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm ${habitIconStyles[habitIndex % habitIconStyles.length]}`}>
                            {habitIcon}
                          </span>
                          <span className="truncate">{h.name}</span>
                        </div>
                      </div>

                      <span className="inline-flex shrink-0 whitespace-nowrap items-center justify-center gap-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
                        {h.mins} min
                        <span className="text-emerald-500" aria-label="minutes">♨</span>
                      </span>
                      <span aria-hidden="true" className="hidden 2xl:block" />
                      {Array.from({ length: 7 }, (_, index) => {
                        const completed =
                          lastDoneColumn >= 0 &&
                          lastDoneColumn < 7 &&
                          index >= firstActiveDay &&
                          index <= lastDoneColumn;
                        const dotClass = `hidden 2xl:block mx-auto h-3 w-3 rounded-full border transition ${
                          completed
                            ? "border-emerald-400 bg-emerald-400"
                            : "border-slate-300 dark:border-slate-600"
                        }`;

                        return index === todayColumn ? (
                          <button
                            key={index}
                            type="button"
                            onClick={() => toggleDone(h.id)}
                            className={dotClass}
                            aria-label={`${isDoneToday ? "Mark" : "Mark"} ${h.name} done today`}
                            title={isDoneToday ? "Undo today" : "Mark done today"}
                          />
                        ) : (
                          <span key={index} className={dotClass} />
                        );
                      })}
                    </div>

                    <div className="mt-2 flex items-center justify-end gap-3 2xl:absolute 2xl:right-3 2xl:top-1/2 2xl:mt-0 2xl:-translate-y-1/2">
                      <button
                        type="button"
                        onClick={() => {
                          if (activeHabitId === h.id) onStopHabit?.();
                          else onStartHabit?.(h);
                        }}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium ${
                          activeHabitId === h.id
                            ? "border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300 dark:hover:bg-rose-950"
                            : POMODORO_ACTION_BUTTON
                        }`}
                      >
                        <ActionIcon
                          name={activeHabitId === h.id ? "stop" : "play"}
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => startEdit(h)}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg border text-sm ${theme.secondaryButton}`}
                        title="Edit habit"
                        aria-label={`Edit ${h.name}`}
                      >
                        <ActionIcon name="edit" />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(h.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50/50 text-sm text-rose-600 hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300 dark:hover:bg-rose-950/50"
                        title="Delete habit"
                        aria-label={`Delete ${h.name}`}
                      >
                        <ActionIcon name="delete" />
                      </button>
                    </div>
                  </>
                )}
              </li>
            );
          })}
          {habits.length === 0 && (
            <li className="flex w-full max-w-full flex-col items-center justify-center px-4 py-8 text-center">
              <div className="text-5xl" aria-hidden="true">
                🌱
              </div>
              <h3 className="mt-5 text-lg font-semibold text-slate-900 dark:text-slate-100">
                No habits yet
              </h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Build small habits and watch your progress grow.
              </p>
              <button
                type="button"
                onClick={focusHabitInput}
                className="mt-6 rounded-xl border border-violet-200 bg-white px-4 py-2 text-sm font-medium text-violet-600 hover:bg-violet-50 dark:border-violet-800 dark:bg-slate-900 dark:text-violet-300 dark:hover:bg-violet-950/40"
              >
                + Add habit
              </button>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

/* ===================== Tags helper for Daily Goal ===================== */
function inferTag(rawName) {
  const s = (rawName || "").toLowerCase();
  const CATS = [
    {
      keys: ["english", "англ"],
      label: "English",
      icon: "🇬🇧",
      cls: "bg-indigo-500/15 text-indigo-300",
    },
    {
      keys: ["read", "читан"],
      label: "Reading",
      icon: "📖",
      cls: "bg-amber-500/15 text-amber-300",
    },
    {
      keys: ["code", "coding", "програм", "js", "react"],
      label: "Code",
      icon: "💻",
      cls: "bg-emerald-500/15 text-emerald-300",
    },
    {
      keys: ["study", "learn", "навчан", "урок"],
      label: "Study",
      icon: "🎓",
      cls: "bg-sky-500/15 text-sky-300",
    },
    {
      keys: ["sport", "gym", "run", "yoga", "walk", "фіт", "спорт", "йога"],
      label: "Workout",
      icon: "🏃‍♀️",
      cls: "bg-rose-500/15 text-rose-300",
    },
    {
      keys: ["write", "пиш", "essay"],
      label: "Writing",
      icon: "✍️",
      cls: "bg-fuchsia-500/15 text-fuchsia-300",
    },
    {
      keys: ["music", "piano", "гит", "гіт", "спів"],
      label: "Music",
      icon: "🎵",
      cls: "bg-teal-500/15 text-teal-300",
    },
    {
      keys: ["cook", "кух", "готув"],
      label: "Cooking",
      icon: "🍳",
      cls: "bg-orange-500/15 text-orange-300",
    },
    {
      keys: ["clean", "приби", "cleaning"],
      label: "Cleaning",
      icon: "🧹",
      cls: "bg-slate-500/15 text-slate-300",
    },
  ];
  for (const c of CATS) if (c.keys.some((k) => s.includes(k))) return c;
  return null;
}

/* ===================== Daily Goal (timeline + badges) ===================== */
function DailyGoal({
  pomo,
  habits,
  avatarSrc,
  profileName,
  tourPreviewOpen = false,
}) {
  const theme = uiTheme();
  const [goal, setGoal] = useState(load("ff.goalMins", 60));
  const [shareOpen, setShareOpen] = useState(false);
  const [sharePreviewUrl, setSharePreviewUrl] = useState("");
  const [sharePreviewLoading, setSharePreviewLoading] = useState(false);
  const [expandedSessionId, setExpandedSessionId] = useState(null);
  useEffect(() => save("ff.goalMins", goal), [goal]);

  useEffect(() => {
    setShareOpen(tourPreviewOpen);
  }, [tourPreviewOpen]);

  const [view, setView] = useState("today"); // "today" | "yesterday" | "last7"

  const doneToday = sumTodayMinutes(pomo.history);
  const todaySessions = (pomo.history ?? []).filter(
    (e) => e.day === todayKey(),
  );
  const habitsDoneToday = useMemo(
    () => (habits ?? []).filter((h) => h.lastDone === todayKey()),
    [habits],
  );
  const longestStreak =
    (habits ?? []).reduce((max, h) => Math.max(max, h.streak || 0), 0) || 0;
  const topSessionName =
    todaySessions[0]?.name ||
    todaySessions[0]?.source ||
    (todaySessions[0]?.label
      ? String(todaySessions[0].label).split("•")[0].trim()
      : "");

  const createAchievementFile = useCallback(async () => {
    const blob = await createAchievementCardBlob({
      avatarSrc,
      profileName,
      doneToday,
      goal,
      sessionCount: todaySessions.length,
      topSessionName,
      habitsDoneToday,
      longestStreak,
    });
    return new File([blob], "focusflow-achievement.png", {
      type: "image/png",
    });
  }, [
    avatarSrc,
    profileName,
    doneToday,
    goal,
    habitsDoneToday,
    longestStreak,
    todaySessions.length,
    topSessionName,
  ]);

  useEffect(() => {
    if (!shareOpen) return undefined;

    let active = true;
    let previewUrl = "";
    setSharePreviewLoading(true);
    createAchievementFile()
      .then((file) => {
        if (!active) return;
        previewUrl = URL.createObjectURL(file);
        setSharePreviewUrl(previewUrl);
      })
      .catch(() => toast.error("Couldn't create the achievement card"))
      .finally(() => {
        if (active) setSharePreviewLoading(false);
      });

    return () => {
      active = false;
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setSharePreviewUrl("");
    };
  }, [createAchievementFile, shareOpen]);

  const downloadAchievementCard = useCallback(async () => {
    try {
      const file = await createAchievementFile();
      const url = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Achievement card downloaded");
    } catch {
      toast.error("Couldn't download the achievement card");
    }
  }, [createAchievementFile]);

  const shareAchievements = useCallback(async () => {
    try {
      const file = await createAchievementFile();

      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
        });
        return;
      }
      await downloadAchievementCard();
    } catch (err) {
      if (err?.name === "AbortError") return;
      toast.error("Couldn't share right now");
    }
  }, [createAchievementFile, downloadAchievementCard]);

  const sessions = useMemo(() => {
    const hist = pomo.history ?? [];
    const today = new Date();

    const localKey = (d) => {
      const off = d.getTimezoneOffset();
      return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
    };

    if (view === "today") {
      const k = localKey(today);
      return hist
        .filter((e) => e.day === k)
        .sort((a, b) => (b.at || 0) - (a.at || 0));
    }

    if (view === "yesterday") {
      const y = new Date(today);
      y.setDate(today.getDate() - 1);
      const k = localKey(y);
      return hist
        .filter((e) => e.day === k)
        .sort((a, b) => (b.at || 0) - (a.at || 0));
    }

    const start = new Date(today);
    start.setDate(today.getDate() - 6);
    return hist
      .filter((e) => {
        const d = new Date(e.day + "T00:00:00");
        return d >= start && d <= today;
      })
      .sort((a, b) => (b.at || 0) - (a.at || 0));
  }, [pomo.history, view]);

  const totalMins = sessions.reduce((s, e) => s + (e.mins || 0), 0);
  const displayMinutes = totalMins;
  const displayPct = Math.min(
    100,
    Math.round((displayMinutes / (goal || 1)) * 100),
  );
  const viewLabel =
    view === "today" ? "Today" : view === "yesterday" ? "Yesterday" : "Last 7 days";

  const fmtMeta = (e) => {
    const time = e.at
      ? new Date(e.at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";
    if (view === "last7") return `${e.day.slice(5)}${time ? " • " + time : ""}`;
    return time;
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Daily Goal</h2>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            className="text-sm font-semibold text-violet-600 transition hover:text-violet-500 dark:text-violet-300 dark:hover:text-violet-200"
          >
            ↗ Share
          </button>
          <details className="relative">
            <summary className="cursor-pointer list-none text-sm font-medium text-violet-600 marker:content-none dark:text-violet-300">
              {viewLabel} <span aria-hidden="true">⌄</span>
            </summary>
            <div className="absolute right-0 top-[calc(100%+8px)] z-30 w-32 rounded-xl border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
              {[
                ["today", "Today"],
                ["yesterday", "Yesterday"],
                ["last7", "Last 7 days"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={(event) => {
                    setView(value);
                    event.currentTarget.closest("details")?.removeAttribute("open");
                  }}
                  className={`w-full rounded-lg px-2 py-1.5 text-left text-xs transition ${
                    view === value
                      ? "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300"
                      : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </details>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <div className="relative h-24 w-24 shrink-0 sm:h-28 sm:w-28">
          <svg
            className="h-full w-full -rotate-90"
            viewBox="0 0 112 112"
            aria-hidden="true"
          >
            <circle
              cx="56"
              cy="56"
              r="46"
              fill="none"
              stroke="currentColor"
              strokeWidth="9"
              className="text-slate-200 dark:text-slate-700"
            />
            <circle
              cx="56"
              cy="56"
              r="46"
              fill="none"
              stroke="currentColor"
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 46}
              strokeDashoffset={2 * Math.PI * 46 * (1 - displayPct / 100)}
              className="text-violet-500 transition-[stroke-dashoffset] duration-300 dark:text-violet-300"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xl font-semibold sm:text-2xl">
            {displayPct}%
          </span>
        </div>

        <div className="flex min-w-0 flex-1 items-center divide-x divide-slate-200 text-sm 2xl:flex-none dark:divide-slate-700">
          <div className="min-w-0 pr-3 sm:pr-5">
            <p className="text-slate-500 dark:text-slate-400">
              <strong className="text-base text-slate-900 dark:text-slate-100">
                {displayMinutes}
              </strong>{" "}
              / {goal} min
            </p>
            <p className="mt-1 text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1">
                Focus time
                <HelpTip label="Focus time information" symbol="ⓘ">
                  The total minutes from completed Pomodoro sessions in the selected period.
                </HelpTip>
              </span>
            </p>
          </div>
          <div className="min-w-0 pl-3 sm:pl-5">
            <p className="text-slate-500 dark:text-slate-400">
              <strong className="text-base text-slate-900 dark:text-slate-100">
                {sessions.length}
              </strong>{" "}
              / 3
            </p>
            <p className="mt-1 text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1">
                Sessions
                <HelpTip label="Sessions information" symbol="ⓘ">
                  The number of completed Pomodoro sessions in the selected period.
                </HelpTip>
              </span>
            </p>
          </div>
        </div>
        <div className="basis-full rounded-xl bg-violet-50 px-3 py-2 text-center text-xs font-medium text-violet-600 sm:px-4 sm:py-3 sm:text-sm 2xl:ml-[170px] 2xl:basis-auto dark:bg-violet-950/35 dark:text-violet-300">
          {displayPct > 0
            ? "✦  Great progress! Keep going 💪"
            : "✦  Set a goal and start your first focus session!"}
        </div>
      </div>

      <details className="mt-2 text-xs text-slate-500 dark:text-slate-400">
        <summary className="cursor-pointer">Goal and history</summary>
        <div className="mt-3">
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span>Goal:</span>
            <input
              type="range"
              min="15"
              max="240"
              step="15"
              value={goal}
              onChange={(e) => setGoal(parseInt(e.target.value))}
              className="w-full max-w-[220px]"
              style={{
                accentColor: isDark()
                  ? theme.rangeAccentDark
                  : theme.rangeAccent,
              }}
            />
            <span>{goal}m</span>
          </div>
        </div>

        {/* Total and sharing */}
        <div className="shrink-0 text-right">
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Total: <span className="font-medium">{totalMins}m</span>
          </div>
          <button
            onClick={() => setShareOpen(true)}
            className={`mt-3 inline-flex items-center rounded-xl px-3 py-2 text-xs ${theme.primaryButton}`}
          >
            Share story card
          </button>
        </div>
      </details>

      {/* Timeline */}
      <div className="relative mt-2 h-36 shrink-0">
        <div className="absolute left-3 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700" />
        <div className="h-full pl-8 overflow-y-auto custom-scroll space-y-2">
          {sessions.length === 0 ? (
            <div className="text-sm text-slate-400 dark:text-slate-500">
              No sessions here - start one ⏱️
            </div>
          ) : (
            sessions.map((e, index) => {
              const name =
                e.name ||
                e.source ||
                (e.label ? String(e.label).split("•")[0].trim() : "") ||
                "Pomodoro";
              const sessionId = `${e.at || "session"}-${e.day}-${index}`;
              const expanded = expandedSessionId === sessionId;
              const tag = inferTag(name);
              const sourceBadge = {
                habit: { label: "Habit", icon: "♨", cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
                task: { label: "Task", icon: "✓", cls: "bg-sky-500/15 text-sky-700 dark:text-sky-300" },
                pomodoro: { label: "Focus", icon: "⏱", cls: "bg-violet-500/15 text-violet-700 dark:text-violet-300" },
              }[e.sourceType || (name === "Pomodoro" ? "pomodoro" : "task")];
              return (
                <div
                  key={sessionId}
                  className="relative rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 dark:bg-slate-900/60 dark:border-slate-700"
                >
                  <div className="absolute -left-4 top-2.5 h-2 w-2 rounded-full bg-sky-400 ring-4 ring-sky-400/15" />
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs ${sourceBadge.cls}`}
                      >
                        <span>{sourceBadge.icon}</span>
                        {sourceBadge.label}
                      </span>
                      {tag && (
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${tag.cls}`}
                        >
                          <span>{tag.icon}</span>
                          {tag.label}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedSessionId((current) =>
                            current === sessionId ? null : sessionId,
                          )
                        }
                        className={`min-w-0 flex-1 text-left text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-1 dark:focus:ring-offset-slate-900 ${
                          expanded
                            ? "whitespace-normal break-words"
                            : "truncate"
                        }`}
                        title={expanded ? "Hide full task name" : "Show full task name"}
                        aria-expanded={expanded}
                      >
                        {name}
                      </button>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {fmtMeta(e)}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-xs dark:bg-slate-700 dark:text-slate-200">
                        {e.mins}m
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {shareOpen &&
        createPortal(
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm">
            <div className="flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col overflow-y-auto rounded-3xl border border-white/30 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-bold">Share your win</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Your name and profile photo are included on the card.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShareOpen(false)}
                className={`h-9 w-9 shrink-0 rounded-xl border text-lg ${theme.secondaryButton}`}
                aria-label="Close sharing dialog"
              >
                ×
              </button>
            </div>

            <div className="mt-4 flex min-h-64 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 p-3 dark:bg-slate-800">
              {sharePreviewLoading ? (
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  Creating your card...
                </span>
              ) : sharePreviewUrl ? (
                <img
                  src={sharePreviewUrl}
                  alt="FocusPlanner achievement card preview"
                  className="max-h-[52vh] w-auto rounded-xl shadow-lg"
                />
              ) : (
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  Card preview unavailable.
                </span>
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={downloadAchievementCard}
                className={`rounded-xl border px-4 py-3 text-sm font-semibold ${theme.secondaryButton}`}
              >
                ⇩ Download PNG
              </button>
              <button
                type="button"
                onClick={shareAchievements}
                className={`rounded-xl px-4 py-3 text-sm font-semibold ${theme.primaryButton}`}
              >
                ↗ Send to friends
              </button>
            </div>
          </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

/* ===================== Weekly Insights ===================== */
function WeeklyInsights({ pomo, todos = [], habits = [] }) {
  const summary = useMemo(() => {
    const activity = buildWeeklyActivity({ pomo, todos, habits });
    return weeklySummary(activity, habits);
  }, [habits, pomo, todos]);

  const cards = [
    ["Focus time", `${summary.focusMinutes} min`, "◷"],
    ["Tasks completed", summary.completedTasks, "✓"],
    ["Habits completed", summary.completedHabits, "♨"],
    ["Best day", `${summary.bestDay.label} · ${summary.bestDay.mins} min`, "✦"],
    ["Longest streak", `${summary.longestStreak} days`, "↗"],
  ];

  return (
    <div>
      <h2 className="text-lg font-semibold tracking-tight">Week at a glance</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map(([label, value, icon]) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-900/60"
          >
            <span className="text-violet-600 dark:text-violet-300" aria-hidden="true">
              {icon}
            </span>
            <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              {label}
            </p>
            <p className="mt-1 text-xl font-bold tracking-tight">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===================== Weekly Chart ===================== */
function WeeklyChart({ pomo, todos = [], habits = [] }) {
  const data = useMemo(
    () => buildWeeklyActivity({ pomo, todos, habits }),
    [habits, pomo, todos],
  );
  const maxMinutes = Math.max(
    1,
    ...data.map((day) => day.mins),
  );
  const currentDay = todayKey();

  return (
    <div className="space-y-2">
      <h2 className="text-base font-semibold tracking-tight">This Week</h2>
      <div className="overflow-x-auto pb-1 custom-scroll">
      <div className="grid grid-cols-7 divide-x divide-slate-200/80 sm:min-w-[560px] dark:divide-slate-700/80">
          {data.map((day) => {
            const active = day.key === currentDay;
            const value = day.mins;
            const barHeight = Math.max(
              6,
              Math.round((value / maxMinutes) * 28),
            );
            return (
              <div
                key={day.key}
                className={`mx-0.5 flex min-w-0 flex-col items-center rounded-xl px-0.5 py-1.5 text-center sm:mx-1 sm:px-2 ${
                  active
                    ? "border border-violet-300 bg-[radial-gradient(ellipse_at_50%_62%,rgba(196,181,253,0.46)_0%,rgba(237,233,254,0.34)_48%,transparent_84%)] shadow-[0_12px_28px_rgba(124,58,237,0.16)] dark:border-violet-500/70 dark:bg-[radial-gradient(ellipse_at_50%_62%,rgba(124,58,237,0.38)_0%,rgba(49,46,129,0.22)_55%,transparent_84%)]"
                    : ""
                }`}
              >
                <span
                  className={`min-w-0 truncate text-[9px] font-medium sm:text-xs ${active ? "text-violet-700 dark:text-violet-300" : "text-slate-500 dark:text-slate-400"}`}
                >
                  {day.label} {day.date}
                </span>
                <span className="mt-1 whitespace-nowrap text-[9px] font-medium text-slate-700 sm:text-[11px] dark:text-slate-300">
                  {day.mins} min
                </span>
                <div className="mt-1 flex h-7 items-end justify-center">
                  <div
                    className="w-6 rounded-t-md bg-gradient-to-t from-violet-500 to-violet-300 transition-all dark:from-violet-500 dark:to-violet-300 sm:w-14"
                    style={{ height: `${barHeight}px` }}
                  />
                </div>
                <span className="mt-1 text-[9px] leading-tight text-slate-400 sm:text-[11px] dark:text-slate-500">
                  {day.tasks > 0 && (
                    <>{day.tasks} task{day.tasks === 1 ? "" : "s"}</>
                  )}
                  {day.tasks > 0 && day.habits > 0 && " · "}
                  {day.habits > 0 && (
                    <>{day.habits} habit{day.habits === 1 ? "" : "s"}</>
                  )}
                  {day.tasks === 0 && day.habits === 0 && "0 items"}
                </span>
              </div>
            );
          })}
      </div>
      </div>
    </div>
  );
}

function WeeklyOverview({ pomo, todos, onViewStatistics }) {
  const weekStart = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
    return date.getTime();
  }, []);

  const focusMinutes = useMemo(
    () =>
      (pomo.history ?? []).reduce((total, session) => {
        const sessionTime = new Date(`${session.day}T00:00:00`).getTime();
        return sessionTime >= weekStart ? total + (session.mins || 0) : total;
      }, 0),
    [pomo.history, weekStart],
  );
  const completedTasks = useMemo(
    () =>
      (todos ?? []).filter(
        (todo) => todo.done && (todo.doneAt || todo.createdAt || 0) >= weekStart,
      ).length,
    [todos, weekStart],
  );

  return (
    <div className="flex h-full flex-col">
      <h2 className="text-lg font-semibold tracking-tight">Overview</h2>
      <div className="mt-4 space-y-4">
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-950/60 dark:text-violet-300">◷</span>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Total focus time</p>
            <p className="text-xl font-bold">{focusMinutes} min</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-950/60 dark:text-violet-300">☑</span>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Tasks completed</p>
            <p className="text-xl font-bold">{completedTasks}</p>
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={onViewStatistics}
        className="mt-auto pt-5 text-left text-sm font-semibold text-violet-600 transition hover:text-violet-500 dark:text-violet-300"
      >
        View full statistics →
      </button>
    </div>
  );
}
