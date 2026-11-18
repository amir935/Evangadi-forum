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

export async function getSingleQuestion(questionHash) {
  try {
    const response = await apiClient.get(`/api/questions/${questionHash}`);
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.msg ||
      'Failed to load question details.';
    throw new Error(message);
  }
}

export async function assessAnswerFit(questionHash, answerText) {
  try {
    const response = await apiClient.post(`/api/questions/${questionHash}/answer-fit`, {
      answerText,
    });
    return response.data.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.msg ||
      'Failed to assess answer fit.';
    throw new Error(message);
  }
}

export async function getSimilarQuestions(questionHash) {
  try {
    const response = await apiClient.get(`/api/questions/${questionHash}/similar`);
    return response.data.data || [];
  } catch {
    return [];
  }
}

