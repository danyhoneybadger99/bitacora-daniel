export default function EntryList({ title, emptyMessage, items, renderDetails, onEdit, onDelete, renderActions, className = '' }) {
  return (
    <div className={`entry-list ${className}`.trim()}>
      <div className="list-header">
        <h3>{title}</h3>
      </div>

      {items.length === 0 ? <p className="empty-state">{emptyMessage}</p> : null}

      {items.map((item) => (
        <article className="entry-item" key={item.id}>
          <div className="entry-main">
            <strong>{item.primaryLabel}</strong>
            <span>{item.secondaryLabel}</span>
            <div className="entry-details">{renderDetails(item)}</div>
          </div>
          <div className="entry-actions">
            {renderActions ? renderActions(item) : null}
            <button className="button button-secondary" type="button" onClick={() => onEdit(item.id)}>
              Editar
            </button>
            <button className="button button-danger" type="button" onClick={() => onDelete(item.id)}>
              Eliminar
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
