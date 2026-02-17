
/**
 * Khan's PlayHub - Cloudflare Worker Backend
 * Paste this into your Cloudflare Worker Dashboard.
 * Requirements: Create a D1 Database named 'PLAYHUB_DB'
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const method = request.method;

    // CORS Headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // 1. Sync Score
      if (url.pathname === '/scores' && method === 'POST') {
        const { deviceId, gameId, score, timestamp } = await request.json();
        
        // Upsert score into D1
        await env.PLAYHUB_DB.prepare(`
          INSERT INTO scores (deviceId, gameId, score, timestamp) 
          VALUES (?, ?, ?, ?)
          ON CONFLICT(deviceId, gameId) DO UPDATE SET 
          score = excluded.score, 
          timestamp = excluded.timestamp
          WHERE excluded.score > scores.score
        `).bind(deviceId, gameId, score, timestamp).run();

        return new Response(JSON.stringify({ status: 'success' }), { headers: corsHeaders });
      }

      // 2. Fetch Leaderboard
      if (url.pathname.startsWith('/leaderboard/') && method === 'GET') {
        const gameId = url.pathname.split('/').pop();
        const results = await env.PLAYHUB_DB.prepare(`
          SELECT deviceId, score FROM scores 
          WHERE gameId = ? 
          ORDER BY score DESC LIMIT 10
        `).bind(gameId).all();

        return new Response(JSON.stringify(results.results), { headers: corsHeaders });
      }

      // 3. Sync Profile
      if (url.pathname === '/profile' && method === 'POST') {
        const profile = await request.json();
        // Save to KV or D1
        await env.PLAYHUB_DB.prepare(`
          INSERT INTO profiles (deviceId, username, avatar, bio) 
          VALUES (?, ?, ?, ?)
          ON CONFLICT(deviceId) DO UPDATE SET 
          username = excluded.username, 
          avatar = excluded.avatar,
          bio = excluded.bio
        `).bind(profile.deviceId, profile.username, profile.avatar, profile.bio).run();

        return new Response(JSON.stringify({ status: 'synced' }), { headers: corsHeaders });
      }

      return new Response("Nexus API Endpoint", { status: 404, headers: corsHeaders });
    } catch (err) {
      return new Response(err.message, { status: 500, headers: corsHeaders });
    }
  }
};

/**
 * SQL Schema for D1:
 * 
 * CREATE TABLE scores (
 *   deviceId TEXT,
 *   gameId TEXT,
 *   score INTEGER,
 *   timestamp INTEGER,
 *   PRIMARY KEY (deviceId, gameId)
 * );
 * 
 * CREATE TABLE profiles (
 *   deviceId TEXT PRIMARY KEY,
 *   username TEXT,
 *   avatar TEXT,
 *   bio TEXT
 * );
 */
