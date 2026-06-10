
# 🕹️ Khan's PlayHub: The Ultimate Micro-Gaming Hub

**Version:** 3.2.0 "Cyber Snake Arena & Ranked Highlights"  
**Architecture:** React 19 + Cloudflare D1 + Workers  
**Design Philosophy:** Neon-Cyberpunk / Offline-First / Zero-Latency

Khan's PlayHub is an active collection of classic, high-performance, and mobile-friendly games that save your scores and progress.

---

## 🚀 Recent Enhancements (v3.2.0)
- **Brand New "Snake Arena" Game!**: A Slither-style survival game where you guide your snake around an endless digital field.
  - **Eat and Grow**: Collect colorful glowing dots of different values to grow longer and wider.
  - **Other Snakes (AI Bots)**: Avoid head-on collisions with opponent snakes of active different colors!
  - **Eliminations**: Trap others to make them crash into you. When they die, they leave high-energy food behind for anyone to eat.
  - **Boost Mode**: Hold Spacebar or tap the mobile "BOOST" button to dash, using your size strategically.
  - **Easy, Medium, Hard Difficulties**: Choose your speed and AI intelligence before jumping in.
- **Ranked Leaderboard Highlighting**: In the global leaderboard, you can now see your score highlighted in custom Indigo color with a neat **"YOU"** badge so you can check your standing at a glance!

## 🚀 Recent Enhancements (v3.1.9)
- **Synchronized User Deletion**: Re-engineered user removal inside the Admin Console to physically purge selected player rows and corresponding local/cloud scores synchronously from both central Firestore collection storage and Cloudflare D1 remote database nodes.
- **Audited Profile Consolidation**: Verified and robustified the cumulative duplicate merge algorithms to ensure frictionless cross-network replication.

## 🚀 Previous Enhancements (v3.1.8)
- **Visual Analytics Dashboard**: Fully integrated a rich visual telemetry sub-system featuring Recharts-powered ranking charts, a 3D championship podium representing top-tier player hierarchies, and automatic horizontal comparative grids showing top records across all 16 micro-games.

## 🚀 Previous Enhancements (v3.1.7)
- **Consolidation Cleanup Suite**: Added a beautiful multi-select duplicate user cleanup tool directly in the Player Database. Consolidates total play lengths, list matrices, achievements, scores, and updates pointers in both Firestore and Cloudflare D1 databases under a consolidated Primary profile.

## 🚀 Previous Enhancements (v3.1.6)
- **Standardized Date Layouts**: Integrated elegant `"dd/mmm/yyyy"` calendar stamp notations across multiple layers of the Admin telemetry table records, supporting structured chronological audits.

## 🚀 Previous Enhancements (v3.1.5)
- **Dynamic Database Sync Badges**: Integrates adaptive notification bubbles directly inside the Admin Console tab selection header displaying active score discrepancy counts.
- **Critical & Warning Overview Alert Banners**: Programmed glowing, user-friendly CSS-pulsing notices prominently positioned on the dashboard overview homepage when database mismatch values are verified.

## 🚀 Previous Enhancements (v3.1.4)
- **Autonomous Consensus Sync Engine**: Programmed a robust, self-healing database sync checker operating on a 45-second background loop inside the Admin Panel. It compares real-time records from Firestore and Cloudflare D1, resolving any scores, missing values, or duplicate discrepancies in favor of the higher/superior high score.
- **Visual Sync Control Dashboard**: Added an interactive telemetry suite in the System configuration tab, featuring a master Auto-Sync toggle, diagnostic operational metrics, self-healed feed, and a rich scrolling live ledger console terminal.

## 🚀 Previous Enhancements (v3.1.3)
- **Advanced Player Catalog Sorting**: Clickable table columns in Admin Users view allow instant ascending/descending sorting for Username, Games, Total Score, Play Time, and Join Date.
- **Dynamic Games Search & Multi-Ranking**: Enhanced the Admin Games dashboard with dynamic search filters and sorting (Most Plays, Avg Scores, Record score, and Name) computed live from actual players' stats.

## 🚀 Previous Enhancements (v3.1.2)
- **Unified Leaderboard Aggregations**: Upgraded the Global Leaderboard's Firebase fallback to dynamically group and sum scores from different games per user. This prevents duplicate entries of a single player on the leaderboard.
- **Self-Healing Admin Alignment**: Reconstructed the Admin Panel's user lookup system to automatically reconcile profiles with raw gaming scores in real-time, correcting any empty totals or stats discrepancies seamlessly.
- **Default Cloudflare URL Integration**: Pre-populated the official Cloudflare Worker endpoint inside the system configurations, ensuring zero configuration is needed on launch and resolving any "URL Missing" flags.
- **Export to CSV (v3.1.1)**: Integrated an instantaneous CSV exporter into the 'Recent Activity' widget of the Admin Panel, enabling secure backups of recent platform-wide scores.

## 🚀 Previous Enhancements (v3.0.0)
- **Player Identity & Onboarding**: New players are now greeted with a setup flow to personalize their name, email, and avatar.
- **Responsive Profile Modal**: Completely redesigned the profile window to fit perfectly on all screens with scrollable content.
- **Expanded Achievements**: Added 7 new achievements (total 13) to track your progress across all games.
- **Enhanced UX**: Added tooltips to all major buttons and renamed "Operative" to "Player" for a friendlier experience.
- **Enhanced Admin Console**: Professional dashboard with charts, graphs, and detailed game statistics.
- **Grammar Guardian Overhaul**: Transformed into a learning-focused game with 50 unique questions, detailed explanations, and no time limits.
- **Share App Feature**: Added a "Share" button to the Hub header for easy sharing via native share dialog or clipboard.
- **Particle Fixes**: Resolved lingering particle effects across multiple games (Bit Master, Quick Math).
- **Mission Briefings**: Every game now includes detailed playing instructions before you start.

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

1. **Instant Play**: New users are never blocked by profile setup. They can play immediately as an "Anonymous Player".
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
