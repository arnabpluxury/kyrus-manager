import { usePrefs } from "../lib/prefs";
import { Button } from "./Button";

export function PrefsPanel() {
  const prefs = usePrefs();
  if (!prefs.open) return null;

  return (
    <div className="prefs-backdrop" onClick={() => prefs.setOpen(false)} role="presentation">
      <aside
        className="prefs-panel"
        role="dialog"
        aria-label="Preferences"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="prefs-head">
          <h2>Preferences</h2>
          <Button className="compact" onClick={() => prefs.setOpen(false)}>
            Close
          </Button>
        </div>

        <div className="prefs-section">
          <div className="prefs-label">Appearance</div>
          <div className="prefs-row">
            <div>
              <div className="prefs-name">Theme</div>
              <div className="prefs-hint">Instant light ↔ dark invert of the cream glass UI</div>
            </div>
            <div className="theme-toggle" role="group" aria-label="Theme">
              <button
                type="button"
                className={prefs.theme === "light" ? "on" : ""}
                onClick={() => prefs.setTheme("light")}
              >
                Light
              </button>
              <button
                type="button"
                className={prefs.theme === "dark" ? "on" : ""}
                onClick={() => prefs.setTheme("dark")}
              >
                Dark
              </button>
            </div>
          </div>

          <label className="prefs-row switch-row">
            <div>
              <div className="prefs-name">Rich gradients</div>
              <div className="prefs-hint">Extra depth on nav, sheets, and meters</div>
            </div>
            <input
              type="checkbox"
              checked={prefs.richGradients}
              onChange={(e) => prefs.setRichGradients(e.target.checked)}
            />
          </label>

          <label className="prefs-row switch-row">
            <div>
              <div className="prefs-name">Compact navigation</div>
              <div className="prefs-hint">Tighter sidebar spacing</div>
            </div>
            <input
              type="checkbox"
              checked={prefs.compactNav}
              onChange={(e) => prefs.setCompactNav(e.target.checked)}
            />
          </label>

          <label className="prefs-row switch-row">
            <div>
              <div className="prefs-name">Reduce motion</div>
              <div className="prefs-hint">Minimize loader and press animations</div>
            </div>
            <input
              type="checkbox"
              checked={prefs.reduceMotion}
              onChange={(e) => prefs.setReduceMotion(e.target.checked)}
            />
          </label>
        </div>

        <p className="prefs-foot">
          Changes apply instantly and stay on this PC. System tools always run hidden — no console flash.
        </p>
      </aside>
    </div>
  );
}
