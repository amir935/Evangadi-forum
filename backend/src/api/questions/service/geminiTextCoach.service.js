import { GoogleGenAI } from '@google/genai';
import { safeExecute } from '../../../../db/config.js';
import { NotFoundError } from '../../../utils/errors/index.js';

/**
 * Fallback heuristic when Gemini API is unavailable or unconfigured.
 */
function heuristicAnswerFit(questionTitle, questionContent, answerText) {
  const qText = `${questionTitle} ${questionContent}`.toLowerCase();
  const qWords = new Set(
    qText
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3)
  );

  const aWords = answerText
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3);

  let matchCount = 0;
  for (const word of aWords) {
    if (qWords.has(word)) {
      matchCount++;
    }
  }

  const length = answerText.trim().length;

  if (matchCount >= 4 && length >= 80) {
    return {
      level: 'strong',
      note: 'Your answer is highly relevant and addresses the core topics raised in the question.',
    };
  }

  if (matchCount >= 2 || length >= 60) {
    return {
      level: 'partial',
      note: 'Your answer touches on relevant points, but consider elaborating with more specific steps or examples.',
    };
  }

  return {
    level: 'weak',
    note: 'Your draft does not seem directly related to the issue asked. Try referencing the specific error or framework mentioned.',
  };
}

/**
 * AI Answer Fit Evaluation
 * Assesses how well draft answer addresses question.
 */
export async function assessAnswerAgainstQuestionService({ questionHash, answerText }) {
  const rows = await safeExecute(
    `SELECT question_id, title, content FROM questions WHERE question_hash = ?`,
    [questionHash]
  );

  if (!rows || rows.length === 0) {
    throw new NotFoundError('Question not found');
  }

  const question = rows[0];
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return heuristicAnswerFit(question.title, question.content, answerText);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const modelName = process.env.GEMINI_TEXT_MODEL || 'gemini-2.5-flash-lite';

    const prompt = `You are an AI teaching assistant for a web development forum.
Evaluate how well the following draft answer addresses the user's question.

Question Title:
${question.title}

Question Details:
${question.content}

Draft Answer to evaluate:
${answerText}

Instructions:
1. Determine the relevance level: "strong", "partial", or "weak".
   - "strong": Directly answers the question or provides actionable troubleshooting/solution.
   - "partial": Addresses part of the question or is somewhat generic.
   - "weak": Off-topic, unhelpful, or does not address the question at all.
2. Provide a constructive, polite note (1-2 sentences) explaining the rating.
3. Respond ONLY with valid JSON in the format:
{"level": "strong" | "partial" | "weak", "note": "your 1-2 sentence note"}
Do not include any extra markdown formatting or backticks around the json if possible.`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
    });

    const rawText = response.text ? response.text.trim() : '';
    const cleanedText = rawText.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanedText);

    if (parsed.level && parsed.note) {
      const level = ['strong', 'partial', 'weak'].includes(parsed.level.toLowerCase())
        ? parsed.level.toLowerCase()
        : 'partial';
      return {
        level,
        note: parsed.note,
      };
    }

    return heuristicAnswerFit(question.title, question.content, answerText);
  } catch (error) {
    console.warn('Gemini API call failed, using heuristic evaluation:', error.message);
    return heuristicAnswerFit(question.title, question.content, answerText);
  }
}
