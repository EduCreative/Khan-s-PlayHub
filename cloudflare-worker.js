
/**
 * Khan's PlayHub - Cloudflare Worker Backend v2.6.0
 * Requirements: D1 Database named 'PLAYHUB_DB'
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const method = request.method;

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

    // Check if D1 is bound correctly
    if (!env.PLAYHUB_DB) {
      return new Response(JSON.stringify({ 
        error: "D1 Binding Missing", 
        message: "The variable 'PLAYHUB_DB' is not bound to a D1 database in Worker settings." 
      }), { status: 500, headers: corsHeaders });
    }

    try {
      // --- PUBLIC ENDPOINTS ---

      if (url.pathname === '/scores' && method === 'POST') {
        const { deviceId, gameId, score, timestamp } = await request.json();
        await env.PLAYHUB_DB.prepare(`
          INSERT INTO scores (deviceId, gameId, score, timestamp) 
          VALUES (?, ?, ?, ?)
          ON CONFLICT(deviceId, gameId) DO UPDATE SET 
          score = excluded.score, timestamp = excluded.timestamp
          WHERE excluded.score > scores.score
        `).bind(deviceId, gameId, score, timestamp).run();
        return new Response(JSON.stringify({ status: 'success' }), { headers: corsHeaders });
      }

      if (url.pathname === '/leaderboard/global' && method === 'GET') {
        const results = await env.PLAYHUB_DB.prepare(`
          SELECT p.username, p.avatar, SUM(s.score) as score 
          FROM scores s
          LEFT JOIN profiles p ON s.deviceId = p.deviceId
          GROUP BY s.deviceId
          ORDER BY score DESC LIMIT 10
        `).all();
        return new Response(JSON.stringify(results.results), { headers: corsHeaders });
      }

      if (url.pathname.startsWith('/leaderboard/') && method === 'GET') {
        const gameId = url.pathname.split('/').pop();
        const results = await env.PLAYHUB_DB.prepare(`
          SELECT p.username, p.avatar, s.score 
          FROM scores s
          LEFT JOIN profiles p ON s.deviceId = p.deviceId
          WHERE s.gameId = ? 
          ORDER BY s.score DESC LIMIT 10
        `).bind(gameId).all();
        return new Response(JSON.stringify(results.results), { headers: corsHeaders });
      }

      if (url.pathname === '/profile' && method === 'POST') {
        const p = await request.json();
        await env.PLAYHUB_DB.prepare(`
          INSERT INTO profiles (deviceId, username, email, avatar, bio, favorites, joinedAt) 
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(deviceId) DO UPDATE SET 
          username = excluded.username, 
          email = excluded.email, 
          avatar = excluded.avatar, 
          bio = excluded.bio,
          favorites = excluded.favorites,
          joinedAt = excluded.joinedAt
        `).bind(
          p.deviceId, 
          p.username, 
          p.email || null, 
          p.avatar, 
          p.bio, 
          JSON.stringify(p.favorites || []), 
          p.joinedAt || Date.now()
        ).run();
        return new Response(JSON.stringify({ status: 'synced' }), { headers: corsHeaders });
      }

      // --- ADMIN NEXUS ENDPOINTS ---

      if (url.pathname === '/admin/summary' && method === 'GET') {
        const userCount = await env.PLAYHUB_DB.prepare("SELECT COUNT(*) as count FROM profiles").first("count");
        const scoreCount = await env.PLAYHUB_DB.prepare("SELECT COUNT(*) as count FROM scores").first("count");
        const topGame = await env.PLAYHUB_DB.prepare("SELECT gameId, COUNT(*) as count FROM scores GROUP BY gameId ORDER BY count DESC LIMIT 1").first();
        
        return new Response(JSON.stringify({
          totalUsers: userCount,
          totalSessions: scoreCount,
          popularGame: topGame,
          dbStatus: 'OPTIMAL'
        }), { headers: corsHeaders });
      }

      if (url.pathname === '/admin/users' && method === 'GET') {
        const users = await env.PLAYHUB_DB.prepare(`
          SELECT p.*, SUM(s.score) as totalScore, COUNT(s.gameId) as gamesPlayed
          FROM profiles p
          LEFT JOIN scores s ON p.deviceId = s.deviceId
          GROUP BY p.deviceId
          ORDER BY totalScore DESC
        `).all();
        return new Response(JSON.stringify(users.results), { headers: corsHeaders });
      }

      if (url.pathname.startsWith('/admin/user/') && method === 'DELETE') {
        const deviceId = url.pathname.split('/').pop();
        await env.PLAYHUB_DB.prepare("DELETE FROM profiles WHERE deviceId = ?").bind(deviceId).run();
        await env.PLAYHUB_DB.prepare("DELETE FROM scores WHERE deviceId = ?").bind(deviceId).run();
        return new Response(JSON.stringify({ status: 'wiped' }), { headers: corsHeaders });
      }

      return new Response("Nexus API Endpoint", { status: 404, headers: corsHeaders });
    } catch (err) {
      return new Response(err.message, { status: 500, headers: corsHeaders });
    }
  }
};
