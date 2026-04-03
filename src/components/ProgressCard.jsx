function clampProgress(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

export default function ProgressCard({ title, value, subtitle, progress, tone = 'neutral', helper }) {
  const safeProgress = clampProgress(progress);

  return (
    <article className={`progress-card progress-card-${tone}`}>
      <div className="progress-card-top">
        <span>{title}</span>
        <strong>{value}</strong>
      </div>
      <p>{subtitle}</p>
      <div className="progress-track" aria-hidden="true">
        <div className="progress-fill" style={{ width: `${safeProgress}%` }} />
      </div>
      {helper ? <small>{helper}</small> : null}
    </article>
  );
}
