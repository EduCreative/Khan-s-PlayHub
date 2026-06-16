
# Changelog

## [3.5.4] - 2026-06-16
### Added
- **Dynamic side-by-side 'Game Toppers Board'**:
  - Designed an interactive board that groups real global database high scores across all users on mount, dynamically selecting and displaying the top scorer's name, peak score, and exact chronological date for every micro-game.
  - Implemented high-contrast responsive layouts that sit side-by-side with the traditional selected-game records on desktop displays and wrap cleanly on mobile screens.
  - Configured custom visual crown icons and animated loading states for high aesthetic polish.
- **Visual & Advanced Global Telemetry Consolidation**:
  - Consolidated the separate 'Visual Leaderboard' (radar & bar charts) and 'Global Leaderboard' (progression trends & histograms) views to sit inline at the footer of the unified Leaderboard page, clearing UI button cluster clutter on the main navigation.

## [3.5.3] - 2026-06-16
### Added
- **Manual 'Toggle Offline Mode' Option in Settings**:
  - Implemented an interactive toggle button for forced Offline Mode inside the user `SettingsModal`.
  - Disables background database connection queries, global record fetch promises, active challenge play updates, and initial profile Firestore queries, allowing complete data conservation and quiet local-first sessions on-demand.
  - Composed aesthetic transition cues, assigning a physical airplane-mode flight path icon and warning tags for visual transparency.
- **Top-Left Header & Footer Protocols Versioned**:
  - Incremented target and diagnostic protocol designations from `3.5.2` directly to `3.5.3`.

## [3.5.2] - 2026-06-16
### Fixed
- **Mobile Responsive Header Wrapping**:
  - Refactored the hub header action button track using a robust, wrapping flexbox layout.
  - Adjusted button dimensions dynamically on small screens (from `14x14` down to `10x10`) so that the Profile button, Sync Cloud option, and other core utilities wrap gracefully without being pushed off-screen or occluded.
- **Removed Duplicate Admin Action Entry**:
  - Eliminated the redundant `>_ Admin` button from the main header action row while keeping the elegant badges and standard consoles fully intact.
- **Top-Left & Footer Version Standardization**:
  - Synchronized the developer diagnostic flag on the top-left and the footer protocol tag to consistently refer to `v3.5.2`.

## [3.5.1] - 2026-06-15
### Added
- **Manual 'Sync Cloud' On-Demand Action Button**:
  - Engineered a premium, interactive manual synchronization button positioned elegantly right next to the player's profile avatar.
  - Keeps standard high scores and user profile modifications local in `localStorage` + React state instantly, resulting in zero latency, zero spontaneous database self-rendering calls, and absolutely zero automatic Firestore writes during normal gameplay.
  - Equips the Sync Cloud button with responsive visual telemetry states: tranquil emerald-colored borders for `'Synced'`, an amber spinner for `'Syncing...'`, and a glowing indigo gradient background with a crimson pulsing alert bead when unsynced changes exist.
- **Vibrant Multi-Colored Google Sign-In Branding**:
  - Replaced the plain, monochrome Google icon with a pixel-perfect, vector-rendered official multi-colored Google 'G' brand mark SVG inside a clean white badge.
  - Relocated the sign-in prompt adjacent to the profile button, keeping access entry paths intuitively side-by-side in the hub header.

### Fixed
- **Clean Console Diagnostic Logs**:
  - Purged redundant `"App Rendering..."` debug print logs, enhancing runtime console cleanliness.

## [3.5.0] - 2026-06-12
### Fixed
- **Optimized startup sequence and eliminated redundant boot-up renders**:
  - Implemented React lazy state initializers (`useState(() => { ... })`) to synchronously extract `scores`, `userProfile`, `isDarkMode`, `showTutorial`, and global configuration metrics directly from `localStorage` during the initial rendering mount context.
  - Eliminated the redundant post-mount initialization `useEffect` block, completely mitigating serial state update rendering streams (resolving the excessive "App Rendering..." console warnings).
- **Hardened Firebase Authentication inside sandboxed iframes & throttled overlapping requests**:
  - Integrated `isLoggingIn` state tracking to instantly deactivate the Sign In selector and display a smooth visual spinning loader, preventing duplicate overlapping clicks which triggered double `signInWithPopup` popup streams.
  - Resolved `auth/cancelled-popup-request` and `auth/popup-closed-by-user` failure bubbles, gracefully logging them inside diagnostic telemetry rather than letting them crash with global unresolved promise exceptions (`INTERNAL ASSERTION FAILED: Pending promise was never set`).
  - Added clean viewport alerts recommending standalone windows to bypass browser sandbox blocks if iframe popups are actively suppressed by the browser.

## [3.4.3] - 2026-06-12
### Added
- **Simulated Cyber Mesh fallback & Free Chat Lobby**: Solved backend non-delivery and Google authentication constraints:
  - **No Authentication Requirement**: Guests can chat instantly using their local username profile.
  - **Cyber Bot Simulation Mode (Free & Fast)**: Added a status toggle button to select between "Live Server" and fallback "Cyber Mesh". Simulated active cyberpunk peers (`PRO_GAMER_99`, `STEALTH_VIPER`, etc.) chat automatically, answer players' messages contextually, suggest strategies, and reply within milliseconds.
  - **Integrated Achievements & High Scores Feed**: Any game loop milestone achieved on the platform dispatches a custom system message straight to the chat lobby, stimulating bot reactions and cheers.

## [3.4.2] - 2026-06-12
### Added
- **Snake Arena Power-ups, Head Orbits, and Action Countdown HUD**: Augmented Snake Arena with dynamic collectible power-ups:
  - **Speed Boost (Neon Green Dot)**: Sprinkles glowing neon-green speed pills with unique halos. Grants 1.5x velocity and 2.1x boost acceleration, and locks body segment count (no shrinkage when accelerating!) for 8 seconds.
  - **Invincibility (Golden Metallic Dot)**: spawns golden glowing points triggering dynamic 8-second invulnerability, complete with a beautiful gold orbit halo circling the player's head. Player passes safely through enemies on head-first crashes!
  - **Power-up State Countdowns Panel**: Designed stylized real-time active power-up trackers positioned elegantly at the top-left section of the screen with neon pulsations.
  - **Cosmetic Snake Shaders**: Modified player segment rendering to reflect active states with distinct custom textures (golden colors under invincibility, electric mint colors under speed boost).

## [3.4.1] - 2026-06-12
### Added
- **Snake Arena Adversary Steering and High-Density Grid Upgrades**: Added deep strategic updates to the Snake Arena gameplay:
  - **Deeper Color Palette**: Integrated a larger set of high-contrast fluorescent neon food dot colors (such as medium spring green, electric cyan, fuchsia, chartreuse) to enhance board vibrance.
  - **Randomized Enemy Snake Lengths**: Configured bot snake sizes to spawn at heterogeneous variable lengths ranging from 4 up to 18 segment nodes depending on the difficulty selection.
  - **Seek-and-Destroy Hunter Bots**: Engineered a high-threat "Attacker" robot state colored with a dedicated crimson red body and warning light-red head that actively plans chase angles, tracks coordinates, and speed-boosts to intercept the player's movements.
  - **Difficulty-Responsive Fleet Density**: Scaled bot crowds and attacker quotas dynamically based on easy (4 bots, 1 attacker), medium (7 bots, 2 attackers), and hard (10 bots, 4 attackers) challenges.

## [3.4.0] - 2026-06-11
### Added
- **Integrated Player 'User Log' Table in Admin Panel**: Added a comprehensive session, login, and gameplay audit-trail database log directly after 'Neural Event Registry' inside the detailed view of each player's registry profile card:
  - Supports scrollable chronologically sorted timelines parsing initial sign-ups, system logins, active game sessions, gameplay durations, subscores, and access statuses (`Verified`, `Synced`, `Success`).
  - Seamlessly computes exact gameplay session durations dynamically compiled from historic profile performance parameters.

## [3.3.9] - 2026-06-11
### Fixed
- **Play Time Aggregation & Live Fallback**: Fixed the bug where student or player playtime list statistics could render as `0s` inside the Admin Console:
  - Augmented user loading inside both `getAdminUsers()` (central backend layer) and `processedUsers` (admin panel view memoization filter) to dynamically summarize playtime accumulation across individual custom game sessions stored in `gameStats` on demand.
  - Ensures seamless fallback data for all legacy or pristine profile records without explicit root duration attributes.
### Removed
- **Preset Message Signals**: Removed the premade quick preset chat statements from the live chat console interface, leaving exclusively tactile Emojis and free-typing Custom messaging triggers.

### Verified
- **Chat Synchronization**: Audited all Firestore syncing streams, secure reactive updates, and real-time moderator rendering inside the Admin Dashboard Chat view to guarantee instantaneous sync and zero log friction.

## [3.3.7] - 2026-06-11
### Added
- **Dynamic Leaderboard Rank Column**: Integrated an absolute user scorecard Rank column before the Player column in Admin Panel > Users list. Features stylish, high-contrast visual status badges designed with custom themes for the top three leaderboard performers.

### Fixed
- **Play Time Session Tracking Engine**: Patched the gameplay tracking useEffect hook by establishing a persistent activeGameId reference. Duration calculation now correctly triggers upon game exit to reliably increments and sync player playtime, addressing the issue where it previously remained stuck at 0s.

## [3.3.6] - 2026-06-11
### Added
- **User Chat (Quick Chat) Moderation Suite**: Integrated a complete administrative panel section for moderating public quick chat logs from Firestore:
  - **Dynamic Fetch and Live Synchronizer**: Pull and render up to 150 of the most recent chat events.
  - **Comprehensive Filters**: Added instant filtering for message source (custom messages vs. preset statements vs. emoji glyphs) and regex search matching (by sender username, message content, or sender UID).
  - **Multi-Select Bulk Deletions**: Enabled checkable row actions to execute parallel bulk deletions.
  - **Global Moderation Wipe Command**: Provided a security-audited ledger wipe trigger to scrub the latest transaction records completely, paired with a tactile confirmation safety modal.

## [3.3.5] - 2026-06-11
### Fixed
- **Synchronized Top-Left Static Version & Dynamic Update Tracker**: Fixed the stale, hardcoded "V3.1.9" tag sitting in the absolute-positioned debug-trigger container of `index.html` by updating it to match the active release. Updated and synchronized the central `package.json`, `App.tsx`, and `public/version.json` references to `v3.3.5`. This prevents false dynamic "Update Available" mismatch pop-ups in client browsers.

## [3.3.4] - 2026-06-11
### Fixed
- **Deep-Vapor Log Filter & Unhandled Rejection Suppression**: Added a custom, highly responsive console logger filter and a global `unhandledrejection` listener inside `/src/index.tsx`. This intercepts and silently filters out non-critical sandboxed Firestore timeout notices, ensuring diagnostic logging tools run perfectly clean while native offline local persistence synchronizes in the background.

## [3.3.3] - 2026-06-11
### Fixed
- **Deep-Sourced SDK Warning Suppression**: Set Firestore's internal log level to `'error'` using `setLogLevel('error')` to suppress connection timeout warnings logged inside iframe/sandboxed environments. This preserves local caching functionality and prevents diagnostic console alerts from triggering incorrect errors or telemetry warnings.

## [3.3.2] - 2026-06-11
### Added
- **Floating Tactile Cyber Chat Bubble**: Re-engineered the chat layout to sit inside a beautiful, sticky pulsing floating chat action bubble in the bottom-left corner of the viewport:
  - **Dynamic Hub Visbility Only**: Integrated directly at the root parent context of `Hub.tsx` so the chat is always accessible throughout dashboard sub-views but completely unmounts to provide clear, zero-distraction focus during games.
  - **Expandable Glassmorphic Console Panel**: Tapping the bubble expands a beautiful sliding cyberpunk layout sitting cleanly above the anchor button.
  - **Sleek Network Status Translators**: Replaced technical error warnings with descriptive cyberpunk status badges ("🌐 Multi-Link: Online" vs. "💾 Local Cache Active"), improving professional presentation while keeping the user fully informed.
  - **Unread Notification Badge**: Real-time ticker signals update a bouncy active count bubble so players are instantly notified if they receive a shoutout while organizing high scores.

## [3.3.1] - 2026-06-11
### Fixed
- **Seamless Local Cache & Connection Timeout Isolation**: Resolved 10-second Firestore connection timeouts when operating inside sandboxed iframe/preview environments:
  - Enabled native Firestore local cache persistence via `persistentLocalCache` and `persistentMultipleTabManager()`. This guarantees instant, latency-free reads and writes locally that sync automatically once online.
  - Implemented an elegant 2-second dual-promise race timeout on the bootstrap `getDocFromServer` connection test, preventing any startup stalls.

## [3.3.0] - 2026-06-11
### Added
- **Tactile Real-Time Quick Chat Feed**: Designed and implemented an immersive, sub-second multiplayer micro-reaction system directly in the main Game Hub view:
  - **Dynamic Telemetry Stream**: Supports a beautiful, live-scrolling global logging ticker synced real-time over Firestore long-polling.
  - **Tactile Presets & Cyber Reactions**: Provides 1-tap capsule buttons ("Beat my challenge!", "Focus mode: Max!") and cyber emoji indicators (🧠, ⚡, 🚀, 🔥, 🏆) with integrated synth sound effects upon tap or receive.
  - **Fallback Classic Chat Box**: Integrates a seamless, compact text input field so players can broadcast a "Classic custom burst" option of up to 40 characters without interrupting active gameplay.
  - **Complete Network Error Isolation**: Prevents platform blockages by providing automatic offline/local-only fallback, with intuitive warning badges if disconnected.

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
