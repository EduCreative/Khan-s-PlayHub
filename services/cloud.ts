import { Game, UserProfile } from '../types';

/**
 * Khan's PlayHub - Cloudflare Persistence Service
 */

const CLOUDFLARE_WORKER_URL = 'https://kmasroor50.cloudflareaccess.com/cdn-cgi/access/certs';

// Fallback UUID generator for non-secure contexts where crypto.randomUUID might be missing
const generateDeviceId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

class CloudService {
  private deviceId: string;

  constructor() {
    let id = localStorage.getItem('khans-playhub-device-id');
    if (!id) {
      id = generateDeviceId();
      localStorage.setItem('khans-playhub-device-id', id);
    }
    this.deviceId = id;
  }

  private isSetup(): boolean {
    return !CLOUDFLARE_WORKER_URL.includes('YOUR_WORKER_URL_HERE');
  }

  async syncScore(gameId: string, score: number): Promise<boolean> {
    if (!this.isSetup()) return false;
    try {
      if (!navigator.onLine) return false;
      const response = await fetch(`${CLOUDFLARE_WORKER_URL}/scores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: this.deviceId, gameId, score, timestamp: Date.now() })
      });
      return response.ok;
    } catch (e) { return false; }
  }

  async getGlobalHighScores(gameId: string): Promise<any[]> {
    if (!this.isSetup()) return [];
    try {
      const res = await fetch(`${CLOUDFLARE_WORKER_URL}/leaderboard/${gameId}`);
      if (res.ok) return await res.json();
      return [];
    } catch (e) { return []; }
  }

  async syncProfile(profile: UserProfile): Promise<boolean> {
    if (!this.isSetup()) return false;
    try {
      // Explicitly map to the D1 Schema: deviceId, username, avatar, bio, email
      const payload = {
        deviceId: this.deviceId,
        username: profile.username,
        avatar: profile.avatar,
        bio: profile.bio,
        email: profile.email || null
      };
      
      const res = await fetch(`${CLOUDFLARE_WORKER_URL}/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return res.ok;
    } catch (e) { return false; }
  }

  // --- Admin Methods ---

  async getAdminSummary(): Promise<any> {
    try {
      const res = await fetch(`${CLOUDFLARE_WORKER_URL}/admin/summary`);
      return res.ok ? await res.json() : null;
    } catch (e) { return null; }
  }

  async getAdminUsers(): Promise<any[]> {
    try {
      const res = await fetch(`${CLOUDFLARE_WORKER_URL}/admin/users`);
      return res.ok ? await res.json() : [];
    } catch (e) { return []; }
  }

  async deleteUser(deviceId: string): Promise<boolean> {
    try {
      const res = await fetch(`${CLOUDFLARE_WORKER_URL}/admin/user/${deviceId}`, { method: 'DELETE' });
      return res.ok;
    } catch (e) { return false; }
  }
}

export const cloud = new CloudService();
