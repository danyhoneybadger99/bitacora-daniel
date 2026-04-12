export default function RecordForm({
  title,
  fields,
  formData,
  onChange,
  onSubmit,
  onCancel,
  isEditing,
  submitDisabled = false,
  submitLabel,
}) {
  return (
    <form className="record-form" onSubmit={onSubmit}>
      <div className="form-title-row">
        <div>
          <h3>{title}</h3>
          <p>{isEditing ? 'Edita el registro y guarda los cambios.' : 'Completa los campos para agregar un nuevo registro.'}</p>
        </div>
      </div>

      <div className="form-grid">
        {fields.map((field) => {
          if (field.type === 'section') {
            return (
              <div className="form-section-label" key={field.name || field.label}>
                <strong>{field.label}</strong>
                {field.hint ? <p>{field.hint}</p> : null}
              </div>
            );
          }

          if (field.type === 'textarea') {
            return (
              <label className="field field-full" key={field.name}>
                <span>{field.label}</span>
                <textarea
                  name={field.name}
                  value={formData[field.name]}
                  onChange={onChange}
                  placeholder={field.placeholder || ''}
                  rows={field.rows || '3'}
                />
                {field.hint ? <small className="field-hint">{field.hint}</small> : null}
              </label>
            );
          }

          if (field.type === 'select') {
            return (
              <label className="field" key={field.name}>
                <span>{field.label}</span>
                <select name={field.name} value={formData[field.name]} onChange={onChange}>
                  {field.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {field.hint ? <small className="field-hint">{field.hint}</small> : null}
              </label>
            );
          }

          return (
            <label className="field" key={field.name}>
              <span>{field.label}</span>
              <input
                name={field.name}
                type={field.type}
                value={formData[field.name]}
                onChange={onChange}
                placeholder={field.placeholder || ''}
                min={field.min}
                step={field.step}
              />
              {field.hint ? <small className="field-hint">{field.hint}</small> : null}
            </label>
          );
        })}
      </div>

      <div className="form-actions">
        <button className="button button-primary" type="submit" disabled={submitDisabled}>
          {submitLabel || (isEditing ? 'Guardar cambios' : 'Agregar registro')}
        </button>
        {isEditing ? (
          <button className="button button-secondary" type="button" onClick={onCancel}>
            Cancelar edición
          </button>
        ) : null}
      </div>
    </form>
  );
}
