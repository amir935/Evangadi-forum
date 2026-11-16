import { Link } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import Avatar from '../Avatar/Avatar.jsx';
import { excerpt, fullName, timeAgo } from '../../lib/format.js';
import { cn } from '../../lib/utils.js';
import styles from './QuestionList.module.css';

export function QuestionRow({ question, showScore = false }) {
    const { questionHash, title, body, answerCount, createdAt, author, isMine, score } = question;
    return (
        <li className={cn(styles.row, isMine && styles.mine)}>
            <Link to={`/questions/${questionHash}`} className={styles.link}>
                <Avatar person={author} size={44} ring={isMine} />
                <div className={styles.text}>
                    <div className={styles.titleRow}>
                        <h3 className={styles.title}>{title}</h3>
                        {isMine && <span className="badge badge-orange">Yours</span>}
                        {showScore && typeof score === 'number' && (
                            <span className={styles.score} title="Cosine similarity">
                                {Math.round(score * 100)}% match
                            </span>
                        )}
                    </div>
                    <p className={styles.excerpt}>{excerpt(body)}</p>
                    <div className={styles.meta}>
                        <span className={styles.replies}>
                            <MessageSquare size={12} /> {answerCount} {answerCount === 1 ? 'reply' : 'replies'}
                        </span>
                        <span>
                            {timeAgo(createdAt)} by {isMine ? 'You' : fullName(author)}
                        </span>
                    </div>
                </div>
            </Link>
        </li>
    );
}

export function QuestionList({ questions, showScore }) {
    return (
        <ul className={styles.list}>
            {questions.map(q => (
                <QuestionRow key={q.questionHash} question={q} showScore={showScore} />
            ))}
        </ul>
    );
}

export function QuestionListSkeleton({ rows = 5 }) {
    return (
        <ul className={styles.list} aria-busy="true" aria-label="Loading questions">
            {Array.from({ length: rows }, (_, i) => (
                <li key={i} className={styles.row}>
                    <div className={styles.link}>
                        <div className="skeleton" style={{ width: 44, height: 44, borderRadius: '50%', flex: 'none' }} />
                        <div className={styles.text}>
                            <div className="skeleton" style={{ height: 16, width: '55%', marginBottom: 12 }} />
                            <div className="skeleton" style={{ height: 12, width: '95%', marginBottom: 8 }} />
                            <div className="skeleton" style={{ height: 12, width: '80%', marginBottom: 14 }} />
                            <div className="skeleton" style={{ height: 10, width: 160 }} />
                        </div>
                    </div>
                </li>
            ))}
        </ul>
    );
}
