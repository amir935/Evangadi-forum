import { AlertCircle, RotateCw } from 'lucide-react';

/** Inline error box with an optional retry button. */
export function ErrorState({ title = 'Something went wrong', message, onRetry }) {
    return (
        <div className="empty-box" role="alert" style={{ background: 'var(--red-soft)', borderColor: 'var(--red-line)' }}>
            <AlertCircle size={32} style={{ color: 'var(--red)' }} />
            <h3>{title}</h3>
            {message && <p>{message}</p>}
            {onRetry && (
                <button className="btn btn-outline" onClick={onRetry}>
                    <RotateCw size={16} /> Try again
                </button>
            )}
        </div>
    );
}

/** Dashed empty-state box. */
export function EmptyState({ icon: Icon, title, children, action }) {
    return (
        <div className="empty-box">
            {Icon && <Icon size={36} />}
            {title && <h3>{title}</h3>}
            {children && <p>{children}</p>}
            {action}
        </div>
    );
}
