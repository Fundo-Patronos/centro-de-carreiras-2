import axios from 'axios';

// Public API instance (no auth required, no Firebase dependency)
const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Lazy load authenticated API to avoid Firebase initialization on public pages
let _api = null;
const getApi = async () => {
  if (!_api) {
    const module = await import('./api');
    _api = module.default;
  }
  return _api;
};

export const feedbackService = {
  /**
   * Get feedback request info by token (public)
   * @param {string} token - The feedback token from the URL
   * @returns {Promise<Object>} Feedback request info
   */
  async getFeedbackRequestInfo(token) {
    const response = await publicApi.get(`/feedback/request/${token}`);
    return response.data;
  },

  /**
   * Submit feedback response (public)
   * @param {Object} data - Feedback submission data
   * @param {string} data.token - The feedback token
   * @param {string} data.meeting_status - 'happened', 'scheduled', or 'not_happened'
   * @param {string} [data.no_meeting_reason] - Reason if meeting didn't happen
   * @param {number} [data.rating] - Rating 1-5 if meeting happened
   * @param {string} [data.additional_feedback] - Optional additional feedback
   * @returns {Promise<Object>} Success response
   */
  async submitFeedback(data) {
    const response = await publicApi.post('/feedback/submit', data);
    return response.data;
  },

  /**
   * Send feedback emails for a session (admin only)
   * @param {string} sessionId - The session ID
   * @returns {Promise<Object>} Send result
   */
  async sendFeedbackEmails(sessionId) {
    const api = await getApi();
    const response = await api.post('/feedback/send', { session_id: sessionId });
    return response.data;
  },

  /**
   * Get all sessions with feedback status (admin only)
   * @returns {Promise<Object>} List of sessions with feedback
   */
  async getAllFeedback() {
    const api = await getApi();
    const response = await api.get('/admin/feedback');
    return response.data;
  },

  /**
   * Get feedback for a specific session (admin only)
   * @param {string} sessionId - The session ID
   * @returns {Promise<Object>} Session feedback details
   */
  async getSessionFeedback(sessionId) {
    const api = await getApi();
    const response = await api.get(`/admin/feedback/${sessionId}`);
    return response.data;
  },
};

export default feedbackService;
