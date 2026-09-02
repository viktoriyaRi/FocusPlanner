import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion } from "framer-motion";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Toaster, toast } from "react-hot-toast";
import confetti from "canvas-confetti";

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

function showPomodoroCompleteToast({ task, minutes, sessions }) {
  const taskLabel = String(task || "Focus session").trim();

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

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span
                className={[
                  "rounded-full px-2.5 py-1",
                  NOTIFICATION_THEME.taskChip,
                ].join(" ")}
              >
                {taskLabel}
              </span>
              <span
                className={[
                  "rounded-full px-2.5 py-1",
                  NOTIFICATION_THEME.minutesChip,
                ].join(" ")}
              >
                {minutes} min
              </span>
              <span
                className={[
                  "rounded-full px-2.5 py-1",
                  NOTIFICATION_THEME.sessionChip,
                ].join(" ")}
              >
                Session {sessions}
              </span>
            </div>
          </div>

          <button
            onClick={() => toast.dismiss(t.id)}
            className={[
              "rounded-xl p-2 transition",
              NOTIFICATION_THEME.close,
            ].join(" ")}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      </div>
    ),
    { duration: 6000, position: "top-right" },
  );
}

function saveActivePomodoro(session) {
  localStorage.setItem(ACTIVE_POMO_KEY, JSON.stringify(session));
}

function loadActivePomodoro() {
  return load(ACTIVE_POMO_KEY, null);
}

function clearActivePomodoro() {
  localStorage.removeItem(ACTIVE_POMO_KEY);
}

function uiTheme() {
  return getPageThemeConfig();
}

function getSavedAvatar() {
  return localStorage.getItem(AVATAR_KEY) || PRESET_AVATARS[0].src;
}

function getSavedProfileName() {
  return localStorage.getItem(PROFILE_NAME_KEY) || "";
}

async function fileToAvatarDataUrl(file, size = 256) {
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("read_failed"));
    reader.readAsDataURL(file);
  });

  const img = await new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("image_failed"));
    image.src = dataUrl;
  });

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas_failed");

  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  const scale = Math.max(size / img.width, size / img.height);
  const drawW = img.width * scale;
  const drawH = img.height * scale;
  const dx = (size - drawW) / 2;
  const dy = (size - drawH) / 2;
  ctx.drawImage(img, dx, dy, drawW, drawH);
  ctx.restore();

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
  ctx.fillText("FocusFlow", 260, 150);
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
  ctx.fillText("#FocusFlow   #productivevibes   #littlewins", 132, 1696);

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
/** @typedef {{ id: string, title: string, done: boolean, createdAt: number,
      priority?: 'low'|'med'|'high', due?: string, time?: string, remindMins?: number,
      estimateMins?: number, startedAt?: number|null }} Todo */
/** @typedef {{ id: string, name: string, streak: number, lastDone: string, mins: number }} Habit */

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
  const tasksRef = useRef(null);
  const pomoRef = useRef(null);
  const habitsRef = useRef(null);
  const goalRef = useRef(null);
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
      toast.success("FocusFlow installed");
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

  const markHabitDoneById = (id) => {
    if (!id) return;
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== id) return h;
        const day = todayKey();
        const isNewDay = h.lastDone !== day;
        return {
          ...h,
          lastDone: day,
          streak: isNewDay ? h.streak + 1 : h.streak,
        };
      }),
    );
    setActiveHabitId(null); // скидаємо "активну" звичку після автопозначення
  };

  const markTodoDoneById = useCallback((id) => {
    if (!id) return;
    setTodos((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, done: true, startedAt: null } : t,
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
        ...h,
        mins: typeof h.mins === "number" ? h.mins : 15,
      }))
    ),
  );
  useEffect(() => save("ff.habits", habits), [habits]);

  // Pomodoro
  const [pomo, setPomo] = useState(
    load("ff.pomo", { minutes: 25, sessions: 0, history: [] }),
  );
  useEffect(() => save("ff.pomo", pomo), [pomo]);

  // Start from habit
  const [startSignal, setStartSignal] = useState(0);
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

  const tourSteps = useMemo(
    () => [
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
          "Track your focused minutes, see progress for today and share your win with a story card.",
        ref: goalRef,
      },
    ],
    [],
  );
  const tourActive = tourStepIndex >= 0;
  const currentTourStep = tourActive ? tourSteps[tourStepIndex] : null;

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

  const reopenGuide = useCallback(() => {
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
      relative isolate min-h-dvh w-full overflow-x-hidden
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

      {/* Header */}
      <header className="relative z-30 w-full max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-start sm:items-center justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            <AvatarPicker
              avatarSrc={avatarSrc}
              profileName={profileName}
              onChangeAvatar={setAvatarSrc}
              onChangeName={setProfileName}
            />

            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                FocusFlow
              </h1>
              <p className="text-sm leading-snug text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
                Tiny productivity app that combines a Pomodoro timer,
                mini-kanban tasks, and habits — with browser notifications and a
                daily goal.
              </p>
            </div>
          </div>

          {/* buttons wrap nicely on mobile */}
          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap overflow-x-visible">
            <label
              className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm shadow-sm backdrop-blur ${pageThemeConfig.selectShell}`}
            >
              <span className="text-slate-500 dark:text-slate-300">Color</span>
              <select
                value={pageTheme}
                onChange={(e) => {
                  const next = e.target.value;
                  setPageTheme(next);
                  localStorage.setItem(PAGE_THEME_KEY, next);
                }}
                className="bg-transparent outline-none"
                style={{
                  color: darkMode ? "#f8fafc" : undefined,
                }}
                title="Page color"
              >
                {Object.entries(PAGE_THEMES).map(([key, cfg]) => (
                  <option key={key} value={key} className="text-slate-900">
                    {cfg.label}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={() => {
                resetApp();
              }}
              className={`px-3 py-1.5 rounded-xl text-sm shadow-sm hover:shadow md:px-4 ${pageThemeConfig.primaryButton}`}
            >
              Reset
            </button>

            <button
              onClick={() => {
                const r = document.documentElement;
                const next = r.classList.toggle("dark");
                localStorage.setItem(THEME_KEY, next ? "dark" : "light");
                setThemeTick((t) => t + 1);
                primeAudio();
              }}
              className={`px-3 py-1.5 rounded-xl ${pageThemeConfig.primaryButton}`}
            >
              Toggle theme
            </button>

            <button
              onClick={reopenGuide}
              className={`px-3 py-1.5 rounded-xl border text-sm shadow-sm hover:shadow ${pageThemeConfig.secondaryButton}`}
            >
              Guide
            </button>

            {!isNativeApp() && (
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
                    toast.error("Allow notifications in the browser settings");
                  }
                }}
                className={`px-3 py-1.5 rounded-xl border text-sm shadow-sm hover:shadow ${pageThemeConfig.secondaryButton}`}
              >
                Enable notifications
              </button>
            )}

            {!isInstalled && installPrompt && (
              <button
                onClick={installApp}
                className={`px-3 py-1.5 rounded-xl text-sm shadow-sm hover:shadow ${pageThemeConfig.primaryButton}`}
              >
                Install app
              </button>
            )}
          </div>
        </div>
      </header>

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
            className={`w-full max-w-md rounded-3xl border p-6 shadow-2xl ${pageThemeConfig.card}`}
          >
            <p className="text-xs uppercase tracking-[0.22em] text-sky-400/90">
              Welcome
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">
              Meet FocusFlow
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
          <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-xl">
            <div
              className={`rounded-3xl border p-4 shadow-2xl md:p-5 ${pageThemeConfig.card}`}
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
                <button
                  onClick={completeOnboarding}
                  className={`rounded-full border px-3 py-1 text-xs ${pageThemeConfig.secondaryButton}`}
                >
                  Skip
                </button>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3">
                <button
                  onClick={prevTourStep}
                  disabled={tourStepIndex === 0}
                  className={`rounded-xl border px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50 ${pageThemeConfig.secondaryButton}`}
                >
                  Back
                </button>
                <button
                  onClick={nextTourStep}
                  className={`rounded-xl px-4 py-2 text-sm ${pageThemeConfig.primaryButton}`}
                >
                  {tourStepIndex === tourSteps.length - 1 ? "Finish" : "Next"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Main grid */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-4 pb-12 grid gap-6 md:grid-cols-2 xl:grid-cols-12">
        {/* Tasks */}
        <SectionCard
          ref={tasksRef}
          highlight={tourActive && currentTourStep?.key === "tasks"}
          className="xl:col-span-8"
        >
          <h2 className="text-lg font-semibold mb-4">Tasks (Mini-Kanban)</h2>
          <Board
            todos={todos}
            setTodos={setTodos}
            onStartTask={startTask}
            activeTodoId={activeTodoId}
          />
        </SectionCard>

        {/* Pomodoro */}
        <SectionCard
          ref={pomoRef}
          highlight={tourActive && currentTourStep?.key === "pomodoro"}
          className="xl:col-span-4"
        >
          <h2 className="text-lg font-semibold mb-4">Pomodoro</h2>
          <Pomodoro
            pomo={pomo}
            setPomo={setPomo}
            externalStartSignal={startSignal}
            currentTask={currentTask}
            activeHabitId={activeHabitId}
            activeTodoId={activeTodoId}
            onSessionClear={clearActiveSessionUi}
            onHabitAutoDone={markHabitDoneById}
            onTodoAutoDone={markTodoDoneById}
          />
        </SectionCard>

        {/* Habits */}
        <SectionCard
          ref={habitsRef}
          highlight={tourActive && currentTourStep?.key === "habits"}
          className="xl:col-span-4"
        >
          <h2 className="text-lg font-semibold mb-4">Habits & Streaks</h2>
          <Habits
            habits={habits}
            setHabits={setHabits}
            onStartHabit={startHabit}
          />
        </SectionCard>

        {/* Daily Goal */}
        <SectionCard
          ref={goalRef}
          highlight={tourActive && currentTourStep?.key === "goal"}
          className="xl:col-span-8"
        >
          <DailyGoal
            pomo={pomo}
            habits={habits}
            avatarSrc={avatarSrc}
            profileName={profileName}
          />
        </SectionCard>

        {/* Weekly chart */}
        <SectionCard className="xl:col-span-12">
          <h2 className="text-lg font-semibold mb-4">This Week</h2>
          <WeeklyChart key={themeTick} pomo={pomo} />
        </SectionCard>
      </main>
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
function HelpTip({ label = "Help", children }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-block">
      <button
        className="inline-flex items-center justify-center w-6 h-6 rounded-full border text-xs opacity-70 hover:opacity-100 transition
                   bg-white dark:bg-slate-900 dark:border-slate-700"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        title={label}
      >
        ?
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
}) {
  const theme = uiTheme();
  const [open, setOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [draftName, setDraftName] = useState(profileName);

  useEffect(() => {
    if (open) setDraftName(profileName);
  }, [open, profileName]);

  const applyAvatar = useCallback(
    (src) => {
      localStorage.setItem(AVATAR_KEY, src);
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
      localStorage.setItem(PROFILE_NAME_KEY, next);
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
            onClick={() => setOpen((v) => !v)}
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
          className={`absolute left-0 top-[calc(100%+12px)] z-[70] max-h-[min(78vh,640px)] w-[min(92vw,320px)] overflow-y-auto rounded-3xl border p-4 shadow-2xl backdrop-blur custom-scroll ${theme.card}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Choose avatar</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Pick a portrait avatar or upload your own photo.
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

          <div className="mt-4 border-t border-slate-200/70 pt-4 dark:border-slate-700/70">
            <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Display name
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
                className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-700 outline-none ring-0 transition placeholder:text-slate-400 focus:border-sky-400 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={saveName}
                className={`rounded-2xl border px-3 py-2 text-sm ${theme.primaryButton}`}
              >
                Save
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            {PRESET_AVATARS.map((avatar) => {
              const active = avatar.src === avatarSrc;
              return (
                <button
                  key={avatar.id}
                  onClick={() => applyAvatar(avatar.src)}
                  className={`rounded-2xl border p-2 transition ${
                    active
                      ? "border-sky-400 ring-2 ring-sky-300/50"
                      : "border-transparent hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                  title={avatar.label}
                >
                  <img
                    src={avatar.src}
                    alt={avatar.label}
                    className="h-16 w-16 rounded-2xl object-cover"
                  />
                  <span className="mt-1 block text-[11px] text-slate-500 dark:text-slate-400">
                    {avatar.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <label
              className={`cursor-pointer rounded-2xl border px-3 py-2 text-sm ${theme.primaryButton}`}
            >
              Upload photo
              <input
                type="file"
                accept="image/*"
                onChange={onUpload}
                className="hidden"
              />
            </label>
            <button
              onClick={() => applyAvatar(PRESET_AVATARS[0].src)}
              className={`rounded-2xl border px-3 py-2 text-sm ${theme.secondaryButton}`}
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
        "relative border rounded-xl md:rounded-2xl shadow-sm p-3 sm:p-4 md:p-6 backdrop-blur-sm " +
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

/* ---------- Tasks board (DnD-ish, priorities, deadlines, search/filters) ---------- */
function Board({ todos, setTodos, onStartTask, activeTodoId }) {
  const theme = uiTheme();
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("med");
  const [due, setDue] = useState("");
  const [time, setTime] = useState("");
  const [remind, setRemind] = useState(60);
  const [estimate, setEstimate] = useState("");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all"); // all | high | med | low | overdue | today | missed
  const [nowTick, setNowTick] = useState(Date.now());

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
    const refresh = () => setNowTick(Date.now());
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
    setText("");
    setPriority("med");
    setDue("");
    setTime("");
    setRemind(60);
    setEstimate("");
    if (Number(remind) > 0) ensurePermission();
  };

  const toggle = (id) =>
    setTodos(todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  const remove = (id) => setTodos(todos.filter((t) => t.id !== id));
  const update = (id, patch) =>
    setTodos(todos.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  const rawTodo = todos.filter((t) => !t.done);
  const done = todos.filter((t) => t.done);

  const match = (t) => {
    const okQ = !q || t.title.toLowerCase().includes(q.toLowerCase());
    let okF = true;
    if (filter === "high") okF = t.priority === "high";
    if (filter === "med") okF = t.priority === "med";
    if (filter === "low") okF = t.priority === "low";
    if (filter === "overdue") okF = isOverdue(t.due);
    if (filter === "today") okF = isToday(t.due);
    if (filter === "missed") okF = isMissed(t);
    return okQ && okF;
  };

  const todo = rawTodo
    .slice()
    .sort((a, b) => {
      const adn = isDueNow(a),
        bdn = isDueNow(b);
      if (adn !== bdn) return adn ? -1 : 1;
      const am = isMissed(a),
        bm = isMissed(b);
      if (am !== bm) return am ? -1 : 1; // keep Missed on top
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

  const doneFiltered = done.filter(match);

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div>
        {/* Add row */}
        <div className="mb-3">
          <div className="flex flex-wrap items-center gap-2 gap-y-2">
            {/* Title — full width on mobile, compact on md+ */}
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
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

            {/* Estimate + help */}
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={5}
                max={120}
                step={5}
                value={estimate}
                onChange={(e) => setEstimate(e.target.value)}
                placeholder="Est"
                title="Estimate (minutes)"
                className="h-9 shrink-0 w-[74px] rounded-xl border px-3 bg-white dark:bg-slate-900 dark:border-slate-700"
              />
              <HelpTip label="Estimate help">
                <p className="mb-1 font-semibold">Estimate (minutes)</p>
                <p>
                  Planned time for this task. When you press <b>Start</b> on
                  this task, the session will use this value.
                </p>
              </HelpTip>
            </div>

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

            {/* Add — full width on mobile for easy tapping */}
            <button
              onClick={add}
              className={`order-20 md:order-none h-9 shrink-0 px-3 rounded-xl w-full sm:w-auto ${theme.primaryButton}`}
            >
              Add
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search…"
            className="h-9 flex-1 rounded-xl border px-3 bg-white dark:bg-slate-900 dark:border-slate-700"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-9 rounded-xl border px-3 bg-white dark:bg-slate-900 dark:border-slate-700"
            title="Filter"
          >
            <option value="all">All</option>
            <option value="high">High</option>
            <option value="med">Med</option>
            <option value="low">Low</option>
            <option value="today">Today</option>
            <option value="overdue">Overdue</option>
            <option value="missed">Missed</option>
          </select>
        </div>

        {/* To-do */}
        <Column
          title={`To-do (${todo.length})`}
          items={todo}
          onToggle={toggle}
          onRemove={remove}
          onUpdate={update}
          isDueNow={isDueNow}
          isOverdue={isOverdue}
          isToday={isToday}
          isMissed={isMissed}
          onStartTask={onStartTask}
          activeTodoId={activeTodoId}
          scrollMax={180}
          showFade={true}
          emptyMessage="No tasks yet — add your first task ✨"
        />
      </div>

      <div>
        {/* Header секції Done */}
        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
          <h3 className="font-medium text-slate-700 dark:text-slate-300">
            Done ({doneFiltered.length})
          </h3>
          {done.length > 0 && (
            <button
              onClick={() => setTodos(todos.filter((t) => !t.done))}
              className={`h-8 text-xs px-2 rounded-lg border ${theme.secondaryButton}`}
            >
              Clear done
            </button>
          )}
        </div>

        {/* List of completed tasks */}
        <Column
          title=""
          items={doneFiltered}
          onToggle={toggle}
          onRemove={remove}
          onUpdate={update}
          isDueNow={isDueNow}
          isOverdue={isOverdue}
          isToday={isToday}
          isMissed={isMissed}
          onStartTask={onStartTask}
          activeTodoId={activeTodoId}
          scrollMax={180}
          showFade={false}
          emptyMessage="Completed tasks will show up here ✨"
        />
      </div>
    </div>
  );
}

function Column({
  title,
  items,
  onToggle,
  onRemove,
  onUpdate,
  isDueNow,
  isOverdue,
  isToday,
  isMissed,
  onStartTask,
  activeTodoId,
  scrollMax = 180,
  showFade = true,
  emptyMessage = "Nothing here yet ✨",
}) {
  const MotionLi = motion.li;
  const theme = uiTheme();
  // Local Chip (don't depend on global Pill)
  const Chip = ({ children, tone = "slate" }) => (
    <span
      className={
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs " +
        (tone === "rose"
          ? "bg-rose-500/15 text-rose-300"
          : tone === "sky"
            ? "bg-sky-500/15 text-sky-300"
            : tone === "emerald"
              ? "bg-emerald-500/15 text-emerald-300"
              : tone === "amber"
                ? "bg-amber-500/15 text-amber-300"
                : "bg-slate-500/15 text-slate-300")
      }
    >
      {children}
    </span>
  );

  const prioTone = (p) =>
    p === "high" ? "rose" : p === "low" ? "emerald" : "amber";

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
    const overdue = isOverdue(item.due);
    const today = isToday(item.due);
    const dueNow = !inProgress && isDueNow(item);
    const missed = !inProgress && isMissed(item);

    const save = () => {
      onUpdate?.(item.id, {
        title: titleV.trim() || item.title,
        priority: priorityV,
        due: dueV,
        time: timeV,
        remindMins: Number(remindV) || 0,
        estimateMins: estimateV ? Number(estimateV) : null,
      });
      setEditing(false);
    };

    return (
      <MotionLi
        className={
          "group rounded-xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm " +
          "px-3 py-2 hover:shadow-sm hover:bg-white/80 dark:hover:bg-slate-900/80 transition " +
          (inProgress
            ? "ring-2 ring-sky-300/70 border-sky-300 bg-sky-50/90 dark:border-sky-700 dark:bg-sky-950/30 "
            : "") +
          (dueNow
            ? "border-amber-300 ring-2 ring-amber-200/80 bg-amber-50/90 dark:border-amber-700 dark:bg-amber-950/30 "
            : "") +
          (missed
            ? "border-rose-400 ring-2 ring-rose-300/60 bg-rose-50/90 dark:border-rose-700 dark:bg-rose-950/30 "
            : "")
        }
      >
        {!editing ? (
          <div className="grid grid-cols-[auto,1fr] items-start gap-3">
            {/* Left priority stripe */}
            <span
              className={
                "mt-1 h-8 w-1 rounded-full " +
                (item.priority === "high"
                  ? "bg-rose-400"
                  : item.priority === "low"
                    ? "bg-emerald-400"
                    : "bg-amber-400")
              }
            />
            {/* Content */}
            <div className="min-w-0">
              <div className="flex items-start justify-between gap-3">
                <label className="flex items-center gap-2 cursor-pointer min-w-0 flex-1">
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => onToggle(item.id)}
                  />
                  <span
                    className={
                      "truncate font-medium " +
                      (item.done ? "line-through text-slate-400" : "")
                    }
                    title={item.title}
                  >
                    {item.title}
                  </span>
                </label>

                <div className="flex items-center gap-2 shrink-0">
                  {!item.done && (
                    <button
                      onClick={() => {
                        onStartTask?.(item);
                      }}
                      className={`h-8 min-w-16 px-3 rounded-lg whitespace-nowrap text-sm ${inProgress ? theme.secondaryButton : theme.primaryButton}`}
                      title={
                        inProgress
                          ? "Pomodoro is running for this task"
                          : "Start task"
                      }
                    >
                      {inProgress ? "Live" : "Start"}
                    </button>
                  )}
                  <button
                    onClick={() => setEditing(true)}
                    className={`h-8 px-2.5 rounded-lg border text-sm transition md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100 ${theme.secondaryButton}`}
                    title="Edit"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onRemove(item.id)}
                    className={`h-8 px-2.5 rounded-lg border text-sm transition md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100 ${theme.secondaryButton}`}
                    title="Delete"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="mt-2 flex items-center gap-1.5 flex-wrap text-xs">
                {inProgress && <Chip tone="sky">In progress</Chip>}
                {dueNow && <Chip tone="amber">Due now</Chip>}
                {today && <Chip tone="sky">Today</Chip>}
                {overdue && <Chip tone="rose">Overdue</Chip>}
                {missed && <Chip tone="rose">Missed</Chip>}
                {!today && !overdue && item.due && !missed && (
                  <Chip>{item.due.slice(5)}</Chip>
                )}
                {item.time && <Chip tone="sky">{item.time}</Chip>}
                {item.estimateMins ? <Chip>⏱ {item.estimateMins}m</Chip> : null}
                <Chip tone={prioTone(item.priority)}>
                  {item.priority === "high"
                    ? "High"
                    : item.priority === "low"
                      ? "Low"
                      : "Med"}
                </Chip>
              </div>
            </div>
          </div>
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

            {/* Estimate + help (NEW) */}
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={5}
                max={120}
                step={5}
                value={estimateV}
                onChange={(e) => setEstimateV(e.target.value)}
                placeholder="Est"
                className="h-9 shrink-0 w-[74px] rounded-lg border px-3 bg-white dark:bg-slate-900 dark:border-slate-700"
              />
              <HelpTip label="Estimate help">
                <p className="mb-1 font-semibold">Estimate (minutes)</p>
                <p>
                  Planned time for this task. When you press <b>Start</b> on
                  this task, the session will use this value.
                </p>
              </HelpTip>
            </div>

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
                onClick={() => setEditing(false)}
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
    if (!externalStartSignal) return;

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
      };
      const newHistory = [...(pomo.history ?? []), entry];
      setPomo({ ...pomo, sessions, history: newHistory });

      if (sessionHabitId && typeof onHabitAutoDone === "function") {
        onHabitAutoDone(sessionHabitId);
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
      showPomodoroCompleteToast({
        task: baseName(sessionTaskLabel || currentTask),
        minutes: pomo.minutes,
        sessions,
      });
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
  const inc = (d) =>
    setPomo({ ...pomo, minutes: Math.max(5, Math.min(60, pomo.minutes + d)) });

  const mm = Math.floor(secondsLeft / 60)
    .toString()
    .padStart(2, "0");
  const ss = (secondsLeft % 60).toString().padStart(2, "0");

  useEffect(() => {
    const onKey = (e) => {
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
    <div className="space-y-3">
      <div className="text-5xl font-bold tabular-nums text-center">
        {mm}:{ss}
      </div>
      {(sessionTaskLabel || currentTask) && (
        <div className="text-xs text-center text-slate-500 dark:text-slate-400">
          Now: {sessionTaskLabel || currentTask}
        </div>
      )}

      <div className="flex justify-center gap-2">
        <button
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
          className={`h-9 px-3 rounded-xl w-24 ${theme.primaryButton}`}
        >
          {running ? "Pause" : "Start"}
        </button>
        <button
          onClick={reset}
          className={`h-9 px-3 rounded-xl border w-24 ${theme.secondaryButton}`}
        >
          Reset
        </button>
      </div>

      <div className="flex items-center justify-center gap-2 text-sm">
        <button
          onClick={() => inc(-5)}
          className={`h-8 px-2 rounded-lg border ${theme.secondaryButton}`}
        >
          −5m
        </button>
        <span className="text-slate-600 dark:text-slate-300">
          Length: {pomo.minutes}m
        </span>
        <button
          onClick={() => inc(5)}
          className={`h-8 px-2 rounded-lg border ${theme.secondaryButton}`}
        >
          +5m
        </button>
      </div>

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
            accentColor: isDark() ? theme.rangeAccentDark : theme.rangeAccent,
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
          onClick={() => playMelodyByName(ensureAudioContext(), melody, volume)}
          className={`h-8 px-2 rounded-lg border ${theme.secondaryButton}`}
        >
          Test
        </button>
      </div>

      <p className="text-xs text-center text-slate-500 dark:text-slate-400">
        Sessions: {pomo.sessions ?? 0}
      </p>
    </div>
  );
}

/* ===================== Habits ===================== */
function Habits({ habits, setHabits, onStartHabit }) {
  const theme = uiTheme();
  const [name, setName] = useState("");
  const [mins, setMins] = useState(15);

  const toggleDone = (id) => {
    const day = todayKey();
    setHabits(
      habits.map((h) => {
        if (h.id !== id) return h;

        const isToday = h.lastDone === day;

        if (isToday) {
          return { ...h, lastDone: "" };
        }

        const isNewDay = h.lastDone !== day;
        return {
          ...h,
          streak: isNewDay ? h.streak + 1 : h.streak,
          lastDone: day,
        };
      }),
    );
  };

  const remove = (id) => setHabits(habits.filter((h) => h.id !== id));

  const add = () => {
    if (!name.trim()) return;
    const m = Math.max(5, Math.min(60, Number(mins) || 15));
    setHabits([
      { id: uid(), name: name.trim(), mins: m, streak: 0, lastDone: "" },
      ...habits,
    ]);
    setName("");
    setMins(15);
  };

  return (
    <div>
      {/* Input row */}
      <div className="flex gap-2 mb-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Add a habit…"
          className="w-full rounded-xl border border-slate-200 bg-white text-slate-900 px-3 py-2
                     focus:outline-none focus:ring-2 focus:ring-slate-300
                     dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-400"
        />
        <input
          type="number"
          min={5}
          max={60}
          value={mins}
          onChange={(e) => setMins(parseInt(e.target.value || "0", 10))}
          className="w-20 rounded-xl border px-3 py-2 text-center dark:bg-slate-900 dark:border-slate-700"
          title="Minutes"
        />
        <button
          className={`px-3 py-2 rounded-xl ${theme.primaryButton}`}
          onClick={add}
        >
          Add
        </button>
      </div>

      {/* Scroll list */}
      <div className="mt-3 pr-2 h-64 overflow-y-auto custom-scroll">
        <ul className="space-y-2">
          {habits.map((h) => {
            const isDoneToday = h.lastDone === todayKey();
            return (
              <li
                key={h.id}
                className={`group flex items-center justify-between rounded-xl border px-3 py-2 transition
                  ${
                    isDoneToday
                      ? "bg-emerald-50 border-emerald-300 dark:bg-emerald-900/30 dark:border-emerald-700"
                      : "bg-slate-50 border-slate-200 dark:bg-slate-900/60 dark:border-slate-700"
                  }`}
              >
                <div>
                  <div className="font-medium flex items-center gap-2">
                    {h.name} - <span className="text-slate-500">{h.mins}m</span>
                    {isDoneToday && (
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs
                                       bg-emerald-500/15 text-emerald-600 dark:text-emerald-300"
                      >
                        ✓ Today
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Streak: {h.streak} day{h.streak === 1 ? "" : "s"}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onStartHabit?.(h)}
                    className={`px-2 py-1 rounded-lg border text-sm ${theme.secondaryButton}`}
                  >
                    Start
                  </button>

                  <button
                    onClick={() => toggleDone(h.id)}
                    className={`px-2 py-1 rounded-lg text-sm transition
                      ${
                        isDoneToday
                          ? "bg-emerald-500 text-white hover:bg-emerald-600"
                          : theme.secondaryButton
                      }`}
                  >
                    {isDoneToday ? "Done ✓" : "Done today"}
                  </button>

                  <button
                    onClick={() => remove(h.id)}
                    className="opacity-0 group-hover:opacity-100 transition text-sm text-slate-500 dark:text-slate-400"
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
          {habits.length === 0 && (
            <li className="text-sm text-slate-400 dark:text-slate-500">
              No habits yet — start with one small habit 🌱
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
function DailyGoal({ pomo, habits, avatarSrc, profileName }) {
  const theme = uiTheme();
  const [goal, setGoal] = useState(load("ff.goalMins", 60));
  useEffect(() => save("ff.goalMins", goal), [goal]);

  const [view, setView] = useState("today"); // "today" | "yesterday" | "last7"

  const doneToday = sumTodayMinutes(pomo.history);
  const pct = Math.min(100, Math.round((doneToday / (goal || 1)) * 100));
  const todaySessions = (pomo.history ?? []).filter(
    (e) => e.day === todayKey(),
  );
  const habitsDoneToday = (habits ?? []).filter(
    (h) => h.lastDone === todayKey(),
  );
  const longestStreak =
    (habits ?? []).reduce((max, h) => Math.max(max, h.streak || 0), 0) || 0;
  const topSessionName =
    todaySessions[0]?.name ||
    todaySessions[0]?.source ||
    (todaySessions[0]?.label
      ? String(todaySessions[0].label).split("•")[0].trim()
      : "");

  const shareAchievements = useCallback(async () => {
    try {
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
      const file = new File([blob], "focusflow-achievement.png", {
        type: "image/png",
      });

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

      if (window.ClipboardItem && navigator.clipboard?.write) {
        const item = new ClipboardItem({ "image/png": blob });
        await navigator.clipboard.write([item]);
        toast.success("Story card copied as image");
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "focusflow-achievement.png";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Achievement card downloaded");
    } catch (err) {
      if (err?.name === "AbortError") return;
      toast.error("Couldn't share right now");
    }
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
    <div className="space-y-4">
      {/* Header + progress */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-baseline justify-between">
            <div className="text-lg font-semibold">Daily Goal</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              {doneToday} / {goal} min
            </div>
          </div>

          <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-2">
            <div
              className={`h-full transition-all bg-gradient-to-r ${theme.progress}`}
              style={{ width: `${pct}%` }}
            />
          </div>

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

        {/* View switch + total */}
        <div className="shrink-0 text-right">
          <div className="inline-flex rounded-xl border bg-slate-100 p-1 dark:bg-slate-900/60 dark:border-slate-700">
            {["today", "yesterday", "last7"].map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={
                  "px-3 py-1 text-xs rounded-lg transition " +
                  (view === v
                    ? "bg-white dark:bg-slate-800 shadow border dark:border-slate-700"
                    : "opacity-70 hover:opacity-100")
                }
              >
                {v === "today"
                  ? "Today"
                  : v === "yesterday"
                    ? "Yesterday"
                    : "Last 7"}
              </button>
            ))}
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Total: <span className="font-medium">{totalMins}m</span>
          </div>
          <button
            onClick={shareAchievements}
            className={`mt-3 inline-flex items-center rounded-xl px-3 py-2 text-xs ${theme.primaryButton}`}
          >
            Share story card
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-3 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700" />
        <div className="pl-8 max-h-40 overflow-y-auto custom-scroll space-y-2">
          {sessions.length === 0 ? (
            <div className="text-sm text-slate-400 dark:text-slate-500">
              No sessions here - start one ⏱️
            </div>
          ) : (
            sessions.map((e) => {
              const name =
                e.name ||
                e.source ||
                (e.label ? String(e.label).split("•")[0].trim() : "") ||
                "Pomodoro";
              const tag = inferTag(name);
              return (
                <div
                  key={(e.at || Math.random()) + e.day}
                  className="relative rounded-xl border bg-slate-50 px-3 py-2 border-slate-200 dark:bg-slate-900/60 dark:border-slate-700"
                >
                  <div className="absolute -left-4 top-3 w-2 h-2 rounded-full bg-sky-400 ring-4 ring-sky-400/15" />
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      {tag && (
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${tag.cls}`}
                        >
                          <span>{tag.icon}</span>
                          {tag.label}
                        </span>
                      )}
                      <div className="font-medium truncate">{name}</div>
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
    </div>
  );
}

/* ===================== Weekly Chart ===================== */
function WeeklyChart({ pomo }) {
  const theme = uiTheme();
  const data = useMemo(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // Sunday
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return {
        key: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString(undefined, { weekday: "short" }),
        mins: 0,
      };
    });
    (pomo.history ?? []).forEach((e) => {
      const idx = days.findIndex((d) => d.key === e.day);
      if (idx >= 0) days[idx].mins += e.mins;
    });
    return days;
  }, [pomo.history]);

  const dark = isDark();

  return (
    <div className="h-44 sm:h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 10, right: 20, bottom: 0, left: 0 }}
        >
          <CartesianGrid
            stroke={dark ? "#334155" : "#e2e8f0"}
            strokeDasharray="3 3"
          />
          <XAxis dataKey="label" stroke={dark ? "#94a3b8" : "#64748b"} />
          <YAxis allowDecimals={false} stroke={dark ? "#94a3b8" : "#64748b"} />
          <Tooltip
            contentStyle={{
              background: dark ? "#0f172a" : "#ffffff",
              border: `1px solid ${isDark() ? "#334155" : "#e2e8f0"}`,
            }}
            labelStyle={{ color: dark ? "#e2e8f0" : "#0f172a" }}
            formatter={(v) => `${v} min`}
          />
          <Line
            type="monotone"
            dataKey="mins"
            stroke={dark ? theme.chartDark : theme.chart}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
