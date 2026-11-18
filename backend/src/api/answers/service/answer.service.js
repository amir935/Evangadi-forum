import { safeExecute } from '../../../../db/config.js';
import { BadRequestError, NotFoundError } from '../../../utils/errors/index.js';

/**
 * Create a new answer to a question.
 */
export async function createAnswerService({ questionId, content, userId }) {
  const cleanContent = content.trim();

  // 1. Fetch Question from DB
  const questionRows = await safeExecute(
    `SELECT question_id, user_id FROM questions WHERE question_id = ?`,
    [questionId]
  );

  if (!questionRows || questionRows.length === 0) {
    throw new NotFoundError('Question not found');
  }

  const question = questionRows[0];

  // 2. Prevent answering own question
  if (question.user_id === userId) {
    throw new BadRequestError('You cannot answer your own question');
  }

  // 3. Insert answer into answers table
  const insertResult = await safeExecute(
    `INSERT INTO answers (question_id, user_id, content) VALUES (?, ?, ?)`,
    [questionId, userId, cleanContent]
  );

  const answerId = insertResult.insertId;

  // 4. Fetch formatted answer data
  const answerRows = await safeExecute(
    `SELECT a.answer_id, a.question_id, a.content, a.created_at, a.updated_at,
            u.user_id, u.first_name, u.last_name
     FROM answers a
     JOIN users u ON u.user_id = a.user_id
     WHERE a.answer_id = ?`,
    [answerId]
  );

  if (!answerRows || answerRows.length === 0) {
    throw new NotFoundError('Created answer could not be retrieved');
  }

  const row = answerRows[0];

  return {
    id: row.answer_id,
    questionId: row.question_id,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    author: {
      id: row.user_id,
      firstName: row.first_name,
      lastName: row.last_name,
    },
  };
};

const findOwnedAnswer = async (answerId, userId) => {
  const [row] = await safeExecute('SELECT answer_id, user_id FROM answers WHERE answer_id = ? LIMIT 1', [answerId]);
  if (!row) throw new NotFoundError('Answer not found.');
  if (row.user_id !== userId) throw new ForbiddenError('You can only change your own answer.');
  return row;
};

export const updateAnswerService = async ({ userId, answerId, answerBody }) => {
  await findOwnedAnswer(answerId, userId);
  await safeExecute('UPDATE answers SET content = ? WHERE answer_id = ?', [answerBody.trim(), answerId]);
  const [a] = await safeExecute(
    `SELECT a.answer_id, a.user_id, a.content, a.created_at, u.first_name, u.last_name
         FROM answers a JOIN users u ON u.user_id = a.user_id WHERE a.answer_id = ?`,
    [answerId],
  );
  return {
    id: a.answer_id, body: a.content, createdAt: a.created_at, isMine: true,
    author: { id: a.user_id, firstName: a.first_name, lastName: a.last_name },
  };
};

export const deleteAnswerService = async ({ userId, answerId }) => {
  await findOwnedAnswer(answerId, userId);
  await safeExecute('DELETE FROM answers WHERE answer_id = ?', [answerId]);
};
