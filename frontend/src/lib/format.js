export const initials = (firstName = '', lastName = '') =>
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '?';

export const fullName = person => (person ? `${person.firstName} ${person.lastName}` : '');

// Stable pastel color per user so avatars are recognizable across pages.
const AVATAR_COLORS = ['#7dd3e8', '#5eead4', '#86efac', '#fcd34d', '#fda4af', '#c4b5fd', '#fdba74', '#93c5fd'];
export const avatarColor = id => AVATAR_COLORS[Math.abs(Number(id) || 0) % AVATAR_COLORS.length];

export const formatDate = value => new Date(value).toLocaleDateString();

const UNITS = [
    ['year', 365 * 24 * 3600],
    ['month', 30 * 24 * 3600],
    ['week', 7 * 24 * 3600],
    ['day', 24 * 3600],
    ['hour', 3600],
    ['minute', 60],
];

export const timeAgo = value => {
    const seconds = Math.max(0, (Date.now() - new Date(value).getTime()) / 1000);
    for (const [unit, size] of UNITS) {
        const n = Math.floor(seconds / size);
        if (n >= 1) return `${n} ${unit}${n > 1 ? 's' : ''} ago`;
    }
    return 'just now';
};

/** Plain-text preview of a markdown body. */
export const excerpt = (markdown = '', max = 220) => {
    const text = markdown.replace(/\s+/g, ' ').trim();
    return text.length > max ? `${text.slice(0, max).trimEnd()}...` : text;
};

export const formatBytes = bytes => {
    if (!bytes && bytes !== 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
