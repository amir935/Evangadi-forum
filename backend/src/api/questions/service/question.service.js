import crypto from 'node:crypto';
import { GoogleGenAI } from '@google/genai';
import { safeExecute } from '../../../../db/config.js';

const QUESTION_SELECT = `
    SELECT q.question_id, q.question_hash, q.user_id, q.title, q.content,
           q.created_at, q.updated_at, u.first_name, u.last_name,
           (SELECT COUNT(*) FROM answers a WHERE a.question_id = q.question_id) AS answer_count
    FROM questions q
    JOIN users u ON u.user_id = q.user_id`;


const toQuestion = (row, currentUserId) => (
    {
        id: row.question_id,
        questionHash: row.question_hash,
        title: row.title,
        content: row.content,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        answerCount: Number(row.answer_count ?? 0),
        isMine: row.user_id === currentUserId,
        userId: row.user_id,
        author: {
            id: row.user_id,
            firstName: row.first_name,
            lastName: row.last_name,
        },
    }
);

const newQuestionHash = () => crypto.randomBytes(8).toString('hex');

async function createQuestionEmbedding(sourceText) {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is not configured');
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.embedContent({
        model: process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001',
        contents: sourceText,
        config: { taskType: 'RETRIEVAL_DOCUMENT' },
    });
    const embedding = response.embeddings?.[0]?.values;

    if (!embedding?.length) {
        throw new Error('Gemini returned an empty question embedding');
    }

    return embedding;
}

async function createQuestionService({ userId, title, content }) {
    const cleanTitle = title.trim();
    const cleanContent = content.trim();
    const questionHash = newQuestionHash();

    const result = await safeExecute(
        `INSERT INTO questions (question_hash, user_id, title, content)
         VALUES (?, ?, ?, ?)`,
        [questionHash, userId, cleanTitle, cleanContent],
    );

    let embedding = [];
    let status = 'ready';
    const sourceText = cleanTitle;

    try {
        embedding = await createQuestionEmbedding(sourceText);
    } catch (error) {
        status = 'failed';
        console.error('Unable to generate question embedding:', error.message);
    }

    await safeExecute(
        `INSERT INTO question_vectors (question_id, source_text, embedding, status)
         VALUES (?, ?, ?, ?)`,
        [result.insertId, sourceText, JSON.stringify(embedding), status],
    );

    const rows = await safeExecute(
        `${QUESTION_SELECT} WHERE q.question_id = ?`,
        [result.insertId],
    );
    return toQuestion(rows[0], userId);
}

function clampLimit(value, fallback, max) {
    const n = parseInt(value);

    if ((isNaN(n)) || n < 1) {
        return fallback
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

export { createQuestionService, listQuestionsService, clampLimit };