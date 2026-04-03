export default function SummaryGrid({ items }) {
  return (
    <div className="summary-grid">
      {items.map((item) => (
        <article className="summary-item" key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </article>
      ))}
    </div>
  );
}
