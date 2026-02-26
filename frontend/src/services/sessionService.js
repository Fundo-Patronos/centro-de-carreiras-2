import api from './api';

export const sessionService = {
  /**
   * Create a new session request
   * @param {Object} data - Session data
   * @param {string} data.mentor_id - Airtable record ID
   * @param {string} data.mentor_name - Mentor's name
   * @param {string} data.mentor_email - Mentor's email
   * @param {string} data.mentor_company - Mentor's company
   * @param {string} data.message - Student's message
   * @returns {Promise<Object>} Created session
   */
  async createSession(data) {
    const response = await api.post('/sessions', data);
    return response.data;
  },

  /**
   * Get all sessions for the current user
   * @param {string} [status] - Optional status filter (pending, confirmed, completed, cancelled)
   * @returns {Promise<{sessions: Array, total: number}>}
   */
  async getMySessions(status = null) {
    const params = status ? { status } : {};
    const response = await api.get('/sessions', { params });
    return response.data;
  },

  /**
   * Get a single session by ID
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>}
   */
  async getSession(sessionId) {
    const response = await api.get(`/sessions/${sessionId}`);
    return response.data;
  },

  /**
   * Update session status
   * @param {string} sessionId - Session ID
   * @param {string} status - New status ("pending" or "completed")
   * @returns {Promise<Object>} Updated session
   */
  async updateSessionStatus(sessionId, status) {
    const response = await api.patch(`/sessions/${sessionId}/status`, { status });
    return response.data;
  },

  /**
   * Resend session email to mentor
   * @param {string} sessionId - Session ID
   * @param {string} message - Updated message to send
   * @returns {Promise<Object>} Result with success flag
   */
  async resendSessionEmail(sessionId, message) {
    const response = await api.post(`/sessions/${sessionId}/resend`, { message });
    return response.data;
  },

  /**
   * Submit feedback for a session
   * @param {string} sessionId - Session ID
   * @param {Object} feedback - Feedback data
   * @param {number} feedback.rating - Rating 1-5
   * @param {string} [feedback.comments] - Optional comments
   * @returns {Promise<Object>} Result with success flag
   */
  async submitFeedback(sessionId, feedback) {
    const response = await api.post(`/sessions/${sessionId}/feedback`, feedback);
    return response.data;
  },

  /**
   * Complete a session with feedback (atomic operation)
   * Marks session as completed and submits feedback in one request.
   * Also sends email notification to the other party.
   * @param {string} sessionId - Session ID
   * @param {Object} data - Completion data
   * @param {number} data.rating - Rating 1-5
   * @param {string} [data.comments] - Optional comments
   * @returns {Promise<Object>} Updated session
   */
  async completeSessionWithFeedback(sessionId, data) {
    const response = await api.post(`/sessions/${sessionId}/complete`, data);
    return response.data;
  },
};

export default sessionService;
