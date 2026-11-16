import { avatarColor, initials } from '../../lib/format.js';

export default function Avatar({ person, size = 40, ring = false }) {
    if (!person) return null;
    return (
        <span
            aria-hidden="true"
            style={{
                flex: 'none',
                width: size,
                height: size,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                fontSize: Math.round(size * 0.4),
                fontWeight: 500,
                color: '#0f172a',
                background: avatarColor(person.id),
                boxShadow: ring ? '0 0 0 2px #fdba74' : 'none',
            }}
        >
            {initials(person.firstName, person.lastName)}
        </span>
    );
}
