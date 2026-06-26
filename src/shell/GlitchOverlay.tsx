import './glitch.css';

/**
 * Giygas / MissingNo-style distortion. Time-bounded: the shell renders this
 * only while Date.now() < glitchUntil. Purely cosmetic.
 */
export function GlitchOverlay() {
  return (
    <div className="glitch-overlay" aria-hidden="true">
      <div className="glitch-bars" />
      <div className="glitch-noise" />
      <div className="glitch-text">M̷̢͝O̴M̶</div>
    </div>
  );
}
