import { Game, UserProfile } from '../types';

/**
 * Khan's PlayHub - Cloudflare Persistence Service
 */

const BASE_URL = (import.meta as any).env.VITE_WORKER_URL || 'https://khans-playhub-worker.kmasroor50.workers.dev/';
const CLOUDFLARE_WORKER_URL = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;

class CloudService {
  private deviceId: string;

  constructor() {
    let id = localStorage.getItem('khans-playhub-device-id');
    if (!id) {
      id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('khans-playhub-device-id', id);
    }
    this.deviceId = id;
  }

  private isSetup(): boolean {
    return CLOUDFLARE_WORKER_URL.length > 0 && !CLOUDFLARE_WORKER_URL.includes('YOUR_WORKER_URL');
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
      if (!response.ok) {
        console.error('Sync Score Failed:', response.status, await response.text());
      }
      return response.ok;
    } catch (e) { 
      console.error('Sync Score Error:', e);
      return false; 
    }
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
      const res = await fetch(`${CLOUDFLARE_WORKER_URL}/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: this.deviceId, ...profile })
      });
      if (!res.ok) {
        console.error('Sync Profile Failed:', res.status, await res.text());
      }
      return res.ok;
    } catch (e) { 
      console.error('Sync Profile Error:', e);
      return false; 
    }
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
