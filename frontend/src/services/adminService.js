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
   * Resend verification email to a user with pending_verification status
   * @param {string} uid - User's Firebase UID
   * @returns {Promise<{success: boolean, message: string, uid: string}>}
   */
  async resendVerificationEmail(uid) {
    const response = await api.post(`/admin/users/${uid}/resend-verification`);
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

  /**
   * Export all users to CSV
   * Downloads the CSV file directly
   */
  async exportUsersCSV() {
    const response = await api.get('/admin/users/export', {
      responseType: 'blob',
    });

    // Extract filename from Content-Disposition header or use default
    const contentDisposition = response.headers['content-disposition'];
    let filename = 'usuarios.csv';
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename=(.+)/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  /**
   * Export all mentors to CSV
   * Downloads the CSV file directly
   */
  async exportMentorsCSV() {
    const response = await api.get('/admin/mentors/export', {
      responseType: 'blob',
    });

    // Extract filename from Content-Disposition header or use default
    const contentDisposition = response.headers['content-disposition'];
    let filename = 'mentores.csv';
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename=(.+)/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

export default adminService;
