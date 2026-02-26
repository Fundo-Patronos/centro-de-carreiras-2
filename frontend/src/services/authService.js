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
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
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
   * Send password reset email via backend (custom email template)
   * @param {string} email
   */
  async sendPasswordReset(email) {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
    const response = await fetch(`${apiUrl}/auth/request-password-reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Erro ao enviar email de redefinição de senha');
    }

    return response.json();
  },

  /**
   * Send password reset email via Firebase (fallback)
   * @param {string} email
   */
  async sendPasswordResetFirebase(email) {
    await sendPasswordResetEmail(auth, email, passwordResetSettings);
  },

  /**
   * Change password for logged-in user
   * Requires re-authentication with current password
   * @param {string} currentPassword
   * @param {string} newPassword
   */
  async changePassword(currentPassword, newPassword) {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    if (!user.email) {
      throw new Error('Usuário não possui email');
    }

    // Re-authenticate user with current password
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    // Update password
    await updatePassword(user, newPassword);
  },

  /**
   * Get the auth provider for the current user
   * @returns {string|null} Provider ID (e.g., 'password', 'google.com')
   */
  getAuthProvider() {
    const user = auth.currentUser;
    if (!user || !user.providerData || user.providerData.length === 0) {
      return null;
    }
    return user.providerData[0].providerId;
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
