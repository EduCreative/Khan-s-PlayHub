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
  getDocFromServer,
  deleteDoc
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
  private workerUrl: string = 'https://khans-playhub-worker.kmasroor50.workers.dev';

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
    try {
      if (gameId === 'all') {
        // Retrieve all scores across the platform, group by user, sum them up
        // This solves the issue of a single user showing up multiple times for different games on the All Games Leaderboard
        const snapshot = await getDocs(collection(db, 'scores'));
        const scoresByUser: Record<string, { username: string; avatar: string; score: number; deviceId: string }> = {};
        
        snapshot.docs.forEach(docDoc => {
          const s = docDoc.data();
          const uid = s.deviceId;
          if (!uid) return;
          
          if (!scoresByUser[uid]) {
            scoresByUser[uid] = {
              username: s.username || 'Anonymous',
              avatar: s.avatar || 'fa-user-ninja',
              score: 0,
              deviceId: uid
            };
          }
          // Firebase writes exactly one document per game per player (document ID is ${gameId}_${uid}),
          // so summing s.score gives the perfect aggregate of high scores of all games played!
          scoresByUser[uid].score += (s.score || 0);
        });

        return Object.values(scoresByUser)
          .filter(p => p.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 10);
      } else {
        const q = query(collection(db, 'scores'), where('gameId', '==', gameId), orderBy('score', 'desc'), limit(10));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data());
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'scores');
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
    
    let rawUsers: any[] = [];
    if ((this.provider === 'cloudflare' || this.provider === 'hybrid') && this.workerUrl) {
      try {
        const baseUrl = this.workerUrl.endsWith('/') ? this.workerUrl.slice(0, -1) : this.workerUrl;
        const res = await fetch(`${baseUrl}/admin/users`);
        if (res.ok) {
          rawUsers = await res.json();
        }
      } catch (e) {
        console.error('Cloudflare Admin Users Failed:', e);
      }
    }

    // Load from Firestore profiles
    if (rawUsers.length === 0) {
      try {
        const snapshot = await getDocs(collection(db, 'profiles'));
        rawUsers = snapshot.docs.map(doc => ({ deviceId: doc.id, ...doc.data() }));
      } catch (e) {
        handleFirestoreError(e, OperationType.LIST, 'profiles');
        return [];
      }
    }

    // Reconcile and synchronize dynamic scores with profile stats on-the-fly!
    try {
      const scoresSnapshot = await getDocs(collection(db, 'scores'));
      const scoresList = scoresSnapshot.docs.map(doc => doc.data());

      // Map deviceId -> scores list
      const scoresByDevice: Record<string, any[]> = {};
      scoresList.forEach(s => {
        if (!s.deviceId) return;
        if (!scoresByDevice[s.deviceId]) {
          scoresByDevice[s.deviceId] = [];
        }
        scoresByDevice[s.deviceId].push(s);
      });

      // Match users and patch missing gameStats and high scores
      const reconciledUsers = rawUsers.map(user => {
        const deviceId = user.deviceId;
        const userScoresList = scoresByDevice[deviceId] || [];
        
        const gameStats = { ...user.gameStats };
        userScoresList.forEach(s => {
          if (!gameStats[s.gameId]) {
            gameStats[s.gameId] = {
              timeSpent: 0,
              sessions: 0,
              lastPlayed: s.timestamp || Date.now(),
              highScore: s.score
            };
          } else {
            gameStats[s.gameId].highScore = Math.max(gameStats[s.gameId].highScore || 0, s.score || 0);
          }
        });

        return {
          ...user,
          gameStats
        };
      });

      // Match any device IDs in scores collection that do not have a profile yet and synthesize them
      const existingDeviceIds = new Set(reconciledUsers.map(u => u.deviceId));
      Object.entries(scoresByDevice).forEach(([deviceId, userScoresList]) => {
        if (!existingDeviceIds.has(deviceId) && userScoresList.length > 0) {
          const sample = userScoresList[0];
          const gameStats: Record<string, any> = {};
          userScoresList.forEach(s => {
            gameStats[s.gameId] = {
              timeSpent: 0,
              sessions: 0,
              lastPlayed: s.timestamp || Date.now(),
              highScore: s.score
            };
          });

          reconciledUsers.push({
            deviceId,
            username: sample.username || 'Anonymous',
            avatar: sample.avatar || 'fa-user-ninja',
            joinedAt: sample.timestamp || Date.now(),
            bio: 'Scores reconciled from raw gaming database',
            favorites: [],
            achievements: [],
            gameStats
          });
        }
      });

      return reconciledUsers;
    } catch (e) {
      console.error('Failed to run full admin users score reconciliation:', e);
      return rawUsers;
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

  async getRecentScores(limitCount: number = 50): Promise<any[]> {
    if ((this.provider === 'cloudflare' || this.provider === 'hybrid') && this.workerUrl) {
      try {
        const baseUrl = this.workerUrl.endsWith('/') ? this.workerUrl.slice(0, -1) : this.workerUrl;
        const res = await fetch(`${baseUrl}/admin/all-scores`);
        if (res.ok) {
          const scores = await res.json();
          return scores
            .sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0))
            .slice(0, limitCount);
        }
      } catch (e) {
        console.error('Cloudflare Admin Fetch Recent Scores Failed, falling back to Firebase:', e);
      }
    }

    // Firebase fallback
    try {
      const q = query(collection(db, 'scores'), orderBy('timestamp', 'desc'), limit(limitCount));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data());
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, `scores ordered by timestamp desc limit ${limitCount}`);
      return [];
    }
  }

  async deleteUser(uid: string): Promise<boolean> {
    const path = `profiles/${uid}`;
    try {
      // 1. Delete associated scores in Firestore so they don't get reconciled or synthesized later
      const scoresQ = query(collection(db, 'scores'), where('deviceId', '==', uid));
      const scoresSnap = await getDocs(scoresQ);
      for (const scoreDoc of scoresSnap.docs) {
        await deleteDoc(scoreDoc.ref);
      }

      // 2. Delete the profile document globally in Firestore
      await deleteDoc(doc(db, 'profiles', uid));

      // 3. Delete from Cloudflare D1 database if enabled
      if ((this.provider === 'cloudflare' || this.provider === 'hybrid') && this.workerUrl) {
        try {
          const baseUrl = this.workerUrl.endsWith('/') ? this.workerUrl.slice(0, -1) : this.workerUrl;
          const res = await fetch(`${baseUrl}/admin/user/${uid}`, { method: 'DELETE' });
          if (!res.ok) {
            console.warn('Cloudflare user wipe returned non-OK status code:', res.status);
          }
        } catch (e) {
          console.error('Cloudflare Admin User Wipe Failed:', e);
        }
      }

      return true;
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
      return false;
    }
  }

  async mergeDuplicateUsers(primaryId: string, duplicateIds: string[]): Promise<boolean> {
    if (!auth.currentUser) {
      console.warn('mergeDuplicateUsers called but no admin is authenticated.');
      return false;
    }

    try {
      // 1. Fetch primary profile
      const primaryRef = doc(db, 'profiles', primaryId);
      const primaryDoc = await getDoc(primaryRef);
      let primaryData = primaryDoc.exists() ? primaryDoc.data() : null;

      if (!primaryData) {
        // Synthesize if missing in Firestore
        primaryData = {
          deviceId: primaryId,
          username: 'Primary Player',
          avatar: 'fa-user-ninja',
          joinedAt: Date.now(),
          favorites: [],
          achievements: [],
          gameStats: {},
          playTime: 0
        };
      }

      // Initialize merged values starting with primaryData
      const mergedProfile = {
        username: primaryData.username || 'Anonymous',
        email: primaryData.email || null,
        avatar: primaryData.avatar || 'fa-user-ninja',
        bio: primaryData.bio || '',
        favorites: Array.isArray(primaryData.favorites) ? [...primaryData.favorites] : [],
        achievements: Array.isArray(primaryData.achievements) ? [...primaryData.achievements] : [],
        gameStats: primaryData.gameStats ? { ...primaryData.gameStats } : {},
        playTime: Number(primaryData.playTime) || 0,
        joinedAt: primaryData.joinedAt || Date.now(),
        deviceId: primaryId
      };

      // 2. Load and merge duplicate profiles
      for (const dupeId of duplicateIds) {
        const dupeRef = doc(db, 'profiles', dupeId);
        const dupeDoc = await getDoc(dupeRef);
        if (dupeDoc.exists()) {
          const dupeData = dupeDoc.data();

          // Merge fields if primary's is empty
          if (!mergedProfile.email && dupeData.email) mergedProfile.email = dupeData.email;
          if (!mergedProfile.bio && dupeData.bio) mergedProfile.bio = dupeData.bio;
          if (mergedProfile.username === 'Anonymous' && dupeData.username && dupeData.username !== 'Anonymous') {
            mergedProfile.username = dupeData.username;
          }

          // Merge lists
          if (Array.isArray(dupeData.favorites)) {
            mergedProfile.favorites = Array.from(new Set([...mergedProfile.favorites, ...dupeData.favorites]));
          }
          if (Array.isArray(dupeData.achievements)) {
            mergedProfile.achievements = Array.from(new Set([...mergedProfile.achievements, ...dupeData.achievements]));
          }

          // Merge play time
          mergedProfile.playTime += Number(dupeData.playTime) || 0;

          // Merge gameStats
          if (dupeData.gameStats) {
            Object.entries(dupeData.gameStats).forEach(([gameId, dupeStat]: [string, any]) => {
              if (mergedProfile.gameStats[gameId]) {
                const priStat = mergedProfile.gameStats[gameId];
                mergedProfile.gameStats[gameId] = {
                  highScore: Math.max(priStat.highScore || 0, dupeStat.highScore || 0),
                  sessions: (priStat.sessions || 0) + (dupeStat.sessions || 0),
                  timeSpent: (priStat.timeSpent || 0) + (dupeStat.timeSpent || 0),
                  lastPlayed: Math.max(priStat.lastPlayed || 0, dupeStat.lastPlayed || 0),
                };
              } else {
                mergedProfile.gameStats[gameId] = { ...dupeStat };
              }
            });
          }
        }
      }

      // Save merged profile to Firestore
      await setDoc(primaryRef, mergedProfile, { merge: true });

      // Save merged profile to Cloudflare D1 profiles table if enabled
      if ((this.provider === 'cloudflare' || this.provider === 'hybrid') && this.workerUrl) {
        try {
          const baseUrl = this.workerUrl.endsWith('/') ? this.workerUrl.slice(0, -1) : this.workerUrl;
          await fetch(`${baseUrl}/profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(mergedProfile)
          });
        } catch (we) {
          console.error('Failed to sync merged profile to Cloudflare D1:', we);
        }
      }

      // 3. For each duplicate user, query all score documents, merge into primary user's scores, and delete duplicate's scores
      for (const dupeId of duplicateIds) {
        try {
          const scoresQ = query(collection(db, 'scores'), where('deviceId', '==', dupeId));
          const scoresSnap = await getDocs(scoresQ);

          for (const scoreDoc of scoresSnap.docs) {
            const dupeScoreData = scoreDoc.data();
            const gameId = dupeScoreData.gameId;

            if (gameId) {
              const primaryScoreRef = doc(db, 'scores', `${gameId}_${primaryId}`);
              const primaryScoreDoc = await getDoc(primaryScoreRef);

              let mergedScore = dupeScoreData.score || 0;
              let mergedTimestamp = dupeScoreData.timestamp || Date.now();

              if (primaryScoreDoc.exists()) {
                const primaryScoreData = primaryScoreDoc.data();
                if ((primaryScoreData.score || 0) > mergedScore) {
                  mergedScore = primaryScoreData.score;
                  mergedTimestamp = primaryScoreData.timestamp || mergedTimestamp;
                } else if ((primaryScoreData.score || 0) === mergedScore) {
                  mergedTimestamp = Math.max(primaryScoreData.timestamp || 0, mergedTimestamp);
                }
              }

              // Save the merged score under the primary user's deviceId
              const finalScoreObj = {
                deviceId: primaryId,
                gameId,
                score: mergedScore,
                timestamp: mergedTimestamp,
                username: mergedProfile.username,
                avatar: mergedProfile.avatar
              };
              await setDoc(primaryScoreRef, finalScoreObj, { merge: true });

              // Sync merged score to Cloudflare D1 if enabled/provider is hybrid or cloudflare
              if ((this.provider === 'cloudflare' || this.provider === 'hybrid') && this.workerUrl) {
                try {
                  const baseUrl = this.workerUrl.endsWith('/') ? this.workerUrl.slice(0, -1) : this.workerUrl;
                  await fetch(`${baseUrl}/scores`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(finalScoreObj)
                  });
                } catch (che) {
                  console.error(`Failed to sync merged score to Cloudflare D1 for game ${gameId}:`, che);
                }
              }
            }

            // Delete duplicate's score document in Firestore
            await deleteDoc(scoreDoc.ref);
          }
        } catch (se) {
          console.error(`Failed to merge scores for duplicate user ${dupeId}:`, se);
        }

        // 4. Delete duplicate user's profile document in Firestore
        await deleteDoc(doc(db, 'profiles', dupeId));

        // Delete duplicate user's profile and scores in Cloudflare D1 (if enabled)
        if ((this.provider === 'cloudflare' || this.provider === 'hybrid') && this.workerUrl) {
          try {
            const baseUrl = this.workerUrl.endsWith('/') ? this.workerUrl.slice(0, -1) : this.workerUrl;
            await fetch(`${baseUrl}/admin/user/${dupeId}`, { method: 'DELETE' });
          } catch (we) {
            console.error(`Failed to delete duplicate user ${dupeId} from Cloudflare D1:`, we);
          }
        }
      }

      return true;
    } catch (e) {
      console.error('Failed to merge duplicate users:', e);
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

  async checkAndResolveDiscrepancies(targetWorkerUrl?: string): Promise<{
    checked: number;
    resolved: number;
    discrepancies: any[];
    logs: string[];
  }> {
    const activeUrl = targetWorkerUrl || this.workerUrl;
    const baseUrl = activeUrl.endsWith('/') ? activeUrl.slice(0, -1) : activeUrl;
    const logs: string[] = [];
    const discrepancies: any[] = [];
    let checked = 0;
    let resolved = 0;

    const addLog = (tag: string, text: string) => {
      const timeStr = new Date().toLocaleTimeString();
      logs.push(`[${timeStr}] [${tag}] ${text}`);
    };

    addLog('SYSTEM', 'Initiating neural database synchronization protocol...');

    // 1. Fetch Firestore scores
    let firestoreScores: any[] = [];
    try {
      addLog('FIREBASE', 'Fetching all score entries from Cloud Firestore database...');
      const snapshot = await getDocs(collection(db, 'scores'));
      firestoreScores = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      addLog('FIREBASE', `Read complete: ${firestoreScores.length} records retrieved from Firestore.`);
    } catch (e: any) {
      addLog('ERROR', `Firestore fetch failed: ${e.message}`);
      return { checked: 0, resolved: 0, discrepancies: [], logs };
    }

    // 2. Fetch D1 scores
    let d1Scores: any[] = [];
    if (!baseUrl) {
      addLog('WARNING', 'Cloudflare Worker URL is completely empty. Skipping cross-database matching.');
      return { checked: firestoreScores.length, resolved: 0, discrepancies: [], logs };
    }

    try {
      addLog('CLOUDFLARE', 'Fetching all score entries from Cloudflare D1 via Worker admin gateway...');
      const res = await fetch(`${baseUrl}/admin/all-scores`, {
        headers: { 'Accept': 'application/json' }
      });
      if (!res.ok) {
        throw new Error(`Worker returned status ${res.status}`);
      }
      d1Scores = await res.json();
      if (!Array.isArray(d1Scores)) {
        throw new Error('D1 response format is invalid (expected array of scores)');
      }
      addLog('CLOUDFLARE', `Read complete: ${d1Scores.length} records received from Cloudflare D1.`);
    } catch (e: any) {
      addLog('ERROR', `Cloudflare D1 fetch failed: ${e.message}`);
      addLog('SYSTEM', 'Network or credential block encountered. Aborting synchronization cycle.');
      return { checked: firestoreScores.length, resolved: 0, discrepancies: [], logs };
    }

    // Index databases by `${gameId}_${deviceId}` to identify matches and discrepancies
    const fsMap = new Map<string, any>();
    firestoreScores.forEach(s => {
      if (s.gameId && s.deviceId) {
        fsMap.set(`${s.gameId}_${s.deviceId}`, s);
      }
    });

    const d1Map = new Map<string, any>();
    d1Scores.forEach(s => {
      if (s.gameId && s.deviceId) {
        d1Map.set(`${s.gameId}_${s.deviceId}`, s);
      }
    });

    const allKeys = new Set<string>([...fsMap.keys(), ...d1Map.keys()]);
    checked = allKeys.size;
    addLog('SYSTEM', `Evaluating difference tree spanning ${checked} master scores...`);

    const syncActions: Array<{
      key: string;
      gameId: string;
      deviceId: string;
      type: 'fs_to_d1' | 'd1_to_fs';
      score: number;
      username: string;
      avatar: string;
      timestamp: number;
      detail: string;
    }> = [];

    for (const key of allKeys) {
      const fsVal = fsMap.get(key);
      const d1Val = d1Map.get(key);
      const [gameId, deviceId] = key.split('_');

      if (fsVal && !d1Val) {
        syncActions.push({
          key,
          gameId,
          deviceId,
          type: 'fs_to_d1',
          score: fsVal.score || 0,
          username: fsVal.username || 'Anonymous',
          avatar: fsVal.avatar || 'fa-user-ninja',
          timestamp: fsVal.timestamp || Date.now(),
          detail: `Firestore holds high score (${fsVal.score}), but Cloudflare D1 has no entry.`
        });
      } else if (!fsVal && d1Val) {
        syncActions.push({
          key,
          gameId,
          deviceId,
          type: 'd1_to_fs',
          score: d1Val.score || 0,
          username: d1Val.username || 'Anonymous',
          avatar: d1Val.avatar || 'fa-user-ninja',
          timestamp: d1Val.timestamp || Date.now(),
          detail: `Cloudflare D1 holds high score (${d1Val.score}), but Firestore has no entry.`
        });
      } else if (fsVal && d1Val) {
        const fsScore = fsVal.score || 0;
        const d1Score = d1Val.score || 0;

        if (fsScore > d1Score) {
          syncActions.push({
            key,
            gameId,
            deviceId,
            type: 'fs_to_d1',
            score: fsScore,
            username: fsVal.username || d1Val.username || 'Anonymous',
            avatar: fsVal.avatar || d1Val.avatar || 'fa-user-ninja',
            timestamp: fsVal.timestamp || Date.now(),
            detail: `High Score discrepancy: Firestore is higher (${fsScore}) than Cloudflare D1 (${d1Score}).`
          });
        } else if (d1Score > fsScore) {
          syncActions.push({
            key,
            gameId,
            deviceId,
            type: 'd1_to_fs',
            score: d1Score,
            username: d1Val.username || fsVal.username || 'Anonymous',
            avatar: d1Val.avatar || fsVal.avatar || 'fa-user-ninja',
            timestamp: d1Val.timestamp || Date.now(),
            detail: `High Score discrepancy: Cloudflare D1 is higher (${d1Score}) than Firestore (${fsScore}).`
          });
        }
      }
    }

    if (syncActions.length === 0) {
      addLog('SYSTEM', 'Automatic alignment confirmation complete. Both databases are 100% synchronized.');
      return { checked, resolved: 0, discrepancies: [], logs };
    }

    addLog('SYSTEM', `Discovered ${syncActions.length} record discrepancies. Executing healing protocols...`);

    for (const action of syncActions) {
      const { gameId, deviceId, score, username, avatar, timestamp, type, detail } = action;
      addLog('DISCREPANCY', `Record {Game: "${gameId}", User ID: "${deviceId}"}. ${detail}`);

      if (type === 'fs_to_d1') {
        try {
          addLog('RESOLVE', `Pushing Firestore record value (${score}) into Cloudflare D1...`);
          const pushUrl = `${baseUrl}/scores`;
          const res = await fetch(pushUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deviceId, gameId, score, timestamp })
          });
          if (res.ok) {
            addLog('SUCCESS', `Cloudflare D1 updated successfully with score ${score}.`);
            resolved++;
            discrepancies.push({
              deviceId, gameId, username, avatar,
              firestoreScore: score, cloudflareScore: null,
              status: 'resolved', resolution: 'Propagated score to Cloudflare D1'
            });
          } else {
            throw new Error(`Worker returned response ${res.status}`);
          }
        } catch (err: any) {
          addLog('ERROR', `Cloudflare update failing for {${gameId}_${deviceId}}: ${err.message}`);
          discrepancies.push({
            deviceId, gameId, username, avatar,
            firestoreScore: score, cloudflareScore: null,
            status: 'failed', resolution: `D1 post failure: ${err.message}`
          });
        }
      } else if (type === 'd1_to_fs') {
        try {
          addLog('RESOLVE', `Writing D1 record value (${score}) into Firestore...`);
          const docId = `${gameId}_${deviceId}`;
          await setDoc(doc(db, 'scores', docId), {
            deviceId,
            gameId,
            score,
            timestamp,
            username,
            avatar
          }, { merge: true });
          addLog('SUCCESS', `Firestore scores collections synchronized with score ${score}.`);
          resolved++;
          discrepancies.push({
            deviceId, gameId, username, avatar,
            firestoreScore: null, cloudflareScore: score,
            status: 'resolved', resolution: 'Propagated score to Firestore'
          });
        } catch (err: any) {
          addLog('ERROR', `Firestore write failure for {${gameId}_${deviceId}}: ${err.message}`);
          discrepancies.push({
            deviceId, gameId, username, avatar,
            firestoreScore: null, cloudflareScore: score,
            status: 'failed', resolution: `Firestore write failure: ${err.message}`
          });
        }
      }
    }

    addLog('SYSTEM', `Consensus run finished: ${resolved}/${syncActions.length} discrepancies successfully resolved.`);
    return { checked, resolved, discrepancies, logs };
  }

  async createChallenge(gameId: string, targetScore: number, userProfile: UserProfile): Promise<string> {
    const id = Math.random().toString(36).substring(2, 10).toUpperCase();
    const challengePath = `challenges/${id}`;
    
    const challengeData = {
      id,
      gameId,
      creatorUid: auth.currentUser?.uid || 'anonymous',
      creatorUsername: userProfile.username || 'Anonymous Player',
      creatorAvatar: userProfile.avatar || 'fa-user-astronaut',
      targetScore,
      createdAt: Date.now(),
      playsCount: 0,
      bestChallengerScore: 0,
      bestChallengerName: ''
    };

    try {
      await setDoc(doc(db, 'challenges', id), challengeData);
      return id;
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, challengePath);
      throw e;
    }
  }

  async getChallenge(challengeId: string): Promise<any | null> {
    const challengePath = `challenges/${challengeId}`;
    try {
      const snap = await getDoc(doc(db, 'challenges', challengeId));
      if (snap.exists()) {
        return snap.data();
      }
      return null;
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, challengePath);
      return null;
    }
  }

  async updateChallengePlay(challengeId: string, challengerScore: number, challengerName: string): Promise<boolean> {
    const challengePath = `challenges/${challengeId}`;
    try {
      const challengeRef = doc(db, 'challenges', challengeId);
      const snap = await getDoc(challengeRef);
      if (!snap.exists()) {
        console.warn('Cannot update challenge play. Challenge does not exist in Firestore:', challengeId);
        return false;
      }

      const challenge = snap.data();
      const currentPlays = challenge.playsCount || 0;
      const currentBest = challenge.bestChallengerScore || 0;

      const updateData: any = {
        playsCount: currentPlays + 1
      };

      if (challengerScore > currentBest) {
        updateData.bestChallengerScore = challengerScore;
        updateData.bestChallengerName = challengerName;
      }

      await setDoc(challengeRef, updateData, { merge: true });
      return true;
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, challengePath);
      return false;
    }
  }
}


export const cloud = new CloudService();
