# FocusPlanner

FocusPlanner is a private, browser-first workspace for planning tasks, building habits, and completing focused Pomodoro sessions.

**Live demo:** [viktoriyari.github.io/FocusPlanner](https://viktoriyari.github.io/FocusPlanner/)

---

## What You Can Do

- Plan tasks with priority, due date, time, reminder, and estimated duration.
- Start a Pomodoro session from a task or habit, then pause, restart, or adjust its length.
- Track daily habits, completion history, and streaks.
- See focus minutes, sessions, completed items, and weekly activity in one dashboard.
- Share a Daily Goal achievement card with friends.
- Personalize the app with a profile name, avatar, and theme.
- Follow the built-in onboarding tour on a fresh install.
- Receive task reminders and Pomodoro notifications when your browser or mobile device supports them.

---

## Run Locally

```bash
npm install
npm run dev
```

Open the local address shown by Vite, normally `http://localhost:5173/FocusPlanner/`.

## Quality Checks

```bash
npm test
npm run lint
npm run build
npm run build:mobile
```

## Privacy

FocusPlanner has no accounts, analytics, or backend. Your tasks, habits, settings, and history stay in your browser's `localStorage`.

Use the reset control in the header to clear local app data. Browser data may also be cleared from your browser settings.

---

## Deployment

The project is published with GitHub Pages from the `main` branch. Vite uses `/FocusPlanner/` as the production base path, which matches the repository name.

After pushing to `main`, GitHub Actions creates a new deployment at:

```text
https://viktoriyari.github.io/FocusPlanner/
```

---

## Tech Stack

- React + Vite
- Tailwind CSS
- Framer Motion
- Capacitor and Local Notifications
- canvas-confetti and react-hot-toast

---

## Mobile Build

The web app can also be packaged for Android and iOS through Capacitor:

```bash
npm run cap:sync
npm run cap:open:android
npm run cap:open:ios
```

---

## License

Educational and personal project. Contributions and ideas are welcome through Issues and Pull Requests.

<!--

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
-->
