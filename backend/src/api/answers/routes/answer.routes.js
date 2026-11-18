import express from 'express';
import { createAnswerController, deleteAnswerController, updateAnswerController } from '../controller/answer.controller.js';
import { createAnswerValidation, deleteAnswerValidation, updateAnswerValidation } from '../validations/answer.validation.js';

const router = express.Router();

router.post('/', createAnswerValidation, createAnswerController);
router.patch('/:answerId', updateAnswerValidation, updateAnswerController);
router.delete('/:answerId', deleteAnswerValidation, deleteAnswerController);

export default router;
