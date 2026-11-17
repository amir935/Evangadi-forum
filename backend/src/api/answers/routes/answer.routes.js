import express from 'express';
import { createAnswerController } from '../controller/answer.controller.js';
import { createAnswerValidation } from '../validations/answer.validation.js';

const router = express.Router();

router.post('/', createAnswerValidation, createAnswerController);

export default router;
