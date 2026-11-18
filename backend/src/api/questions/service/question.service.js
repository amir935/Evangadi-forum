import crypto from 'node:crypto';
import { safeExecute } from '../../../../db/config.js';
import { ForbiddenError, NotFoundError } from '../../../utils/errors/index.js';

const QUESTION_SELECT = `
    SELECT q.question_id, q.question_hash, q.user_id, q.title, q.content, q.created_at, q.updated_at,
           u.first_name, u.last_name,
           (SELECT COUNT(*) FROM answers a WHERE a.question_id = q.question_id) AS answer_count
    FROM questions q
    JOIN users u ON u.user_id = q.user_id`;

const toQuestion = (row, currentUserId) => ({
    id: row.question_id,
    questionHash: row.question_hash,
    title: row.title,
    content: row.content,
    body: row.content,                 // DB column "content" → API field "body"
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    answerCount: Number(row.answer_count ?? 0),
    isMine: row.user_id === currentUserId,
    author: {
        id: row.user_id,
        firstName: row.first_name,
        lastName: row.last_name,
    },
});

const newQuestionHash = () => crypto.randomBytes(8).toString('hex');

async function createQuestionService({ userId, title, body }) {
    const cleanTitle = title.trim();
    const cleanBody = body.trim();
    const questionHash = newQuestionHash();

    await safeExecute(
        `INSERT INTO questions (question_hash, user_id, title, content)
         VALUES (?, ?, ?, ?)`,
        [questionHash, userId, cleanTitle, cleanBody],
    );

    const rows = await safeExecute(`${QUESTION_SELECT} WHERE q.question_hash = ?`, [questionHash]);
    return toQuestion(rows[0], userId);
}

function clampLimit(value, fallback, max) {
    const n = parseInt(value, 10);
    if (isNaN(n) || n < 1) {
        return fallback;
    }
    return Math.min(max, n);
}

async function listQuestionsService({ userId, search, mine, limit }) {
    const where = [];
    const params = [];

    if (mine) {
        where.push('q.user_id = ?');
        params.push(userId);
    }
    if (search) {
        where.push('(q.title LIKE ? OR q.content LIKE ?)');
        params.push(`%${search}%`, `%${search}%`);
    }

    const sql =
        QUESTION_SELECT +
        (where.length ? ` WHERE ${where.join(' AND ')}` : '') +
        ' ORDER BY q.created_at DESC, q.question_id DESC' +
        ` LIMIT ${clampLimit(limit, 100, 200)}`;

    const rows = await safeExecute(sql, params);
    return rows.map(row => toQuestion(row, userId));
}

/**
 * Get Single Question with associated answers
 */
async function getSingleQuestionService({ questionHash, currentUserId }) {
    const questionRows = await safeExecute(
        `${QUESTION_SELECT} WHERE q.question_hash = ?`,
        [questionHash]
    );

    if (!questionRows || questionRows.length === 0) {
        throw new NotFoundError('Question not found');
    }

    const q = questionRows[0];

    const answerRows = await safeExecute(
        `SELECT a.answer_id, a.question_id, a.content, a.created_at, a.updated_at,
                u.user_id, u.first_name, u.last_name
         FROM answers a
         JOIN users u ON u.user_id = a.user_id
         WHERE a.question_id = ?
         ORDER BY a.created_at ASC`,
        [q.question_id]
    );

    const question = {
        id: q.question_id,
        questionHash: q.question_hash,
        title: q.title,
        content: q.content,
        body: q.content,
        answerCount: answerRows.length,
        createdAt: q.created_at,
        updatedAt: q.updated_at,
        isMine: q.user_id === currentUserId,
        author: {
            id: q.user_id,
            firstName: q.first_name,
            lastName: q.last_name,
        },
    };

    const answers = answerRows.map(row => ({
        id: row.answer_id,
        questionId: row.question_id,
        content: row.content,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        isMine: row.user_id === currentUserId,
        author: {
            id: row.user_id,
            firstName: row.first_name,
            lastName: row.last_name,
        },
    }));

    return {
        question,
        answers,
        answersMeta: {
            limit: 100,
            total: answers.length,
        },
    };
}

function cosineSimilarity(vecA, vecB) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Get Similar Questions
 */
async function getSimilarQuestionsService({ questionHash, k = 5, threshold = 0.75, currentUserId }) {
    const qRows = await safeExecute(
        `SELECT question_id FROM questions WHERE question_hash = ?`,
        [questionHash]
    );

    if (!qRows || qRows.length === 0) {
        throw new NotFoundError('Question not found');
    }

    const sourceQuestionId = qRows[0].question_id;

    // Check if source vector exists
    let matches = [];
    try {
        const sourceVectorRows = await safeExecute(
            `SELECT embedding FROM question_vectors WHERE question_id = ? AND status = 'ready'`,
            [sourceQuestionId]
        );

        if (sourceVectorRows && sourceVectorRows.length > 0) {
            const rawSource = sourceVectorRows[0].embedding;
            const sourceVec = typeof rawSource === 'string' ? JSON.parse(rawSource) : rawSource;

            const otherVectorRows = await safeExecute(
                `SELECT qv.question_id, qv.embedding
                 FROM question_vectors qv
                 WHERE qv.question_id != ? AND qv.status = 'ready'`,
                [sourceQuestionId]
            );

            for (const row of otherVectorRows) {
                const vec = typeof row.embedding === 'string' ? JSON.parse(row.embedding) : row.embedding;
                const score = cosineSimilarity(sourceVec, vec);
                if (score >= threshold) {
                    matches.push({ questionId: row.question_id, score: parseFloat(score.toFixed(2)) });
                }
            }

            matches.sort((a, b) => b.score - a.score);
            matches = matches.slice(0, k);
        }
    } catch {
        // question_vectors query error, proceed with fallback
    }

    let results = [];
    if (matches.length > 0) {
        const ids = matches.map(m => m.questionId);
        const placeholders = ids.map(() => '?').join(',');
        const hydratedRows = await safeExecute(
            `${QUESTION_SELECT} WHERE q.question_id IN (${placeholders})`,
            ids
        );

        const rowMap = new Map();
        for (const row of hydratedRows) {
            rowMap.set(row.question_id, row);
        }

        for (const match of matches) {
            const row = rowMap.get(match.questionId);
            if (row) {
                results.push({
                    id: row.question_id,
                    questionHash: row.question_hash,
                    title: row.title,
                    content: row.content,
                    answerCount: Number(row.answer_count ?? 0),
                    createdAt: row.created_at,
                    updatedAt: row.updated_at,
                    author: {
                        id: row.user_id,
                        firstName: row.first_name,
                        lastName: row.last_name,
                    },
                    score: match.score,
                });
            }
        }
    }

    // Fallback: if no vector matches found, return recent questions other than this one
    if (results.length === 0) {
        const recentRows = await safeExecute(
            `${QUESTION_SELECT} WHERE q.question_id != ? ORDER BY q.created_at DESC LIMIT ?`,
            [sourceQuestionId, k]
        );
        results = recentRows.map(row => ({
            id: row.question_id,
            questionHash: row.question_hash,
            title: row.title,
            content: row.content,
            answerCount: Number(row.answer_count ?? 0),
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            author: {
                id: row.user_id,
                firstName: row.first_name,
                lastName: row.last_name,
            },
            score: 0.8,
        }));
    }

    return {
        data: results,
        meta: {
            total: results.length,
            k,
            threshold,
            query: null,
            questionHash,
        },
    };
}


async function findOwnedQuestion(questionHash, userId) {
    const [row] = await safeExecute(
        'SELECT question_id, user_id FROM questions WHERE question_hash = ? LIMIT 1',
        [questionHash],
    );

    if (!row) throw new NotFoundError("Question not found.");
    if (row.user_id !== userId) throw new ForbiddenError('You can only change your own question.');

    return row;


}

async function updateQuestionService({ userId, questionHash, title, body }) {
    await findOwnedQuestion(questionHash, userId);

    await safeExecute(
        'UPDATE questions SET title = ?, content = ? WHERE question_hash = ?', // DB column is `content`
        [title.trim(), body.trim(), questionHash],
    );

    const rows = await safeExecute(
        `${QUESTION_SELECT} WHERE q.question_hash = ?`, [questionHash]
    );

    return toQuestion(rows[0], userId);






}

async function deleteQuestionService({ userId, questionHash }) {
    const row = await findOwnedQuestion(questionHash, userId);
    await safeExecute('DELETE FROM questions WHERE question_id = ?', [row.question_id]);
}

export {
    createQuestionService,
    listQuestionsService,
    getSingleQuestionService,
    getSimilarQuestionsService,
    clampLimit,
    updateQuestionService,
    deleteQuestionService
};


