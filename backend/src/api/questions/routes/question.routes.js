import express from 'express';
import { createQuestionController } from '../controller/question.controller.js';
import { createQuestionValidation } from '../validations/question.validation.js';

const router = express.Router();

router.post('/', createQuestionValidation, createQuestionController);

export default router;
