import express from 'express';
import {
  createQuestionController,
  listQuestionsController,
  getSingleQuestionController,
  assessAnswerFitController,
  getSimilarQuestionsController,
} from '../controller/question.controller.js';
import {
  createQuestionValidation,
  listQuestionValidation,
  getSingleQuestionValidation,
  answerFitValidation,
  similarQuestionsValidation,
} from '../validations/question.validation.js';

const router = express.Router();

router.get('/', listQuestionValidation, listQuestionsController); // ← list / search / mine
router.post('/', createQuestionValidation, createQuestionController);

router.get('/:questionHash/similar', similarQuestionsValidation, getSimilarQuestionsController);
router.post('/:questionHash/answer-fit', answerFitValidation, assessAnswerFitController);
router.get('/:questionHash', getSingleQuestionValidation, getSingleQuestionController);

export default router;
