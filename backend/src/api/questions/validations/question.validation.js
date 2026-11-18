import { body, param, query } from 'express-validator';
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


export const listQuestionValidation = [
  query('search').optional().isString().isLength({ max: 200 }).withMessage('Search is too long'),
  query('limit').optional().isInt({ min: 1, max: 200 }).withMessage('Limit must be 1-200'),
  validationErrorHandler
];

export const getSingleQuestionValidation = [
  param('questionHash')
    .isString()
    .withMessage('Question hash must be a string')
    .bail()
    .trim()
    .matches(/^[a-f0-9]{16}$/)
    .withMessage('Question hash must be a 16-character hexadecimal string'),
  validationErrorHandler,
];

export const answerFitValidation = [
  param('questionHash')
    .isString()
    .withMessage('Question hash must be a string')
    .bail()
    .trim()
    .matches(/^[a-f0-9]{16}$/)
    .withMessage('Question hash must be a 16-character hexadecimal string'),
  body('answerText')
    .isString()
    .withMessage('answerText must be a string')
    .bail()
    .trim()
    .notEmpty()
    .withMessage('answerText is required')
    .bail()
    .isLength({ min: 20 })
    .withMessage('answerText must be at least 20 characters'),
  validationErrorHandler,
];

export const similarQuestionsValidation = [
  param('questionHash')
    .isString()
    .withMessage('Question hash must be a string')
    .bail()
    .trim()
    .matches(/^[a-f0-9]{16}$/)
    .withMessage('Question hash must be a 16-character hexadecimal string'),
  query('k').optional().isInt({ min: 1, max: 20 }).withMessage('k must be between 1 and 20'),
  query('threshold').optional().isFloat({ min: 0, max: 1 }).withMessage('threshold must be between 0 and 1'),
  validationErrorHandler,
];

export const updateQuestionValidation = [
  param('questionHash')
    .isString()
    .withMessage('Question hash must be a string')
    .bail()
    .trim()
    .matches(/^[a-f0-9]{16}$/)
    .withMessage('Question hash must be a 16-character hexadecimal string'),
  body('title').isString().trim().isLength({ min: 5, max: 255 }).withMessage('Title must be 5-255 characters'),
  body('body').isString().trim().isLength({ min: 10 }).withMessage('Details must be at least 10 characters'),
  validationErrorHandler,
];
