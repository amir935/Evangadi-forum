import express from 'express';
import authRoutes from './auth/routes/auth.routes.js';
import questionRoutes from './questions/routes/question.routes.js';
import answerRoutes from './answers/routes/answer.routes.js';
import { authenticateUser } from './../middleware/authentication.js';

export const mainRouter = express.Router();

// Authentication routes
mainRouter.use('/auth', authRoutes);
mainRouter.use('/questions', authenticateUser, questionRoutes);
mainRouter.use('/answers', authenticateUser, answerRoutes);

