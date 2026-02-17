import { Game, UserProfile } from '../types';

/**
 * Khan's PlayHub - Cloudflare Persistence Service
 * This service handles syncing local data with a Cloudflare Worker + D1 Backend.
 * It uses an 'Offline-First' approach, falling back to LocalStorage.
 */

// IMPORTANT: Replace this URL with your actual Cloudflare Worker URL
const CLOUDFLARE_WORKER_URL = 'https://YOUR_WORKER_URL_HERE.workers.dev';

class CloudService {
  private deviceId: string;

  constructor() {
    let id = localStorage.getItem('khans-playhub-device-id');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('khans-playhub-device-id', id);
    }
    this.deviceId = id;
  }

  private isSetup(): boolean {
    return !CLOUDFLARE_WORKER_URL.includes('YOUR_WORKER_URL_HERE');
  }

  async syncScore(gameId: string, score: number): Promise<boolean> {
    if (!this.isSetup()) {
      console.info('Cloud Sync: CLOUDFLARE_WORKER_URL not configured. Scores are saved locally only.');
      return false;
    }

    try {
      if (!navigator.onLine) return false;
      
      const response = await fetch(`${CLOUDFLARE_WORKER_URL}/scores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: this.deviceId,
          gameId,
          score,
          timestamp: Date.now()
        })
      });
      return response.ok;
    } catch (e) {
      console.warn('Cloud Sync Failed (Check Worker CORS or URL)', e);
      return false;
    }
  }

  async getGlobalHighScores(gameId: string): Promise<any[]> {
    if (!this.isSetup()) return [];
    try {
      if (!navigator.onLine) return [];
      const res = await fetch(`${CLOUDFLARE_WORKER_URL}/leaderboard/${gameId}`);
      if (res.ok) return await res.json();
      return [];
    } catch (e) {
      return [];
    }
  }

  async syncProfile(profile: UserProfile): Promise<boolean> {
    if (!this.isSetup()) return false;
    try {
      if (!navigator.onLine) return false;
      const res = await fetch(`${CLOUDFLARE_WORKER_URL}/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: this.deviceId,
          ...profile
        })
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  }

  async fetchCloudQuestions(category: string): Promise<any[]> {
    if (!this.isSetup()) return [];
    try {
      if (!navigator.onLine) return [];
      const res = await fetch(`${CLOUDFLARE_WORKER_URL}/content/${category}`);
      if (res.ok) return await res.json();
      return [];
    } catch (e) {
      return [];
    }
  }
}

export const cloud = new CloudService();
