import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export const userService = {
  /**
   * Create user profile in Firestore
   * @param {string} uid - Firebase Auth UID
   * @param {Object} userData - User data
   * @param {string} userData.email
   * @param {string} userData.displayName
   * @param {string|null} userData.photoURL
   * @param {string} userData.role - 'estudante' or 'mentor'
   * @param {string} userData.authProvider - 'email', 'google', or 'magic_link'
   */
  async createUserProfile(uid, userData) {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, {
      uid,
      email: userData.email,
      displayName: userData.displayName,
      photoURL: userData.photoURL || null,
      role: userData.role,
      status: 'active',
      authProvider: userData.authProvider,
      profile: {
        phone: null,
        linkedIn: null,
        bio: null,
        // Estudante fields
        course: null,
        graduationYear: null,
        // Mentor fields
        company: null,
        position: null,
        expertise: [],
      },
      emailNotifications: true,
      language: 'pt-BR',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    });
  },

  /**
   * Get user profile from Firestore
   * @param {string} uid - Firebase Auth UID
   * @returns {Promise<Object|null>}
   */
  async getUserProfile(uid) {
    const userRef = doc(db, 'users', uid);
    const snapshot = await getDoc(userRef);
    if (snapshot.exists()) {
      return { uid: snapshot.id, ...snapshot.data() };
    }
    return null;
  },

  /**
   * Check if user profile exists
   * @param {string} uid - Firebase Auth UID
   * @returns {Promise<boolean>}
   */
  async userProfileExists(uid) {
    const userRef = doc(db, 'users', uid);
    const snapshot = await getDoc(userRef);
    return snapshot.exists();
  },

  /**
   * Update user profile in Firestore
   * @param {string} uid - Firebase Auth UID
   * @param {Object} updates - Fields to update
   */
  async updateUserProfile(uid, updates) {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },

  /**
   * Update last login timestamp
   * @param {string} uid - Firebase Auth UID
   */
  async updateLastLogin(uid) {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      lastLoginAt: serverTimestamp(),
    });
  },

  /**
   * Subscribe to user profile changes (real-time)
   * @param {string} uid - Firebase Auth UID
   * @param {Function} callback - Called with user data on changes
   * @returns {Function} Unsubscribe function
   */
  subscribeToUserProfile(uid, callback) {
    const userRef = doc(db, 'users', uid);
    return onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        callback({ uid: snapshot.id, ...snapshot.data() });
      } else {
        callback(null);
      }
    });
  },
};

export default userService;
