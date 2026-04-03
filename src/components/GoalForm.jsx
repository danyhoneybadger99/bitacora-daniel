export default function GoalForm({ formData, onChange, onSubmit }) {
  return (
    <form className="goal-form" onSubmit={onSubmit}>
      <div className="goal-grid">
        <label className="field">
          <span>Meta de calorias</span>
          <input name="calories" type="number" min="0" step="1" value={formData.calories} onChange={onChange} />
        </label>

        <label className="field">
          <span>Meta minima de proteina (g)</span>
          <input name="protein" type="number" min="0" step="1" value={formData.protein} onChange={onChange} />
        </label>

        <label className="field">
          <span>Peso objetivo (kg)</span>
          <input name="weight" type="number" min="0" step="0.1" value={formData.weight} onChange={onChange} />
        </label>

        <label className="field">
          <span>Meta base de hidratacion (ml)</span>
          <input
            name="hydrationBase"
            type="number"
            min="0"
            step="50"
            value={formData.hydrationBase}
            onChange={onChange}
          />
        </label>

        <label className="field">
          <span>Meta alta actividad (ml)</span>
          <input
            name="hydrationHighActivity"
            type="number"
            min="0"
            step="50"
            value={formData.hydrationHighActivity}
            onChange={onChange}
          />
        </label>
      </div>

      <div className="form-actions">
        <button className="button button-primary" type="submit">
          Guardar metas
        </button>
      </div>
    </form>
  );
}
