export default function SectionCard({ title, subtitle, children, actions, className = '' }) {
  return (
    <section className={`card ${className}`.trim()}>
      <div className="card-header">
        <div>
          <h2>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {actions ? <div className="card-actions">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}
