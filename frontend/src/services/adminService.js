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
};

export default adminService;
