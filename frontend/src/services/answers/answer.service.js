import { apiClient } from '../core/api.client.js';

/**
 * Post a new answer for a question.
 * @param {number} questionId - ID of the question being answered
 * @param {string} content - Markdown content of the answer (min 20 characters)
 */
export async function postAnswer(questionId, content) {
  try {
    const response = await apiClient.post('/api/answers', {
      questionId,
      content,
    });
    return response.data.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.msg ||
      'Failed to post answer. Please try again.';
    throw new Error(message);
  }
}
