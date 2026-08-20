export function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`shrink-0 text-[var(--muted)] transition-transform duration-150 ${open ? "rotate-180" : ""}`}
      width="18"
      height="18"
      viewBox="0 0 20 20"
      aria-hidden
    >
      <path
        d="M5 8.5 10 13l5-4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
