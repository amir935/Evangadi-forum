import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import QuestionDetail from './QuestionDetail.jsx';
import * as questionService from '../../services/questions/question.service.js';
import * as answerService from '../../services/answers/answer.service.js';

// Mock AuthContext
vi.mock('../../contexts/AuthContext.jsx', () => ({
  useAuth: () => ({
    user: { id: 99, firstName: 'Test', lastName: 'Learner' },
  }),
}));

const mockQuestionData = {
  success: true,
  question: {
    id: 1,
    questionHash: 'a1b2c3d4e5f67890',
    title: 'React Router: useParams() returns undefined',
    content: '### What I am trying to do\nI have a route like `/questions/:questionHash`.',
    answerCount: 1,
    createdAt: '2026-05-01T12:00:00Z',
    updatedAt: '2026-05-01T12:00:00Z',
    author: {
      id: 1,
      firstName: 'Abebe',
      lastName: 'Kebede',
    },
  },
  answers: [
    {
      id: 10,
      questionId: 1,
      content: 'Make sure your route definition matches the param name `questionHash`.',
      createdAt: '2026-05-01T14:00:00Z',
      author: {
        id: 2,
        firstName: 'Chala',
        lastName: 'T',
      },
    },
  ],
  answersMeta: {
    limit: 100,
    total: 1,
  },
};

const mockSimilarQuestions = [
  {
    id: 5,
    questionHash: 'ffff0000aaaa1111',
    title: 'How to fix CORS error in Express?',
    createdAt: '2026-04-18T10:00:00Z',
    author: {
      id: 3,
      firstName: 'Almaz',
      lastName: 'D',
    },
  },
];

describe('QuestionDetail Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading state initially', async () => {
    vi.spyOn(questionService, 'getSingleQuestion').mockImplementation(
      () => new Promise(() => {})
    );

    render(
      <MemoryRouter initialEntries={['/questions/a1b2c3d4e5f67890']}>
        <Routes>
          <Route path="/questions/:questionHash" element={<QuestionDetail />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/loading question details\.\.\./i)).toBeInTheDocument();
  });

  it('renders error state on fetch failure', async () => {
    vi.spyOn(questionService, 'getSingleQuestion').mockRejectedValue(
      new Error('Question not found')
    );

    render(
      <MemoryRouter initialEntries={['/questions/a1b2c3d4e5f67890']}>
        <Routes>
          <Route path="/questions/:questionHash" element={<QuestionDetail />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/question not found/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /return to dashboard/i })).toBeInTheDocument();
    });
  });

  it('renders question details, author, answers, and sidebar', async () => {
    vi.spyOn(questionService, 'getSingleQuestion').mockResolvedValue(mockQuestionData);
    vi.spyOn(questionService, 'getSimilarQuestions').mockResolvedValue(mockSimilarQuestions);

    render(
      <MemoryRouter initialEntries={['/questions/a1b2c3d4e5f67890']}>
        <Routes>
          <Route path="/questions/:questionHash" element={<QuestionDetail />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('React Router: useParams() returns undefined')).toBeInTheDocument();
      expect(screen.getByText('Abebe Kebede')).toBeInTheDocument();
      expect(screen.getByText(/Community Answers \(1\)/i)).toBeInTheDocument();
      expect(screen.getByText('Chala T')).toBeInTheDocument();
      expect(screen.getByText(/How to fix CORS error in Express\?/i)).toBeInTheDocument();
    });
  });

  it('renders empty answers state when answer list is empty', async () => {
    const emptyAnswersData = {
      ...mockQuestionData,
      answers: [],
      answersMeta: { limit: 100, total: 0 },
    };
    vi.spyOn(questionService, 'getSingleQuestion').mockResolvedValue(emptyAnswersData);
    vi.spyOn(questionService, 'getSimilarQuestions').mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={['/questions/a1b2c3d4e5f67890']}>
        <Routes>
          <Route path="/questions/:questionHash" element={<QuestionDetail />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Be the first to help!/i)).toBeInTheDocument();
      expect(screen.getByText(/Community Answers \(0\)/i)).toBeInTheDocument();
    });
  });

  it('validates and submits a new answer', async () => {
    vi.spyOn(questionService, 'getSingleQuestion').mockResolvedValue(mockQuestionData);
    vi.spyOn(questionService, 'getSimilarQuestions').mockResolvedValue([]);

    const postAnswerSpy = vi.spyOn(answerService, 'postAnswer').mockResolvedValue({
      id: 999,
      questionId: 1,
      content: 'This is a valid answer with more than 20 characters length.',
      createdAt: '2026-05-02T10:00:00Z',
      author: {
        id: 99,
        firstName: 'Test',
        lastName: 'Learner',
      },
    });

    render(
      <MemoryRouter initialEntries={['/questions/a1b2c3d4e5f67890']}>
        <Routes>
          <Route path="/questions/:questionHash" element={<QuestionDetail />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Contribute an answer/i)).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole('button', { name: /post your answer/i });
    expect(submitBtn).toBeDisabled();

    const textarea = screen.getByPlaceholderText(/type your answer here/i);
    fireEvent.change(textarea, {
      target: { value: 'This is a valid answer with more than 20 characters length.' },
    });

    expect(submitBtn).not.toBeDisabled();

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(postAnswerSpy).toHaveBeenCalledWith(
        1,
        'This is a valid answer with more than 20 characters length.'
      );
      expect(screen.getByText(/Community Answers \(2\)/i)).toBeInTheDocument();
      expect(screen.getByText('This is a valid answer with more than 20 characters length.')).toBeInTheDocument();
    });
  });

  it('checks AI answer fit and displays feedback', async () => {
    vi.spyOn(questionService, 'getSingleQuestion').mockResolvedValue(mockQuestionData);
    vi.spyOn(questionService, 'getSimilarQuestions').mockResolvedValue([]);
    const fitSpy = vi.spyOn(questionService, 'assessAnswerFit').mockResolvedValue({
      level: 'strong',
      note: 'Your draft directly addresses the routing configuration.',
    });

    render(
      <MemoryRouter initialEntries={['/questions/a1b2c3d4e5f67890']}>
        <Routes>
          <Route path="/questions/:questionHash" element={<QuestionDetail />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Contribute an answer/i)).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText(/type your answer here/i);
    fireEvent.change(textarea, {
      target: { value: 'Here is a detailed suggestion that checks the route path carefully.' },
    });

    const checkFitBtn = screen.getByRole('button', { name: /check draft fit/i });
    expect(checkFitBtn).not.toBeDisabled();

    fireEvent.click(checkFitBtn);

    await waitFor(() => {
      expect(fitSpy).toHaveBeenCalledWith(
        'a1b2c3d4e5f67890',
        'Here is a detailed suggestion that checks the route path carefully.'
      );
      expect(screen.getByText(/strong fit/i)).toBeInTheDocument();
      expect(screen.getByText(/Your draft directly addresses the routing configuration\./i)).toBeInTheDocument();
    });
  });
});
