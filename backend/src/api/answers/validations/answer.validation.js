import { body } from 'express-validator';
import { validationErrorHandler } from '../../../middleware/validation-handler.js';

export const createAnswerValidation = [
  body('questionId')
    .notEmpty()
    .withMessage('questionId is required')
    .bail()
    .isInt({ min: 1 })
    .withMessage('questionId must be a positive integer'),
  body('content')
    .isString()
    .withMessage('content must be a string')
    .bail()
    .trim()
    .notEmpty()
    .withMessage('content is required')
    .bail()
    .isLength({ min: 20 })
    .withMessage('Answer content must be at least 20 characters'),
  validationErrorHandler,
];
