/**
 * The Precedent lockup.
 *
 * A stamped section mark beside a serif wordmark. It reads as a page from a
 * case file rather than a startup logo, which is the point.
 */
export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`wm ${className}`.trim()}>
      <span className="wm-mark" aria-hidden="true">
        §
      </span>
      <span className="wm-word">Precedent</span>
    </span>
  );
}
