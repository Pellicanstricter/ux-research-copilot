const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = {
  /**
   * Upload and process files
   * @param {FileList} files - Files to upload
   * @returns {Promise<Object>} Response with session_id
   */
  async processFiles(files) {
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });

    const response = await fetch(`${API_BASE_URL}/api/v1/process-files`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || `Upload failed: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Get processing status
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>} Status information
   */
  async getStatus(sessionId) {
    const response = await fetch(`${API_BASE_URL}/api/v1/session/${sessionId}/status`);

    if (!response.ok) {
      throw new Error(`Status check failed: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Get results for a completed session
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>} Analysis results
   */
  async getResults(sessionId) {
    const response = await fetch(`${API_BASE_URL}/api/v1/session/${sessionId}/results`);

    if (!response.ok) {
      throw new Error(`Failed to get results: ${response.statusText}`);
    }

    return response.json();
  },
};
