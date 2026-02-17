# 🕹️ Khan's PlayHub: The Ultimate Micro-Gaming Nexus

**Version:** 2.4.5 "Cloud Synchronized"  
**Architecture:** React 19 + Cloudflare D1 + Workers  
**Design Philosophy:** Neon-Cyberpunk / Offline-First / Zero-Latency

Khan's PlayHub is a high-performance, mobile-first Progressive Web App (PWA) that synchronizes your elite scores and profile across the Cloudflare Nexus.

---

## ☁️ Cloudflare Setup Guide (FREE)

To enable global leaderboards and cloud saves, follow these manual steps:

### 1. Create D1 Database
- Log in to [Cloudflare Dashboard](https://dash.cloudflare.com).
- Navigate to **Workers & Pages** > **D1**.
- Create a database named `PLAYHUB_DB`.
- Click **Console** and execute this SQL:
```sql
CREATE TABLE scores (
  deviceId TEXT,
  gameId TEXT,
  score INTEGER,
  timestamp INTEGER,
  PRIMARY KEY (deviceId, gameId)
);

CREATE TABLE profiles (
  deviceId TEXT PRIMARY KEY,
  username TEXT,
  avatar TEXT,
  bio TEXT
);
```

### 2. Deploy Worker
- Navigate to **Workers & Pages** > **Create Application** > **Worker**.
- Name it `nexus-api`.
- Paste the contents of `cloudflare-worker.js` from this project into the worker editor.
- Go to **Settings** > **Bindings** > **Add Binding** > **D1 Database**.
- Set **Variable name** to `PLAYHUB_DB` and select your database.
- Click **Save and Deploy**.

### 3. Link Frontend
- Copy the deployed Worker URL.
- Paste it into `services/cloud.ts` under the `CLOUDFLARE_WORKER_URL` variable.

---

## 🚀 Key Features

- **Nexus Sync**: Real-time score synchronization with Cloudflare D1.
- **Offline Mode**: 100% playable without internet; syncs automatically when reconnected.
- **PWA Optimized**: Zero loading screens, haptic feedback, and custom neon UI.

---

## 🎮 The Sector Breakdown

### 🧠 Logic & Brain Sectors
* **Sudoku Master**: 9x9 logic challenge with three difficulty tiers.
* **Riddle Rift**: Solve curated enigmas in a high-tech terminal.
* **Pattern Finder**: Identify next vectors in symbolic sequences.
* **Memory Matrix**: Cognitive recall training.

### ⚡ Reflex & Arcade Sectors
* **Blitz Runner**: High-speed 3D-parallax runner.
* **Bubble Fury**: Tactical physics-based bubble combat.
* **Neon Snake**: Progressive speed ramping classic.
* **Cyber Defense**: Orbital shield interception simulator.

### 🔢 Math & Language Sectors
* **Word Builder Quest**: Vocabulary tower construction.
* **Sum Surge**: Neon 2048-style merge challenge.
* **Quick Math**: Mental arithmetic speedrun.
* **Bit Master**: 4-bit binary to decimal trainer.

---

## 🛠️ Developer Setup
```bash
npm install
npm run dev
npm run build
```

**Architect**: Khan  
**Support**: [kmasroor50@gmail.com](mailto:kmasroor50@gmail.com)
