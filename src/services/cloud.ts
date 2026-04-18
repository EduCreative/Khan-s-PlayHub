import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  getDocFromServer
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Game, UserProfile } from '../types';

/**
 * Khan's PlayHub - Firebase Persistence Service
 */

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error Context:', {
    currentUser: auth.currentUser ? {
      uid: auth.currentUser.uid,
      email: auth.currentUser.email,
      emailVerified: auth.currentUser.emailVerified,
      isAnonymous: auth.currentUser.isAnonymous
    } : 'null'
  });
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

class CloudService {
  private provider: 'firebase' | 'cloudflare' | 'hybrid' = 'firebase';
  private workerUrl: string = '';

  constructor() {
    this.testConnection();
  }

  configure(provider: 'firebase' | 'cloudflare' | 'hybrid', workerUrl: string) {
    this.provider = provider;
    this.workerUrl = workerUrl;
    console.log(`CloudService configured: ${provider} | ${workerUrl}`);
  }

  getDataProvider() {
    return this.provider;
  }

  getWorkerUrl() {
    return this.workerUrl;
  }

  private async testConnection() {
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
    } catch (error) {
      if (error instanceof Error && error.message.includes('the client is offline')) {
        console.error("Please check your Firebase configuration. ");
      }
    }
  }

  async syncScore(gameId: string, score: number, userProfile: UserProfile): Promise<boolean> {
    if (!auth.currentUser) return false;
    const uid = auth.currentUser.uid;
    
    let firebaseSuccess = false;
    let cloudflareSuccess = false;

    // Firebase Sync
    if (this.provider === 'firebase' || this.provider === 'hybrid') {
      try {
        await setDoc(doc(db, 'scores', `${gameId}_${uid}`), {
          deviceId: uid,
          gameId,
          score,
          timestamp: Date.now(),
          username: userProfile.username,
          avatar: userProfile.avatar
        }, { merge: true });
        firebaseSuccess = true;
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `scores/${gameId}_${uid}`);
      }
    }

    // Cloudflare Sync
    if ((this.provider === 'cloudflare' || this.provider === 'hybrid') && this.workerUrl) {
      try {
        const baseUrl = this.workerUrl.endsWith('/') ? this.workerUrl.slice(0, -1) : this.workerUrl;
        const res = await fetch(`${baseUrl}/scores`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceId: uid, gameId, score, timestamp: Date.now() })
        });
        cloudflareSuccess = res.ok;
      } catch (e) {
        console.error('Cloudflare Sync Failed:', e);
      }
    }

    return this.provider === 'hybrid' ? (firebaseSuccess && cloudflareSuccess) : (firebaseSuccess || cloudflareSuccess);
  }

  async getGlobalHighScores(gameId: string): Promise<any[]> {
    if (this.provider === 'cloudflare' && this.workerUrl) {
      try {
        const baseUrl = this.workerUrl.endsWith('/') ? this.workerUrl.slice(0, -1) : this.workerUrl;
        const endpoint = gameId === 'all' ? '/leaderboard-total' : `/leaderboard/${gameId}`;
        const res = await fetch(`${baseUrl}${endpoint}`);
        if (res.ok) return await res.json();
      } catch (e) {
        console.error('Cloudflare Fetch Failed:', e);
      }
    }

    // Fallback to Firebase
    const path = 'scores';
    try {
      let q;
      if (gameId === 'all') {
        q = query(collection(db, 'scores'), orderBy('score', 'desc'), limit(10));
      } else {
        q = query(collection(db, 'scores'), where('gameId', '==', gameId), orderBy('score', 'desc'), limit(10));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data());
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, path);
      return [];
    }
  }

  async syncProfile(profile: UserProfile): Promise<boolean> {
    if (!auth.currentUser) return false;
    const uid = auth.currentUser.uid;
    
    let firebaseSuccess = false;
    let cloudflareSuccess = false;

    if (this.provider === 'firebase' || this.provider === 'hybrid') {
      try {
        await setDoc(doc(db, 'profiles', uid), {
          ...profile,
          joinedAt: profile.joinedAt || Date.now()
        }, { merge: true });
        firebaseSuccess = true;
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `profiles/${uid}`);
      }
    }

    if ((this.provider === 'cloudflare' || this.provider === 'hybrid') && this.workerUrl) {
      try {
        const baseUrl = this.workerUrl.endsWith('/') ? this.workerUrl.slice(0, -1) : this.workerUrl;
        const res = await fetch(`${baseUrl}/profile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...profile, deviceId: uid })
        });
        cloudflareSuccess = res.ok;
      } catch (e) {
        console.error('Cloudflare Profile Sync Failed:', e);
      }
    }

    return this.provider === 'hybrid' ? (firebaseSuccess && cloudflareSuccess) : (firebaseSuccess || cloudflareSuccess);
  }

  async getProfile(): Promise<UserProfile | null> {
    if (!auth.currentUser) return null;
    const uid = auth.currentUser.uid;

    if (this.provider === 'cloudflare' && this.workerUrl) {
      // Note: Worker doesn't have a single profile GET endpoint in the current script, 
      // but we could add one or fallback to Firebase.
      // For now, let's fallback to Firebase as it's the primary identity store.
    }

    try {
      const snapshot = await getDoc(doc(db, 'profiles', uid));
      return snapshot.exists() ? snapshot.data() as UserProfile : null;
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, `profiles/${uid}`);
      return null;
    }
  }

  isAdmin(): boolean {
    if (!auth.currentUser) return false;
    const isEmailAdmin = auth.currentUser.email?.toLowerCase() === 'kmasroor50@gmail.com'.toLowerCase();
    const isUidAdmin = auth.currentUser.uid === 'v2swNDzVnegsJNo5eNEiLYv6ZYi2';
    return isEmailAdmin || isUidAdmin;
  }

  // --- Admin Methods (Simplified for Firebase) ---

  async getAdminSummary(): Promise<any> {
    if ((this.provider === 'cloudflare' || this.provider === 'hybrid') && this.workerUrl) {
      try {
        const baseUrl = this.workerUrl.endsWith('/') ? this.workerUrl.slice(0, -1) : this.workerUrl;
        const res = await fetch(`${baseUrl}/admin/summary`);
        if (res.ok) return await res.json();
      } catch (e) {
        console.error('Cloudflare Admin Summary Failed:', e);
      }
    }

    // Fallback/Default for Firebase (Firestore doesn't provide easy counts)
    return {
      totalUsers: 'N/A',
      totalSessions: 'N/A',
      popularGame: 'N/A',
      dbStatus: 'OPTIMAL'
    };
  }

  async getAdminUsers(): Promise<any[]> {
    if (!auth.currentUser) {
      console.warn('getAdminUsers called but no user is authenticated.');
      return [];
    }
    
    if ((this.provider === 'cloudflare' || this.provider === 'hybrid') && this.workerUrl) {
      try {
        const baseUrl = this.workerUrl.endsWith('/') ? this.workerUrl.slice(0, -1) : this.workerUrl;
        const res = await fetch(`${baseUrl}/admin/users`);
        if (res.ok) return await res.json();
      } catch (e) {
        console.error('Cloudflare Admin Users Failed:', e);
      }
    }

    console.log(`Attempting getAdminUsers as: ${auth.currentUser.email} (${auth.currentUser.uid})`);
    const path = 'profiles';
    try {
      const snapshot = await getDocs(collection(db, 'profiles'));
      return snapshot.docs.map(doc => ({ deviceId: doc.id, ...doc.data() }));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, path);
      return [];
    }
  }

  async getAdminUserScores(uid: string): Promise<any[]> {
    if (!auth.currentUser) return [];
    
    if ((this.provider === 'cloudflare' || this.provider === 'hybrid') && this.workerUrl) {
      // In D1, we can just query the scores table for this user
      try {
        const baseUrl = this.workerUrl.endsWith('/') ? this.workerUrl.slice(0, -1) : this.workerUrl;
        const res = await fetch(`${baseUrl}/admin/all-scores`); // This is sub-optimal but works if we don't have a user specific endpoint
        if (res.ok) {
          const allScores = await res.json();
          return allScores.filter((s: any) => s.deviceId === uid);
        }
      } catch (e) {
        console.error('Cloudflare Admin User Scores Failed:', e);
      }
    }

    // Firebase
    try {
      const q = query(collection(db, 'scores'), where('deviceId', '==', uid), orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data());
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, `scores where deviceId == ${uid}`);
      return [];
    }
  }

  async deleteUser(uid: string): Promise<boolean> {
    const path = `profiles/${uid}`;
    try {
      // In a real app, you'd also delete their scores
      await setDoc(doc(db, 'profiles', uid), { deleted: true }, { merge: true });
      return true;
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
      return false;
    }
  }

  async migrateFromWorker(workerUrl: string): Promise<{ success: number, failed: number, total: number, usersSuccess: number }> {
    try {
      const baseUrl = workerUrl.endsWith('/') ? workerUrl.slice(0, -1) : workerUrl;
      
      // 1. Migrate Users
      let usersSuccess = 0;
      try {
        const usersResponse = await fetch(`${baseUrl}/admin/users`);
        if (usersResponse.ok) {
          const users = await usersResponse.json();
          if (Array.isArray(users)) {
            for (const u of users) {
              try {
                // Prepare favorites (Worker stores as string in D1)
                let favorites = [];
                if (typeof u.favorites === 'string') {
                  try { favorites = JSON.parse(u.favorites); } catch (e) { favorites = []; }
                } else if (Array.isArray(u.favorites)) {
                  favorites = u.favorites;
                }

                await setDoc(doc(db, 'profiles', u.deviceId), {
                  username: u.username || 'Anonymous',
                  email: u.email || null,
                  avatar: u.avatar || 'fa-user',
                  bio: u.bio || '',
                  favorites: favorites,
                  joinedAt: u.joinedAt || Date.now()
                }, { merge: true });
                usersSuccess++;
              } catch (err) {
                console.error(`Failed to migrate profile for ${u.deviceId}`, err);
              }
            }
          }
        }
      } catch (userErr) {
        console.error('Failed to migrate users from worker:', userErr);
      }

      // 2. Migrate Scores
      const response = await fetch(`${baseUrl}/admin/all-scores`);
      if (!response.ok) throw new Error(`Worker responded with ${response.status}. Please ensure you have deployed the latest cloudflare-worker.js code to your Cloudflare account.`);
      
      const scores = await response.json();
      if (!Array.isArray(scores)) throw new Error('Invalid data format from worker');

      let successCount = 0;
      let failedCount = 0;

      for (const s of scores) {
        try {
          const scoreId = `${s.gameId}_${s.deviceId}`;
          await setDoc(doc(db, 'scores', scoreId), {
            deviceId: s.deviceId,
            gameId: s.gameId,
            score: s.score,
            timestamp: s.timestamp || Date.now(),
            username: s.username || 'Anonymous',
            avatar: s.avatar || 'fa-user'
          }, { merge: true });
          successCount++;
        } catch (err) {
          console.error(`Failed to migrate score for ${s.deviceId}`, err);
          failedCount++;
        }
      }

      return { success: successCount, failed: failedCount, total: scores.length, usersSuccess };
    } catch (e) {
      console.error('Migration failed:', e);
      throw e;
    }
  }
}


export const cloud = new CloudService();
