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
};

export default sessionService;
