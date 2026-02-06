import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';

// Magic link settings
const actionCodeSettings = {
  url: `${window.location.origin}/auth/verify`,
  handleCodeInApp: true,
};

// Password reset settings
const passwordResetSettings = {
  url: `${window.location.origin}/auth/action`,
  handleCodeInApp: true,
};

export const authService = {
  // ==========================================
  // Email/Password Authentication
  // ==========================================

  /**
   * Create new user with email and password
   * @param {string} email
   * @param {string} password
   * @param {string} displayName
   * @returns {Promise<User>}
   */
  async signUpWithEmail(email, password, displayName) {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName });
    return result.user;
  },

  /**
   * Sign in existing user with email and password
   * @param {string} email
   * @param {string} password
   * @returns {Promise<User>}
   */
  async signInWithEmail(email, password) {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  },

  // ==========================================
  // Google OAuth Authentication
  // ==========================================

  /**
   * Sign in with Google popup
   * @returns {Promise<User>}
   */
  async signInWithGoogle() {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  },

  // ==========================================
  // Magic Link (Passwordless) Authentication
  // ==========================================

  /**
   * Send magic link to email
   * @param {string} email
   * @param {string} role - 'estudante' or 'mentor' - stored for retrieval after redirect
   */
  async sendMagicLink(email, role) {
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    // Store email and role for retrieval after redirect
    window.localStorage.setItem('emailForSignIn', email);
    window.localStorage.setItem('roleForSignIn', role);
  },

  /**
   * Complete magic link sign in after user clicks link
   * @param {string} email
   * @param {string} url - Current page URL containing the magic link
   * @returns {Promise<{user: User, role: string}>}
   */
  async completeMagicLinkSignIn(email, url) {
    if (!isSignInWithEmailLink(auth, url)) {
      throw new Error('Link inválido');
    }

    const result = await signInWithEmailLink(auth, email, url);
    const role = window.localStorage.getItem('roleForSignIn') || 'estudante';

    // Clean up localStorage
    window.localStorage.removeItem('emailForSignIn');
    window.localStorage.removeItem('roleForSignIn');

    return { user: result.user, role };
  },

  /**
   * Check if current URL is a magic link
   * @param {string} url
   * @returns {boolean}
   */
  isEmailLink(url) {
    return isSignInWithEmailLink(auth, url);
  },

  /**
   * Get stored email for magic link flow
   * @returns {string|null}
   */
  getStoredEmail() {
    return window.localStorage.getItem('emailForSignIn');
  },

  /**
   * Get stored role for magic link flow
   * @returns {string|null}
   */
  getStoredRole() {
    return window.localStorage.getItem('roleForSignIn');
  },

  // ==========================================
  // Password Reset
  // ==========================================

  /**
   * Send password reset email
   * @param {string} email
   */
  async sendPasswordReset(email) {
    await sendPasswordResetEmail(auth, email, passwordResetSettings);
  },

  // ==========================================
  // Session Management
  // ==========================================

  /**
   * Sign out current user
   */
  async logout() {
    await signOut(auth);
  },

  /**
   * Get current user
   * @returns {User|null}
   */
  getCurrentUser() {
    return auth.currentUser;
  },

  /**
   * Get ID token for API requests
   * @returns {Promise<string|null>}
   */
  async getIdToken() {
    const user = auth.currentUser;
    if (user) {
      return await user.getIdToken();
    }
    return null;
  },
};

export default authService;
