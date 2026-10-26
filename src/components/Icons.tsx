import type { SVGProps } from 'react';

const base = (p: SVGProps<SVGSVGElement>) => ({
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false,
  ...p,
});

export const IconStar = ({ filled, ...p }: SVGProps<SVGSVGElement> & { filled?: boolean }) => (
  <svg {...base(p)} fill={filled ? 'currentColor' : 'none'}>
    <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9 6.8 19.7l1-5.9L3.5 9.7l5.9-.8z" />
  </svg>
);
export const IconCheck = ({ filled, ...p }: SVGProps<SVGSVGElement> & { filled?: boolean }) => (
  <svg {...base(p)}>
    {filled ? <circle cx="12" cy="12" r="9" fill="currentColor" stroke="none" /> : <circle cx="12" cy="12" r="9" />}
    <path d="M8 12.4l2.7 2.7L16 9.6" stroke={filled ? 'var(--bg)' : 'currentColor'} />
  </svg>
);
export const IconNote = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M5 4h10l4 4v12H5z" />
    <path d="M9 12h6M9 16h4" />
  </svg>
);
export const IconUp = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M6 14l6-6 6 6" />
  </svg>
);
export const IconDown = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M6 10l6 6 6-6" />
  </svg>
);
export const IconSearch = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16l4.5 4.5" />
  </svg>
);
export const IconCards = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="5" y="3.5" width="14" height="17" rx="2.5" />
    <path d="M9 8h6M9 12h6" />
  </svg>
);
export const IconCalendar = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="4" y="5.5" width="16" height="14.5" rx="2.5" />
    <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" />
  </svg>
);
export const IconBook = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M5 4.5h10a3 3 0 013 3V20H8a3 3 0 01-3-3z" />
    <path d="M5 17a3 3 0 013-3h10" />
  </svg>
);
export const IconUser = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="12" cy="8.5" r="3.6" />
    <path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" />
  </svg>
);
export const IconClose = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);
export const IconExternal = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)} width={14} height={14}>
    <path d="M14 5h5v5M19 5l-8 8M18 14v5H5V6h5" />
  </svg>
);
export const IconPin = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)} width={16} height={16}>
    <path d="M12 21s6.5-5.6 6.5-11A6.5 6.5 0 005.5 10c0 5.4 6.5 11 6.5 11z" />
    <circle cx="12" cy="10" r="2.3" />
  </svg>
);
