import { StatusCodes } from 'http-status-codes';
import {
    createQuestionService,
    listQuestionsService,
    getSingleQuestionService,
    getSimilarQuestionsService,
    updateQuestionService,
    deleteQuestionService,
} from '../service/question.service.js';
import { assessAnswerAgainstQuestionService } from '../service/geminiTextCoach.service.js';

export const createQuestionController = async (req, res, next) => {
    try {
        const question = await createQuestionService({
            userId: req.user.id,
            title: req.body.title,
            body: req.body.content,
        });
        res.status(StatusCodes.CREATED).json({
            success: true,
            message: 'Question posted successfully.',
            data: question,
        });
    } catch (error) {
        next(error);
    }
};

export const listQuestionsController = async (req, res, next) => {
    try {
        const questions = await listQuestionsService({
            userId: req.user.id,
            search: req.query.search,
            mine: req.query.mine === 'true' || req.query.mine === '1',
            limit: req.query.limit,
        });
        res.status(StatusCodes.OK).json({ success: true, count: questions.length, questions });
    } catch (error) {
        next(error);
    }
};

export const getSingleQuestionController = async (req, res, next) => {
    try {
        const { questionHash } = req.params;
        const result = await getSingleQuestionService({
            questionHash,
            currentUserId: req.user.id,
        });
        res.status(StatusCodes.OK).json({
            success: true,
            message: 'Question fetched successfully',
            ...result,
        });
    } catch (error) {
        next(error);
    }
};

export const assessAnswerFitController = async (req, res, next) => {
    try {
        const { questionHash } = req.params;
        const { answerText } = req.body;
        const data = await assessAnswerAgainstQuestionService({
            questionHash,
            answerText,
        });
        res.status(StatusCodes.OK).json({
            success: true,
            message: 'Answer fit assessed',
            data,
        });
    } catch (error) {
        next(error);
    }
};

export const getSimilarQuestionsController = async (req, res, next) => {
    try {
        const { questionHash } = req.params;
        const k = req.query.k ? parseInt(req.query.k, 10) : 5;
        const threshold = req.query.threshold ? parseFloat(req.query.threshold) : 0.75;
        const result = await getSimilarQuestionsService({
            questionHash,
            k,
            threshold,
            currentUserId: req.user.id,
        });
        res.status(StatusCodes.OK).json({
            success: true,
            message: 'Similar questions fetched successfully',
            ...result,
        });
    } catch (error) {
        next(error);
    }
};


export const updateQuestionController = async (req, res, next) => {
    try {
        const question = await updateQuestionService({
            userId: req.user.id,
            questionHash: req.params.questionHash,
            title: req.body.title,
            body: req.body.body,
        });

        res.status(StatusCodes.OK).json({
            success: true, message: 'Question updated.', question
        });
    } catch (error) {
        next(error)
    }
}

export const deleteQuestionController = async (req, res, next) => {
    try {
        await deleteQuestionService({ userId: req.user.id, questionHash: req.params.questionHash });
        res.status(StatusCodes.OK).json({ success: true, message: 'Question deleted.' });
    } catch (error) {
        next(error);
    }
};
