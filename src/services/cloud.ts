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
  constructor() {
    this.testConnection();
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
    const path = `scores/${gameId}_${uid}`;
    
    try {
      await setDoc(doc(db, 'scores', `${gameId}_${uid}`), {
        deviceId: uid,
        gameId,
        score,
        timestamp: Date.now(),
        username: userProfile.username,
        avatar: userProfile.avatar
      }, { merge: true });
      return true;
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
      return false;
    }
  }

  async getGlobalHighScores(gameId: string): Promise<any[]> {
    const path = 'scores';
    try {
      let q;
      if (gameId === 'all') {
        // For 'all', we might need a different aggregation or just show top overall scores
        // The previous worker had a special endpoint for this.
        // In Firestore, we'll just query all scores and sort by score.
        q = query(
          collection(db, 'scores'),
          orderBy('score', 'desc'),
          limit(10)
        );
      } else {
        q = query(
          collection(db, 'scores'),
          where('gameId', '==', gameId),
          orderBy('score', 'desc'),
          limit(10)
        );
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
    const path = `profiles/${uid}`;
    
    try {
      await setDoc(doc(db, 'profiles', uid), {
        ...profile,
        joinedAt: profile.joinedAt || Date.now()
      }, { merge: true });
      return true;
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
      return false;
    }
  }

  async getProfile(): Promise<UserProfile | null> {
    if (!auth.currentUser) return null;
    const uid = auth.currentUser.uid;
    const path = `profiles/${uid}`;
    
    try {
      const snapshot = await getDoc(doc(db, 'profiles', uid));
      return snapshot.exists() ? snapshot.data() as UserProfile : null;
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, path);
      return null;
    }
  }

  isAdmin(): boolean {
    if (!auth.currentUser || !auth.currentUser.email) return false;
    return auth.currentUser.email.toLowerCase() === 'kmasroor50@gmail.com'.toLowerCase();
  }

  // --- Admin Methods (Simplified for Firebase) ---

  async getAdminSummary(): Promise<any> {
    // Note: Firestore doesn't provide easy counts without extensions or extra docs
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

  async migrateFromWorker(workerUrl: string): Promise<{ success: number, failed: number, total: number }> {
    try {
      const response = await fetch(`${workerUrl}/api/scores`);
      if (!response.ok) throw new Error(`Worker responded with ${response.status}`);
      
      const scores = await response.json();
      if (!Array.isArray(scores)) throw new Error('Invalid data format from worker');

      let successCount = 0;
      let failedCount = 0;

      // Firestore batch limit is 500, but we'll do them sequentially for simplicity and error tracking
      // or we can use a loop with chunks. Let's do a simple loop for now.
      for (const s of scores) {
        try {
          // Map worker fields to Firestore fields if necessary
          // Worker: { gameId, score, username, avatar, deviceId, timestamp }
          // Firestore: { gameId, score, username, avatar, deviceId, timestamp }
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

      return { success: successCount, failed: failedCount, total: scores.length };
    } catch (e) {
      console.error('Migration failed:', e);
      throw e;
    }
  }
}


export const cloud = new CloudService();
