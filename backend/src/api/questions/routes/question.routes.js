import express from 'express';
import { createQuestionController, listQuestionsController } from '../controller/question.controller.js';
import { createQuestionValidation, listQuestionValidation } from '../validations/question.validation.js';

const router = express.Router();

router.get('/', listQuestionValidation, listQuestionsController);   // ← list / search / mine
router.post('/', createQuestionValidation, createQuestionController);

export default router;