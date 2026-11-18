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

// ---------- edit / delete (owner only; backend answers 403 for anyone else) ----------
const errorMessage = (error, fallback) =>
  error.response?.data?.msg || error.response?.data?.message || fallback;

/** PATCH /api/answers/:answerId  body: { body } → the updated answer */
export async function updateAnswer(answerId, body) {
  try {
    const response = await apiClient.patch(`/api/answers/${answerId}`, { body });
    return response.data.answer;
  } catch (error) {
    throw new Error(errorMessage(error, 'Could not save your answer.'));
  }
}

/** DELETE /api/answers/:answerId */
export async function deleteAnswer(answerId) {
  try {
    await apiClient.delete(`/api/answers/${answerId}`);
  } catch (error) {
    throw new Error(errorMessage(error, 'Could not delete your answer.'));
  }
}
