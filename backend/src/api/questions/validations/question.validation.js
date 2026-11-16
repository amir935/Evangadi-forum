import { body } from 'express-validator';
import { validationErrorHandler } from '../../../middleware/validation-handler.js';

export const createQuestionValidation = [
  body('title')
    .isString()
    .withMessage('Title must be a string')
    .bail()
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .bail()
    .isLength({ min: 5, max: 255 })
    .withMessage('Title must be between 5 and 255 characters'),
  body('content')
    .isString()
    .withMessage('Question content must be a string')
    .bail()
    .trim()
    .notEmpty()
    .withMessage('Question content is required')
    .bail()
    .isLength({ min: 10 })
    .withMessage('Question content must be at least 10 characters'),
  validationErrorHandler,
];
