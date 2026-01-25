import api from './api';

export const verificationService = {
  /**
   * Send or resend verification email
   * Requires authenticated user with pending_verification status
   * @returns {Promise<{message: string}>}
   */
  async sendVerificationEmail() {
    const response = await api.post('/auth/send-verification-email');
    return response.data;
  },

  /**
   * Verify email token and activate user account
   * Public endpoint - no authentication required
   * @param {string} token - The verification token from the URL
   * @returns {Promise<{message: string, email: string, role: string}>}
   */
  async verifyEmailToken(token) {
    const response = await api.post('/auth/verify-email-token', { token });
    return response.data;
  },
};

export default verificationService;
