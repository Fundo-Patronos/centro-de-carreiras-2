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
   * @param {string} mentorId - Firestore user ID
   * @returns {Promise<Object>}
   */
  async getMentor(mentorId) {
    const response = await api.get(`/mentors/${mentorId}`);
    return response.data;
  },

  /**
   * Get the current mentor's own profile
   * @returns {Promise<Object>}
   */
  async getMyProfile() {
    const response = await api.get('/mentors/me');
    return response.data;
  },

  /**
   * Update the current mentor's profile
   * @param {Object} data - Profile fields to update
   * @returns {Promise<Object>}
   */
  async updateMyProfile(data) {
    const response = await api.put('/mentors/me', data);
    return response.data;
  },

  /**
   * Upload a profile photo
   * @param {File} file - Image file to upload
   * @returns {Promise<{success: boolean, photoURL: string}>}
   */
  async uploadPhoto(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/mentors/me/photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default mentorService;
