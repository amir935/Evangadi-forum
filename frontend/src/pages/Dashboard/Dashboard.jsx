import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SquarePen, Library, Search, X, MessageSquare } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { apiClient } from '../../services/core/api.client.js';
import { QuestionList, QuestionListSkeleton } from '../../components/QuestionList/QuestionList.jsx';
import { ErrorState, EmptyState } from '../../components/States/States.jsx';
import { cn } from '../../lib/utils.js';
import styles from './Dashboard.module.css';

const SHORTCUTS = [
  { to: '/questions/ask', icon: SquarePen, title: 'New question', text: 'Share context, errors, and what you already tried' },
  { to: '/my-questions', icon: Library, title: 'Your topics', text: 'Filtered list of threads you authored' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const search = params.get('search')?.trim() ?? '';

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const getQuestions = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await apiClient.get('/api/questions', {
        params: search ? { search } : { limit: 100 },
      });

      setQuestions(response.data.questions);
    } catch (err) {
      setError(err.response?.data?.msg || 'Could not load questions.');
    } finally {
      setLoading(false);
    }
  };

  // runs when the page opens, and again whenever the search text changes
  useEffect(() => {
    getQuestions();
  }, [search]);

  const stats = [
    { label: 'Questions', value: questions.length },
    { label: 'Replies', value: questions.reduce((n, q) => n + q.answerCount, 0) },
    { label: 'Unanswered', value: questions.filter(q => q.answerCount === 0).length },
    { label: 'Yours', value: questions.filter(q => q.isMine).length },
  ];

  const clearSearch = () => setParams({});

  return (
    <div className={styles.page}>
      <section className={cn('card', styles.hero)}>
        <p className="eyebrow">Forum home</p>
        <h2 className={styles.greeting}>Good to see you, {user.firstName}.</h2>
        <p className={styles.intro}>
          Start a topic, revisit your own threads, or skim the live feed.
        </p>

        <div className={styles.shortcuts}>
          {SHORTCUTS.map(({ to, icon: Icon, title, text }) => (
            <Link key={to} to={to} className={styles.shortcut}>
              <span className={styles.shortcutIcon}>
                <Icon size={18} />
              </span>
              <span>
                <span className={styles.shortcutTitle}>{title}</span>
                <span className={styles.shortcutText}>{text}</span>
              </span>
            </Link>
          ))}
        </div>

        <hr className={styles.rule} />
        <p className={styles.note}>Figures below describe the threads currently in the list.</p>
        <div className={styles.states}>
          {stats.map(s => (
            <div key={s.label} className={styles.stat}>
              <span className={styles.statLabel}>{s.label}</span>
              <span className={styles.statValue}>{loading ? '–' : s.value}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={cn('card', styles.feed)}>
        <header className={styles.feedHead}>
          <div>
            <h2 className={styles.feedTitle}>{search ? 'Search results' : 'Discussion feed'}</h2>
            <p className={styles.feedSub}>
              {search ? (
                <>
                  Matches for <strong>“{search}”</strong>
                  <button className={styles.clear} onClick={clearSearch}>
                    <X size={12} /> Clear
                  </button>
                </>
              ) : (
                'Your threads use a slim left accent in this list.'
              )}
            </p>
          </div>
          {!search && <span className="badge badge-solid">Newest threads</span>}
        </header>

        {loading && <QuestionListSkeleton />}

        {!loading && error && (
          <div className={styles.pad}>
            <ErrorState title="Could not load the feed" message={error} onRetry={getQuestions} />
          </div>
        )}

        {!loading && !error && questions.length === 0 && (
          <div className={styles.pad}>
            {search ? (
              <EmptyState icon={Search} title="No matching questions">
                No titles or bodies contain that text. Try different words.
              </EmptyState>
            ) : (
              <EmptyState
                icon={MessageSquare}
                title="No questions yet"
                action={
                  <Link to="/questions/ask" className="btn btn-primary">
                    Ask the first question
                  </Link>
                }
              >
                The feed is empty. Start the conversation for your cohort.
              </EmptyState>
            )}
          </div>
        )}

        {!loading && !error && questions.length > 0 && <QuestionList questions={questions} />}
      </section>
    </div>
  );
}