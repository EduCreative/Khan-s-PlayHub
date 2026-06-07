
# Changelog

## [3.1.3] - 2026-06-07
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
