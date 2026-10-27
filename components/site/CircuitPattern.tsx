/**
 * Faint circuit-trace background. Carried over from the original landing page
 * (components/landing/LandingPage.tsx) so the promotional site keeps the same
 * texture. Colour comes from `currentColor`; set `text-amber` on a parent.
 */
export function CircuitPattern({ className = "", id = "circuit" }: { className?: string; id?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={`absolute inset-0 pointer-events-none ${className}`}
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id={id} x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
          <line x1="0" y1="30" x2="50" y2="30" stroke="currentColor" strokeWidth="1" opacity="0.15" />
          <line x1="70" y1="30" x2="120" y2="30" stroke="currentColor" strokeWidth="1" opacity="0.1" />
          <line x1="0" y1="90" x2="40" y2="90" stroke="currentColor" strokeWidth="1" opacity="0.1" />
          <line x1="80" y1="90" x2="120" y2="90" stroke="currentColor" strokeWidth="1" opacity="0.12" />
          <line x1="50" y1="30" x2="50" y2="60" stroke="currentColor" strokeWidth="1" opacity="0.12" />
          <line x1="70" y1="0" x2="70" y2="30" stroke="currentColor" strokeWidth="1" opacity="0.1" />
          <line x1="80" y1="60" x2="80" y2="90" stroke="currentColor" strokeWidth="1" opacity="0.1" />
          <line x1="50" y1="60" x2="80" y2="60" stroke="currentColor" strokeWidth="1" opacity="0.12" />
          <line x1="40" y1="90" x2="40" y2="110" stroke="currentColor" strokeWidth="1" opacity="0.08" />
          <circle cx="50" cy="30" r="2" fill="currentColor" opacity="0.2" />
          <circle cx="70" cy="30" r="2" fill="currentColor" opacity="0.15" />
          <circle cx="80" cy="90" r="2" fill="currentColor" opacity="0.15" />
          <circle cx="50" cy="60" r="2" fill="currentColor" opacity="0.18" />
          <circle cx="80" cy="60" r="2" fill="currentColor" opacity="0.15" />
          <circle cx="40" cy="90" r="2" fill="currentColor" opacity="0.12" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
