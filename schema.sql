-- Khan's PlayHub - D1 Database Schema
-- Deploy this to your Cloudflare D1 instance named 'PLAYHUB_DB'

-- Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  deviceId TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  email TEXT,
  avatar TEXT,
  bio TEXT,
  favorites TEXT DEFAULT '[]',
  joinedAt INTEGER
);

-- Scores Table
CREATE TABLE IF NOT EXISTS scores (
  deviceId TEXT,
  gameId TEXT,
  score INTEGER,
  timestamp INTEGER,
  PRIMARY KEY (deviceId, gameId)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_scores_gameId ON scores(gameId);
CREATE INDEX IF NOT EXISTS idx_scores_score ON scores(score DESC);
