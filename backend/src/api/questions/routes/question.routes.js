import express from 'express';
import {
  createQuestionController,
  listQuestionsController,
  getSingleQuestionController,
  assessAnswerFitController,
  getSimilarQuestionsController,
  updateQuestionController,
  deleteQuestionController,
} from '../controller/question.controller.js';
import {
  createQuestionValidation,
  listQuestionValidation,
  getSingleQuestionValidation,
  answerFitValidation,
  similarQuestionsValidation,
  updateQuestionValidation,
} from '../validations/question.validation.js';

const router = express.Router();

router.get('/', listQuestionValidation, listQuestionsController); // ← list / search / mine
router.post('/', createQuestionValidation, createQuestionController);

router.get('/:questionHash/similar', similarQuestionsValidation, getSimilarQuestionsController);
router.post('/:questionHash/answer-fit', answerFitValidation, assessAnswerFitController);
router.get('/:questionHash', getSingleQuestionValidation, getSingleQuestionController);
router.patch('/:questionHash', updateQuestionValidation, updateQuestionController);
router.delete('/:questionHash', getSingleQuestionValidation, deleteQuestionController);
export default router;
