
# 🕹️ Khan's PlayHub: The Ultimate Micro-Gaming Nexus

**Version:** 2.7.0 "Mission Briefing"  
**Architecture:** React 19 + Cloudflare D1 + Workers  
**Design Philosophy:** Neon-Cyberpunk / Offline-First / Zero-Latency

Khan's PlayHub is a high-performance, mobile-first Progressive Web App (PWA) that synchronizes your elite scores and profile across the Cloudflare Nexus.

---

## 🚀 Recent Enhancements (v2.7.0)
- **Mission Briefings**: Every game now includes detailed playing instructions before you start.
- **Difficulty Tiers**: Select between Easy, Medium, and Hard modes for a tailored challenge in key games.
- **Enhanced Mechanics**: Re-engineered Tetris and Bubble Fury for smoother, more competitive gameplay.
- **Improved Hub**: A more scannable and visually striking interface for game selection.

---

## ☁️ Cloudflare Setup Guide (FREE)

To enable global leaderboards and cloud saves, follow these manual steps:

### 1. Create D1 Database
- Log in to [Cloudflare Dashboard](https://dash.cloudflare.com).
- Navigate to **Workers & Pages** > **D1**.
- Create a database named `PLAYHUB_DB`.
- Click **Console** and execute this SQL (Note the new `email` column):
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
  email TEXT,
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

## 🎮 The Onboarding Flow

1. **Instant Play**: New users are never blocked by profile setup. They can play immediately as an "Anonymous Operative".
2. **Post-Game Motivation**: Upon scoring, the Game Over screen prompts the user to save their progress to a persistent profile.
3. **Identity Sync**: Profiles support custom avatars, bios, and secure email links.

---

## 🛠️ Developer Setup
```bash
npm install
npm run dev
npm run build
```

**Architect**: Khan  
**Support**: [kmasroor50@gmail.com](mailto:kmasroor50@gmail.com)
