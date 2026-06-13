# 🎓 Student Dashboard Web App

A modern, responsive **Student Productivity Dashboard** built using **React + Vite** that helps students manage daily tasks, track productivity, and organize essential academic information in one centralized interface.

---

## 🚀 Live Demo

https://guravanakrishna111-tech.github.io/Student-Dashboard/

---

## 📌 Overview

The **Student Dashboard** is a multi-page web application designed to improve student productivity and organization. It provides essential tools such as a task manager, profile manager, productivity tracker, and calculator — all within a clean, visually appealing UI.

This project demonstrates practical frontend development skills including component architecture, state management, responsive design, and modular styling.

---

## ✨ Features

### 🏠 Dashboard

* Live digital clock
* Welcome interface
* Motivational productivity layout

### ✅ Task Manager

* Add tasks dynamically
* Track daily work
* Minimal, distraction-free interface

### 👤 Profile Page

* Editable student details
* Save personal info
* Profile image support

### 📊 Productivity Tracker

* Input daily study metrics
* Calculate efficiency score
* Track performance trends

### 🔮 Performance Predictor

An advanced feature integrating a Multiple Linear Regression model (originally trained in Python/scikit-learn) directly into the dashboard:
* **Interactive Inputs (Streamlit-style sidebar)**: Adjust Study Hours, Sleep Hours, Previous Score, and Practice Tests via integer sliders.
* **Exact Model Prediction**: Evaluates predictions using raw coefficients trained on 200 student records (`studyHours: 3.05`, `sleepHours: 0.09`, `previousScore: 0.42`, `practiceTests: 1.68`, `intercept: -3.39`), guaranteeing mathematical alignment with the Python version.
* **Seeded Train-Test Split (80/20)**: Splitting is done deterministically (seed 42) in JavaScript to run metrics and predictions on the 20% test subset (40 items).
* **Matplotlib-style Visualizations**: Live interactive scatter charts using Recharts representing "Study Hours vs Exam Score" (full dataset) and "Actual vs Predicted" (test set).
* **Model Validation Metrics**: Displays the model's MAE (`2.30`) and R² score (`0.96`) dynamically.
* **Interactive Dataset Preview**: View the first 20 records of the generated dataset on-screen.
* **Streamlit Alerts**: Displays responsive Success/Info/Warning feedback panels.

### 🧮 Calculator

* Built-in calculator utility
* Lightweight and responsive

### 📜 History Page

* View past productivity data
* Track consistency over time

---

## 🛠 Tech Stack

| Technology | Purpose         |
| ---------- | --------------- |
| React      | UI Components   |
| Vite       | Fast build tool |
| JavaScript | Logic           |
| CSS        | Styling         |
| HTML       | Structure       |

---

## 📂 Project Structure

```
Student-Dashboard
│
├── public
├── src
│   ├── Components
│   ├── pages
│   ├── assets
│   ├── App.jsx
│   └── main.jsx
│
├── index.html
├── package.json
└── vite.config.js
```

---

## 🔐 Authentication Notes

Before running the app you need to enable the authentication methods you intend to use (email/password and/or Google) in the Firebase console for the project defined in `src/firebase/firebaseconfig.js`.

A simple login/register page is available at `/login`. The navigation bar shows a "Sign In" link when the user is not authenticated and switches to the user's email & a logout button after signing in. All data pages display a message asking the visitor to sign in.

> **Routing note for GitHub Pages:** the app now uses `HashRouter` (URL fragments like `/#/settings`) so that client-side navigation works after refreshing or when users share links. No server configuration is required; just deploy the `dist` folder as usual.

## ⚙️ Installation & Setup

Clone the repository

```
git clone https://github.com/your-username/Student-Dashboard.git
```

Navigate into project folder

```
cd Student-Dashboard
```

Install dependencies

```
npm install
```

Run locally

```
npm run dev
```

Build for production

```
npm run build
```

---

## 📦 Deployment

This project is deployed using **GitHub Pages** via the production build folder (`dist`).

### GitHub Pages
1. Add a `homepage` field to `package.json` (e.g. `"homepage": "https://<username>.github.io/Student-Dashboard"`).
2. Install the gh-pages package if you don't already: `npm install --save-dev gh-pages`.
3. Add deployment scripts:
   ```json
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```
4. Run `npm run deploy`.

### Firebase Hosting (alternate)
1. Install CLI: `npm install -g firebase-tools` and run `firebase login`.
2. Initialize hosting inside the repo and select `dist` as the public directory.
3. When prompted, configure as a single‑page app (rewrite all urls to `/index.html`).
4. Build the project (`npm run build`) and deploy with `firebase deploy`.

> Note: ensure the Firebase project in `src/firebase/firebaseconfig.js` matches the one you deploy to.

---

## 🎯 Learning Outcomes

This project demonstrates:

* Component-based architecture
* React routing structure
* UI state handling
* Modular CSS design
* **Firebase authentication** (email/password and Google sign‑in) with protected routes
* Production build deployment

---

## 👨‍💻 Author

**Krishna**
Computer Science Undergraduate
Aspiring Full-Stack Developer

---

## ⭐ Support

If you like this project, give it a ⭐ on GitHub — it motivates further development!

---