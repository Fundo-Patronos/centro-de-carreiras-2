import api from './api';

export const mentorService = {
  /**
   * Get all mentors from the API
   * @returns {Promise<{mentors: Array, total: number}>}
   */
  async getMentors() {
    const response = await api.get('/mentors');
    return response.data;
  },

  /**
   * Get a single mentor by ID
   * @param {string} mentorId - Airtable record ID
   * @returns {Promise<Object>}
   */
  async getMentor(mentorId) {
    const response = await api.get(`/mentors/${mentorId}`);
    return response.data;
  },
};

export default mentorService;
