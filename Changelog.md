
# Changelog

## [3.2.3] - 2026-06-11
### Fixed
- **Firestore Parameter Conflict Fix**: Removed the mutually exclusive configuration where `experimentalForceLongPolling` and `experimentalAutoDetectLongPolling` were both set to `true`, resolving the `Uncaught FirebaseError` crash on application startup.

## [3.2.2] - 2026-06-11
### Fixed
- **Firestore Connection Timeout Fix**: Resolved active 10-second WebSocket connection delays and backend flakiness inside the sandboxed preview environment:
  - Enabled long polling during Firestore initialization to bypass sandbox security blocks.
  - Re-implemented the `testConnection()` sequence to utilize a robust 3-stage exponential retry backoff, preventing early false-positive configuration warnings during initialization.

## [3.2.1] - 2026-06-10
### Added
- **Global Leaderboard Trends view**: Developed an analytical "Global Leaderboard" sub-view powered by Recharts. It features:
  - **Cognitive Silhouette Radar**: Normalizes user category averages against global player records.
  - **Bell Curve Score Distribution**: Plots a smooth, animated area curve of player scores with an interactive "YOU ARE HERE" indicator.
  - **Elite Progression Lines**: Compares the variance steepness of top players relative to the user's reference.
  - **Active Player Search Registry**: Enables dynamic keyword search across the player user base.

## [3.2.0] - 2026-06-10
### Added
- **Expanded Grammar Questions**: Added a vast dictionary of grammar questions inside Grammar Guardian to minimize question repetition and improve player retention.
### Fixed
- **Snake Arena Tablet & Mobile Optimization**: Fixed the "Start Session" button issue in Snake Arena by applying compact responsive paddings, shrinking margins/gaps, and adding beautiful `max-h-[85vh]` overflow-scrolling inside the modal so that everything is perfectly accessible and responsive on all viewport ratios.
- **Multiple Options Fix in Grammar Guardian**: Enhanced active answer selection UI and prefixed badges (`A`, `B`, `C`, `D`) for Grammar Guardian to fix the visual option similarity and display choices beautifully.
### Changed
- **Balanced Labyrinth Score Scaling**: Scaled down the unbalanced, exponential scoring design in Labyrinth (previously rewarding 200/500/1000 per level multiplier) into equivalent and highly competitive reward models matching other micro-games in the Hub.

## [3.1.9] - 2026-06-07
### Changed
- **Synchronized User Deletion**: Re-engineered user removal inside the Admin Console to systematically remove account records and historical high scores synchronously across both central Firestore collections and multi-regional Cloudflare D1 nodes.
- **Deep Reconciliation Verification**: Audited the dynamic player-merging and profile-consolidation flows, verifying full dual-database alignment and dynamic scoring consolidation metrics.

## [3.1.8] - 2026-06-07
### Added
- **Visual Analytics Dashboard**: Created an immersive and fully responsive player-ranking analytics sub-system in the Hub using Recharts. Renders high-fidelity animated Bar Charts comparing top 10 player records, a digital 3D ranking podium indicating championship tiers, and comparative layout highlights tracking global records across all 16 micro-games.

## [3.1.7] - 2026-06-07
### Added
- **Dynamic Duplication Cleanup Tool**: Integrated a powerful profile merge engine inside the Player Database. Admins can multi-select rows representing duplicates, evaluate each profile's cumulative activity (comparing `joinedAt`, `lastPlayed` and other stats), designate the Primary profile, and seamlessly consolidate play lengths, list matrices, achievements, high scores, and live references across both Firestore and Cloudflare D1.

## [3.1.6] - 2026-06-07
### Changed
- **Unified Date Format**: Re-engineered raw locale date and time render nodes across the Admin Console interfaces to strictly align with the clean, standardized `"dd/mmm/yyyy"` schema (e.g. `07/Jun/2026`).

## [3.1.5] - 2026-06-07
### Added
- **Dynamic Database Sync Badges**: Integrates adaptive notification bubbles directly inside the Admin Console tab selection header displaying active score discrepancy counts.
- **Critical & Warning Overview Alert Banners**: Programmed glowing, user-friendly notices prominently positioned on the dashboard overview homepage when database mismatch values are verified.

## [3.1.4] - 2026-06-07
### Added
- **Autonomous Database Sync Service**: Introduced a high-availability score sync checker that operates periodically (45-second intervals) when the Admin Console is open. 
- **Consensus & Self-Healing Protocols**: Programmed automated discrepancy detection and conflict resolution rules bridging Cloud Firestore and Cloudflare D1. Outdated or missing data nodes are seamlessly updated with the superior/higher record.
- **Visual Sync Control Dashboard & Ledger Terminal**: Designed a responsive telemetry console inside the System tab, featuring a master Auto-Sync toggle, diagnostic card metrics, active self-healed feed, and a real-time console logger terminal.
### Added
- **Interactive Player Sorting & Searching**: Added fully clickable table columns in the Admin Player Database (Users tab) to dynamically sort players by Username, Games count, Total Score, Play Time, or Register Date, combined with real-time text-filtering.
- **Dynamic Games Catalog Search & Sorting**: Added customized game searches and multi-metric sorting (by Plays, Avg Score, Record Scores, or Game Name) inside the Admin Games console, powered by real-time aggregate statistics.

## [3.1.2] - 2026-06-07
### Changed
- **Unified Leaderboard Aggregation**: Re-engineered the Firebase fallback 'All Games' view on the Global Leaderboard to sum up high scores of played games per user. This prevents duplicate entries of the same player showing up on the leaderboard and tracks cumulative scores perfectly.
- **Self-Healing Admin Scores Alignment**: Patched the Admin Users list to dynamically reconcile and sync raw platform scores with user profiles on-the-fly, ensuring gaming records are immediately visible in the Admin Panel without delay or unmount-loss.
- **Pre-populated Cloudflare URL**: Configured `https://khans-playhub-worker.kmasroor50.workers.dev` as the default Worker URL inside the system, removing manual setup prompts and solving the 'URL Missing' issue.

## [3.1.0] - 2026-06-07
### Added
- **Recent Activity Live Feed**: Integrated a platform-wide 'Recent Activity' feed inside the Admin Panel 'Overview' tab displaying real-time scores submitted by users.
- **Auto-polling / Live Update**: Implemented automatic 15-second quiet polling intervals to update score list entries in real-time.
- **Deep Redirection Navigation**: Connected Recent Activity list items to the Players tab. Clicking an item redirects to the 'Users' tab and focuses on the selected player's dashboard.

## [3.0.0] - 2026-03-10
### Added
- **Onboarding Flow**: Automatic profile setup for new players.
- **Responsive Profile**: Redesigned `ProfileModal` with fixed header/footer and scrollable content for mobile compatibility.
- **More Achievements**: Added 7 new achievements for various games.
- **Tooltips**: Added descriptive tooltips to Hub and Profile buttons.
- **Player Rebranding**: Renamed "Operative" and "Nexus" terms to "Player" for better clarity.

## [2.9.0] - 2026-03-10
### Added
- **Enhanced Admin Console**: A professional dashboard with real-time analytics.
- **Data Visualization**: Integrated `recharts` for user growth, game popularity, and hourly activity charts.
- **Tabbed Interface**: Organized admin view into Overview, Users, and Games sections.
- **Game Statistics**: Detailed performance metrics for every game in the library.

## [2.8.0] - 2026-03-10
### Added
- "Share this app" button in the Hub header.
- 50 new questions and detailed explanations for Grammar Guardian.
- Submit and Next Question flow for Grammar Guardian to encourage learning.

### Changed
- Converted Grammar Guardian from a time-based game to a learning-focused game.
- Removed time limit from Grammar Guardian.

### Fixed
- Lingering particle effects in Bit Master and Quick Math when transitioning to new questions.

## [2.4.0] - 2026-02-21
### Added
- Explicit difficulty selection (Easy, Medium, Hard) for Number Ninja and Grammar Guardian.
- Comprehensive playing instructions for all 21 mini-games.
- Keyboard controls for Tetris (Arrows for move/rotate, Space for hard drop).
- Lint script to package.json for better code quality checks.

### Changed
- Improved Tetris mechanics with line clearing and game over logic.
- Enhanced GameRunner to display mission briefings before sessions.
- Refined scoring systems across multiple games for better balance.
- Updated Hub layout with improved typography and visual hierarchy.

### Fixed
- Tetris block rotation and collision detection.
- Bubble Fury game over conditions.
- Various minor UI inconsistencies in dark/light modes.

## [2.3.6] - 2024-05-25
### Added
- **PWA Back-Button Support**: 
  - Integrated Browser History API to intercept hardware back-button presses.
  - Back-button now closes open games instead of minimizing the app.
  - Added "Exit Protocol" confirmation modal for the main Hub.

## [2.3.5] - 2024-05-25
### Added
... (rest of changelog)
