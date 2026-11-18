import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import {
  ArrowLeft,
  Share2,
  MessageSquare,
  Sparkles,
  Link2,
  Check,
  Pencil, // NEW
  Trash2, // NEW
  X, // NEW
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import Avatar from '../../components/Avatar/Avatar.jsx';
import {
  getSingleQuestion,
  assessAnswerFit,
  getSimilarQuestions,
  updateQuestion, // NEW
  deleteQuestion, // NEW
} from '../../services/questions/question.service.js';
import {
  postAnswer,
  updateAnswer, // NEW
  deleteAnswer, // NEW
} from '../../services/answers/answer.service.js';
import { formatDate } from '../../lib/format.js';
import styles from './QuestionDetail.module.css';

const ANSWER_MIN = 20;
const TITLE_MIN = 5;
const BODY_MIN = 10;

// turns an axios error into a readable message
const messageOf = (err, fallback) => err?.response?.data?.msg || err?.message || fallback;

export default function QuestionDetail() {
  const { questionHash } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [similarQuestions, setSimilarQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState('');

  // Answer submission state
  const [answerText, setAnswerText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // AI Fit state
  const [fitResult, setFitResult] = useState(null);
  const [isCheckingFit, setIsCheckingFit] = useState(false);

  // Share state
  const [copied, setCopied] = useState(false);

  // NEW: editing / deleting the question
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [questionForm, setQuestionForm] = useState({ title: '', body: '' });
  const [isSavingQuestion, setIsSavingQuestion] = useState(false);
  const [questionError, setQuestionError] = useState('');

  // NEW: editing / deleting answers (only one answer is edited at a time)
  const [editingAnswerId, setEditingAnswerId] = useState(null);
  const [answerDraft, setAnswerDraft] = useState('');
  const [busyAnswerId, setBusyAnswerId] = useState(null);
  const [answerError, setAnswerError] = useState({ id: null, message: '' });

  const textareaRef = useRef(null);

  // Fetch question and answers
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsLoading(true);
      setPageError('');
      setFitResult(null);
      setSubmitError('');
      setIsEditingQuestion(false); // NEW: reset when opening another question
      setEditingAnswerId(null);

      try {
        const data = await getSingleQuestion(questionHash);
        if (!isMounted) return;

        setQuestion(data.question);
        setAnswers(data.answers || []);

        // Load similar questions for sidebar
        try {
          const similar = await getSimilarQuestions(questionHash);
          if (isMounted) setSimilarQuestions(similar || []);
        } catch {
          // Non-critical, continue without similar questions
        }
      } catch (err) {
        if (!isMounted) return;
        setPageError(messageOf(err, 'Failed to load question details.'));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    if (questionHash) loadData();

    return () => {
      isMounted = false;
    };
  }, [questionHash]);

  // Share URL to clipboard
  const handleShare = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Fallback
    }
  };

  // Helper to format markdown text in textarea
  const handleInsertMarkdown = (type) => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = answerText.slice(start, end);

    let before = answerText.slice(0, start);
    let after = answerText.slice(end);
    let replacement = '';
    let cursorOffset = 0;

    switch (type) {
      case 'bold':
        replacement = `**${selected || 'bold text'}**`;
        cursorOffset = selected ? replacement.length : 2;
        break;
      case 'italic':
        replacement = `*${selected || 'italic text'}*`;
        cursorOffset = selected ? replacement.length : 1;
        break;
      case 'code':
        if (selected.includes('\n')) {
          replacement = `\n\`\`\`javascript\n${selected || '// code here'}\n\`\`\`\n`;
        } else {
          replacement = `\`${selected || 'code'}\``;
        }
        cursorOffset = selected ? replacement.length : 1;
        break;
      case 'link':
        replacement = `[${selected || 'link text'}](url)`;
        cursorOffset = selected ? replacement.length : 1;
        break;
      default:
        return;
    }

    setAnswerText(before + replacement + after);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + cursorOffset, start + cursorOffset);
    }, 0);
  };

  // Check draft fit with AI
  const handleCheckFit = async () => {
    const text = answerText.trim();
    if (text.length < ANSWER_MIN || isCheckingFit) return;

    setIsCheckingFit(true);
    setSubmitError('');

    try {
      const result = await assessAnswerFit(questionHash, text);
      setFitResult(result);
    } catch (err) {
      setSubmitError(messageOf(err, 'Failed to check answer fit.'));
    } finally {
      setIsCheckingFit(false);
    }
  };

  // ---------------- NEW: question edit / delete ----------------
  const startEditQuestion = () => {
    setQuestionForm({ title: question.title, body: question.content ?? question.body ?? '' }); // pre-fill with current text
    setQuestionError('');
    setIsEditingQuestion(true);
  };

  const handleSaveQuestion = async () => {
    const title = questionForm.title.trim();
    const body = questionForm.body.trim();
    if (title.length < TITLE_MIN) return setQuestionError(`Title must be at least ${TITLE_MIN} characters.`);
    if (body.length < BODY_MIN) return setQuestionError(`Details must be at least ${BODY_MIN} characters.`);

    setIsSavingQuestion(true);
    setQuestionError('');
    try {
      const updated = await updateQuestion(questionHash, { title, body });
      setQuestion((prev) => ({ ...prev, ...updated, content: updated.content ?? updated.body })); // show the new text right away
      setIsEditingQuestion(false);
    } catch (err) {
      setQuestionError(messageOf(err, 'Could not save your question.'));
    } finally {
      setIsSavingQuestion(false);
    }
  };

  // FIX: the old version used setError / getErrorMessage, which don't exist in this file
  async function handleDeleteQuestion() {
    if (!window.confirm('Delete this question and all its answers? This cannot be undone.')) return;
    setIsSavingQuestion(true);
    try {
      await deleteQuestion(questionHash);
      navigate('/my-questions', { replace: true }); // this page no longer exists
    } catch (err) {
      setQuestionError(messageOf(err, 'Could not delete your question.'));
      setIsSavingQuestion(false);
    }
  }

  // ---------------- NEW: answer edit / delete ----------------
  const startEditAnswer = (answer) => {
    setEditingAnswerId(answer.id);
    setAnswerDraft(answer.content ?? answer.body ?? '');
    setAnswerError({ id: null, message: '' });
  };

  const handleSaveAnswer = async (answerId) => {
    const text = answerDraft.trim();
    if (text.length < ANSWER_MIN) {
      return setAnswerError({ id: answerId, message: `Your answer must be at least ${ANSWER_MIN} characters.` });
    }
    setBusyAnswerId(answerId);
    try {
      const updated = await updateAnswer(answerId, text);
      // PATCH returns the text as `body`; this page reads `content`
      setAnswers((prev) => prev.map((a) => (a.id === answerId ? { ...a, content: updated.body ?? updated.content } : a)));
      setEditingAnswerId(null);
    } catch (err) {
      setAnswerError({ id: answerId, message: messageOf(err, 'Could not save your answer.') });
    } finally {
      setBusyAnswerId(null);
    }
  };

  const handleDeleteAnswer = async (answerId) => {
    if (!window.confirm('Delete this answer? This cannot be undone.')) return;
    setBusyAnswerId(answerId);
    try {
      await deleteAnswer(answerId);
      setAnswers((prev) => prev.filter((a) => a.id !== answerId));
      setQuestion((prev) => ({ ...prev, answerCount: Math.max(0, (prev.answerCount || 1) - 1) }));
    } catch (err) {
      setAnswerError({ id: answerId, message: messageOf(err, 'Could not delete your answer.') });
    } finally {
      setBusyAnswerId(null);
    }
  };

  // Post answer
  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    const text = answerText.trim();
    if (text.length < ANSWER_MIN || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const newAnswer = await postAnswer(question.id, text); // this API wants { questionId, content }
      setAnswers((prev) => [...prev, newAnswer]);
      setQuestion((prev) => ({ ...prev, answerCount: (prev.answerCount || 0) + 1 }));
      setAnswerText('');
      setFitResult(null);
    } catch (err) {
      setSubmitError(messageOf(err, 'Failed to post answer. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={styles.stateContainer}>
        <p className={styles.loadingText}>Loading question details...</p>
      </div>
    );
  }

  // Error state
  if (pageError || !question) {
    return (
      <div className={styles.stateContainer}>
        <p className={styles.errorText}>{pageError || 'Failed to load question details.'}</p>
        <button className={styles.returnBtn} type="button" onClick={() => navigate('/dashboard')}>
          Return to Dashboard
        </button>
      </div>
    );
  }

  // isMine comes from the backend; the user-id check is a fallback
  const isOwner = question.isMine ?? user?.id === question.author?.id;
  const ownsAnswer = (a) => a.isMine ?? user?.id === a.author?.id;
  const canCheckFit = answerText.trim().length >= ANSWER_MIN && !isCheckingFit;
  const canSubmit = answerText.trim().length >= ANSWER_MIN && !isSubmitting;

  return (
    <div className={styles.page}>
      {/* Top back navigation */}
      <button type="button" className={styles.backLink} onClick={() => navigate('/dashboard')}>
        <ArrowLeft size={16} />
        Back to feed
      </button>

      <div className={styles.layoutGrid}>
        {/* Main Column */}
        <div className={styles.mainColumn}>
          {/* Question Card */}
          <article className={styles.questionCard}>
            <header className={styles.authorRow}>
              <Avatar person={question.author} size={42} />
              <div className={styles.authorInfo}>
                <span className={styles.authorName}>
                  {question.author?.firstName} {question.author?.lastName}
                </span>
                <span className={styles.postedDate}>Posted {formatDate(question.createdAt)}</span>
              </div>

              {/* NEW: owner buttons */}
              {isOwner && !isEditingQuestion && (
                <div className={styles.ownerActions}>
                  <button type="button" className={styles.actionBtn} onClick={startEditQuestion} disabled={isSavingQuestion}>
                    <Pencil size={14} /> Edit
                  </button>
                  <button
                    type="button"
                    className={`${styles.actionBtn} ${styles.dangerBtn}`}
                    onClick={handleDeleteQuestion}
                    disabled={isSavingQuestion}
                  >
                    <Trash2 size={14} /> {isSavingQuestion ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              )}
            </header>

            {questionError && (
              <div className={styles.submitError} role="alert">
                {questionError}
              </div>
            )}

            {/* NEW: edit form OR normal view */}
            {isEditingQuestion ? (
              <div className={styles.editBox}>
                <label className={styles.editLabel}>
                  Title
                  <input
                    className={styles.editInput}
                    value={questionForm.title}
                    onChange={(e) => setQuestionForm((f) => ({ ...f, title: e.target.value }))}
                    maxLength={255}
                    disabled={isSavingQuestion}
                  />
                </label>
                <label className={styles.editLabel}>
                  Details
                  <textarea
                    className={styles.textarea}
                    value={questionForm.body}
                    onChange={(e) => setQuestionForm((f) => ({ ...f, body: e.target.value }))}
                    rows={8}
                    disabled={isSavingQuestion}
                  />
                </label>
                <div className={styles.editActions}>
                  <button type="button" className={styles.actionBtn} onClick={() => setIsEditingQuestion(false)} disabled={isSavingQuestion}>
                    <X size={14} /> Cancel
                  </button>
                  <button type="button" className={styles.submitBtn} onClick={handleSaveQuestion} disabled={isSavingQuestion}>
                    {isSavingQuestion ? 'Saving...' : 'Save changes'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h1 className={styles.questionTitle}>{question.title}</h1>
                <div className={styles.markdownBody}>
                  <ReactMarkdown>{question.content || question.body}</ReactMarkdown>
                </div>
              </>
            )}

            <hr className={styles.questionDivider} />

            <footer className={styles.questionFooter}>
              <button type="button" className={styles.actionBtn} onClick={handleShare} aria-label="Share question link">
                {copied ? <Check size={14} color="#16a34a" /> : <Share2 size={14} />}
                {copied ? 'Link copied!' : 'Share'}
              </button>

              <div className={styles.actionPill}>
                <MessageSquare size={14} />
                <span>
                  {answers.length} {answers.length === 1 ? 'Answer' : 'Answers'}
                </span>
              </div>
            </footer>
          </article>

          {/* Community Answers */}
          <section className={styles.answersSection}>
            <h2 className={styles.sectionHeader}>Community Answers ({answers.length})</h2>

            {answers.length === 0 ? (
              <div className={styles.emptyAnswers}>
                <div className={styles.emptyIcon}>
                  <MessageSquare size={32} />
                </div>
                <h3 className={styles.emptyTitle}>Be the first to help!</h3>
                <p className={styles.emptyText}>
                  This question is waiting for an expert like you. Share your knowledge and earn reputation points.
                </p>
              </div>
            ) : (
              answers.map((answer) => {
                const isEditing = editingAnswerId === answer.id;
                const isBusy = busyAnswerId === answer.id;
                return (
                  <article key={answer.id} className={styles.answerCard}>
                    <header className={styles.authorRow}>
                      <Avatar person={answer.author} size={38} />
                      <div className={styles.authorInfo}>
                        <span className={styles.authorName}>
                          {answer.author?.firstName} {answer.author?.lastName}
                        </span>
                        <span className={styles.postedDate}>{formatDate(answer.createdAt)}</span>
                      </div>

                      {/* NEW: owner buttons for this answer */}
                      {ownsAnswer(answer) && !isEditing && (
                        <div className={styles.ownerActions}>
                          <button
                            type="button"
                            className={styles.iconBtn}
                            onClick={() => startEditAnswer(answer)}
                            disabled={isBusy}
                            title="Edit answer"
                            aria-label="Edit answer"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            className={`${styles.iconBtn} ${styles.dangerBtn}`}
                            onClick={() => handleDeleteAnswer(answer.id)}
                            disabled={isBusy}
                            title="Delete answer"
                            aria-label="Delete answer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </header>

                    {answerError.id === answer.id && (
                      <div className={styles.submitError} role="alert">
                        {answerError.message}
                      </div>
                    )}

                    {isEditing ? (
                      <div className={styles.editBox}>
                        <textarea
                          className={styles.textarea}
                          value={answerDraft}
                          onChange={(e) => setAnswerDraft(e.target.value)}
                          rows={6}
                          disabled={isBusy}
                        />
                        <div className={styles.editActions}>
                          <button type="button" className={styles.actionBtn} onClick={() => setEditingAnswerId(null)} disabled={isBusy}>
                            <X size={14} /> Cancel
                          </button>
                          <button type="button" className={styles.submitBtn} onClick={() => handleSaveAnswer(answer.id)} disabled={isBusy}>
                            {isBusy ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className={styles.markdownBody}>
                        <ReactMarkdown>{answer.content}</ReactMarkdown>
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </section>

          {/* Contribute an Answer */}
          {isOwner ? (
            <div className={styles.ownNotice}>
              <p>You posted this question. Classmates and mentors will contribute answers here.</p>
            </div>
          ) : (
            <section className={styles.formCard}>
              <h2 className={styles.formTitle}>Contribute an answer</h2>

              {submitError && (
                <div className={styles.submitError} role="alert">
                  {submitError}
                </div>
              )}

              <form onSubmit={handleSubmitAnswer}>
                <div className={styles.editorContainer}>
                  <div className={styles.editorToolbar}>
                    <div className={styles.toolbarActions}>
                      <button type="button" className={styles.toolBtn} onClick={() => handleInsertMarkdown('bold')} title="Bold" aria-label="Bold">
                        B
                      </button>
                      <button
                        type="button"
                        className={styles.toolBtn}
                        onClick={() => handleInsertMarkdown('italic')}
                        title="Italic"
                        aria-label="Italic"
                        style={{ fontStyle: 'italic' }}
                      >
                        I
                      </button>
                      <button type="button" className={styles.toolBtn} onClick={() => handleInsertMarkdown('code')} title="Code section" aria-label="Code section">
                        {'</>'}
                      </button>
                      <button type="button" className={styles.toolBtn} onClick={() => handleInsertMarkdown('link')} title="Insert link" aria-label="Insert link">
                        <Link2 size={14} />
                      </button>
                    </div>

                    <span className={styles.charCount}>{answerText.length} characters</span>
                  </div>

                  <textarea
                    ref={textareaRef}
                    className={styles.textarea}
                    value={answerText}
                    onChange={(e) => {
                      setAnswerText(e.target.value);
                      if (fitResult) setFitResult(null);
                    }}
                    placeholder="Type your answer here... You can use Markdown to format your code!"
                    rows={8}
                    required
                  />
                </div>

                {/* AI Fit feedback panel */}
                {fitResult && (
                  <div className={`${styles.fitPanel} ${styles[`fitPanel_${fitResult.level}`] || ''}`}>
                    <div className={styles.fitHeader}>
                      <span className={`${styles.fitBadge} ${styles[`fitBadge_${fitResult.level}`] || ''}`}>
                        {fitResult.level} fit
                      </span>
                    </div>
                    <p className={styles.fitNote}>{fitResult.note}</p>
                  </div>
                )}

                <div className={styles.formControls}>
                  <div className={styles.fitActionGroup}>
                    <button type="button" className={styles.fitBtn} onClick={handleCheckFit} disabled={!canCheckFit}>
                      <Sparkles size={15} color="#ea580c" />
                      {isCheckingFit ? 'Checking fit...' : 'Check draft fit'}
                    </button>
                    <span className={styles.fitHint}>
                      Relevance only. Not grading correctness. You need at least {ANSWER_MIN} characters.
                    </span>
                  </div>

                  <button type="submit" className={styles.submitBtn} disabled={!canSubmit}>
                    {isSubmitting ? 'Posting...' : 'Post Your Answer'}
                  </button>
                </div>
              </form>
            </section>
          )}
        </div>

        {/* Sidebar: Related Questions */}
        <aside className={styles.sidebarColumn}>
          <div className={styles.relatedCard}>
            <h3 className={styles.relatedTitle}>Related Questions</h3>

            {similarQuestions.length === 0 ? (
              <p className={styles.relatedEmpty}>No related questions found.</p>
            ) : (
              <div className={styles.relatedList}>
                {similarQuestions.map((item) => (
                  <Link key={item.id ?? item.questionHash} to={`/questions/${item.questionHash}`} className={styles.relatedItem}>
                    <h4 className={styles.relatedItemTitle}>{item.title}</h4>
                    <div className={styles.relatedItemMeta}>
                      <span>{item.author ? `${item.author.firstName} ${item.author.lastName}` : 'Student'}</span>
                      <span>{formatDate(item.createdAt)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}