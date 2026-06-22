# Student Dashboard

A React + Vite student productivity app for managing study tasks, tracking progress, storing study resources, and exploring a built-in student performance prediction feature.

Live demo: https://learning-assistant-mauve.vercel.app/#/

## What it does

- Task manager with add, complete, delete, and streak tracking
- Dashboard with productivity score and quick study metrics
- History page for completed tasks and calculation history
- Calculator for saving daily efficiency calculations
- Profile page for student details and profile photo uploads
- Resources page for saving study links and lightweight files
- Settings page for app preferences, export, and task reset
- Performance prediction page based on a linear regression model
- Firebase authentication with email/password and Google sign-in

## Routing

This app uses `HashRouter`, so routes look like:

- `/#/`
- `/#/login`
- `/#/tasks`
- `/#/prediction`

That keeps navigation working on hosted static deployments such as Vercel.

## Tech Stack

- React 19
- Vite
- React Router
- Firebase Auth, Firestore, Storage
- Recharts
- Plain CSS modules/files

## Project Structure

```text
src/
  Components/
  firebase/
  ml/
  pages/
  services/
  App.jsx
  main.jsx
```

## Local Setup

1. Install dependencies

```bash
npm install
```

2. Start the dev server

```bash
npm run dev
```

3. Build for production

```bash
npm run build
```

## Firebase Setup

The app expects Firebase to be configured in `src/firebase/firebaseconfig.js`.

Before using authentication in production, make sure:

- Email/password sign-in is enabled in Firebase Auth
- Google sign-in is enabled if you want the Google button to work
- Your deployed domain is added to Firebase Auth authorized domains

## Deployment Notes

- The current live demo is deployed on Vercel.
- Because the app uses hash routing, direct refreshes on nested routes should continue to work.
- The Firebase project used by the app must match the deployment environment.

## Known Implementation Details

- Tasks and settings are persisted through Firestore.
- Resources can be stored as links or uploaded files through Firebase Storage.
- The prediction page uses an in-app linear regression model and stores prediction history for signed-in users.

## Author

Krishna

