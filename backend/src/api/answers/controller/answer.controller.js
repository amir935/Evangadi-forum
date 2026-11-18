import { StatusCodes } from 'http-status-codes';
import { createAnswerService, deleteAnswerService, updateAnswerService } from '../service/answer.service.js';

export const createAnswerController = async (req, res, next) => {
  try {
    const { questionId, content } = req.body;
    const answer = await createAnswerService({
      questionId: Number(questionId),
      content,
      userId: req.user.id,
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Answer posted successfully',
      data: answer,
    });
  } catch (error) {
    next(error);
  }
};

export const updateAnswerController = async (req, res, next) => {
  try {
    const answer = await updateAnswerService({ userId: req.user.id, answerId: req.params.answerId, answerBody: req.body.body });
    res.status(StatusCodes.OK).json({ success: true, message: 'Answer updated.', answer });
  } catch (error) {
    next(error);
  }
};
export const deleteAnswerController = async (req, res, next) => {
  try {
    await deleteAnswerService({ userId: req.user.id, answerId: req.params.answerId });
    res.status(StatusCodes.OK).json({ success: true, message: 'Answer deleted.' });
  } catch (error) {
    next(error);
  }
};

