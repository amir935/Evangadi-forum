import { apiClient } from '../core/api.client.js';

export async function createQuestion({ title, content }) {
  try {
    const response = await apiClient.post('/api/questions', { title, content });
    return response.data.data;
  } catch (error) {
    const message =
      error.response?.data?.msg ||
      error.response?.data?.message ||
      (error.code === 'ECONNABORTED'
        ? 'The request timed out. Please try again.'
        : 'Unable to post your question. Please try again.');
    throw new Error(message);
  }
}
