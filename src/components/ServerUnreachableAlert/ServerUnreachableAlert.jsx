import { useEffect, useState } from "react";
import { SERVER_UNREACHABLE_EVENT } from "../../utils/serverStatusInterceptor";
import "./ServerUnreachableAlert.css";

const RETRY_SECONDS = 10;

export default function ServerUnreachableAlert() {
  const [open, setOpen] = useState(false);
  const [seconds, setSeconds] = useState(RETRY_SECONDS);

  useEffect(() => {
    const show = () => {
      setOpen(true);
      setSeconds(RETRY_SECONDS);
    };
    window.addEventListener(SERVER_UNREACHABLE_EVENT, show);
    return () => window.removeEventListener(SERVER_UNREACHABLE_EVENT, show);
  }, []);

  useEffect(() => {
    if (!open || seconds <= 0) return;
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [open, seconds]);

  if (!open) return null;

  return (
    <div className="sua-overlay" role="alertdialog" aria-modal="true" aria-labelledby="sua-title">
      <div className="sua-card">
        <div className="sua-icon">
          <span className="sua-pulse" />
          <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="8" rx="2" />
            <rect x="2" y="13" width="20" height="8" rx="2" />
            <line x1="6" y1="7" x2="6.01" y2="7" />
            <line x1="6" y1="17" x2="6.01" y2="17" />
          </svg>
        </div>

        <h2 id="sua-title" className="sua-title">Server Unreachable</h2>
        <p className="sua-message">
          The server is unreachable currently. It is starting up — please wait a few seconds and try again.
        </p>

        <div className="sua-progress">
          <div
            className="sua-progress-bar"
            style={{ width: `${((RETRY_SECONDS - seconds) / RETRY_SECONDS) * 100}%` }}
          />
        </div>
        <p className="sua-countdown">
          {seconds > 0 ? `You can retry in ${seconds}s` : "The server should be ready now."}
        </p>

        <div className="sua-actions">
          <button className="sua-btn sua-btn-secondary" onClick={() => setOpen(false)}>
            Dismiss
          </button>
          <button
            className="sua-btn sua-btn-primary"
            disabled={seconds > 0}
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}
