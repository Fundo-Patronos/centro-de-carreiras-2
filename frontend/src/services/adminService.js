import api from './api';

export const adminService = {
  /**
   * Get all pending users awaiting approval
   * @returns {Promise<{users: Array, total: number}>}
   */
  async getPendingUsers() {
    const response = await api.get('/admin/users/pending');
    return response.data;
  },

  /**
   * Approve a pending user
   * @param {string} uid - User's Firebase UID
   * @returns {Promise<{success: boolean, message: string, uid: string, new_status: string}>}
   */
  async approveUser(uid) {
    const response = await api.patch(`/admin/users/${uid}/approve`);
    return response.data;
  },

  /**
   * Reject a pending user
   * @param {string} uid - User's Firebase UID
   * @returns {Promise<{success: boolean, message: string, uid: string, new_status: string}>}
   */
  async rejectUser(uid) {
    const response = await api.patch(`/admin/users/${uid}/reject`);
    return response.data;
  },

  /**
   * Get all mentors for admin management
   * @returns {Promise<{mentors: Array, total: number}>}
   */
  async getMentors() {
    const response = await api.get('/admin/mentors');
    return response.data;
  },

  /**
   * Update mentor visibility
   * @param {string} uid - Mentor's Firebase UID
   * @param {boolean} isActive - Whether mentor should be visible
   * @returns {Promise<Object>}
   */
  async updateMentorVisibility(uid, isActive) {
    const response = await api.patch(`/admin/mentors/${uid}/visibility`, { isActive });
    return response.data;
  },
};

export default adminService;
