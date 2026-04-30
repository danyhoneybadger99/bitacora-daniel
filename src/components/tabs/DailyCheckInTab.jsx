import SectionCard from '../SectionCard';

const scaleOptions = Array.from({ length: 10 }, (_, index) => String(index + 1));

async function shareReflection(text) {
  const reflection = text.trim();
  if (!reflection) return;

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    await navigator.share({
      title: 'Reflexión diaria',
      text: reflection,
    });
    return;
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(reflection);
  }
}

export default function DailyCheckInTab({
  checkInForm,
  todayCheckIn,
  checkInEmotionOptions,
  formatDate,
  onFieldChange,
  onEmotionToggle,
  onSubmit,
}) {
  const selectedEmotions = Array.isArray(checkInForm.emotions) ? checkInForm.emotions : [];
  const gratitudeText = checkInForm.gratitudeText || '';
  const hasReflection = gratitudeText.trim().length > 0;

  return (
    <SectionCard
      title="Check-in diario"
      subtitle="Registro rápido del estado personal de hoy. Un solo registro por día, editable."
      className="card-soft daily-checkin-card"
    >
      <div className="daily-checkin-head">
        <div>
          <span>Hoy</span>
          <strong>{formatDate(checkInForm.date)}</strong>
        </div>
        <div>
          <span>Estado</span>
          <strong>{todayCheckIn ? 'Editando registro' : 'Sin registrar'}</strong>
        </div>
      </div>

      <form className="daily-checkin-form" onSubmit={onSubmit}>
        <div className="daily-checkin-scale-grid">
          <label className="field">
            <span>Estado general</span>
            <select name="generalState" value={checkInForm.generalState} onChange={onFieldChange}>
              {scaleOptions.map((value) => (
                <option key={`general-${value}`} value={value}>
                  {value}/10
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Energía</span>
            <select name="energy" value={checkInForm.energy} onChange={onFieldChange}>
              {scaleOptions.map((value) => (
                <option key={`energy-${value}`} value={value}>
                  {value}/10
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Calidad de sueño</span>
            <select name="sleepQuality" value={checkInForm.sleepQuality} onChange={onFieldChange}>
              {scaleOptions.map((value) => (
                <option key={`sleep-${value}`} value={value}>
                  {value}/10
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="daily-checkin-emotions">
          <div className="daily-checkin-label-row">
            <strong>Emociones</strong>
            <small>{selectedEmotions.length > 0 ? `${selectedEmotions.length} seleccionadas` : 'Selecciona las que apliquen'}</small>
          </div>
          <div className="daily-checkin-chip-grid">
            {checkInEmotionOptions.map((emotion) => {
              const isSelected = selectedEmotions.includes(emotion.value);
              return (
                <button
                  className={`daily-checkin-chip ${isSelected ? 'daily-checkin-chip-active' : ''}`}
                  key={emotion.value}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onEmotionToggle(emotion.value)}
                >
                  {emotion.label}
                </button>
              );
            })}
          </div>
        </div>

        <label className="field field-full">
          <span>Nota libre</span>
          <textarea
            name="note"
            value={checkInForm.note}
            onChange={onFieldChange}
            maxLength={220}
            placeholder="Ej: buen día, energía estable, algo de estrés por la tarde."
            rows="3"
          />
          <small className="field-hint">{checkInForm.note.length}/220 caracteres</small>
        </label>

        <div className="daily-checkin-gratitude">
          <div className="daily-checkin-label-row">
            <strong>Gratitud / poder superior</strong>
            <small>Cuarto pilar del día</small>
          </div>

          <button
            className={`daily-checkin-chip daily-checkin-gratitude-toggle ${checkInForm.gratitudeDone ? 'daily-checkin-chip-active' : ''}`}
            type="button"
            aria-pressed={Boolean(checkInForm.gratitudeDone)}
            onClick={() =>
              onFieldChange({
                target: {
                  name: 'gratitudeDone',
                  value: !checkInForm.gratitudeDone,
                },
              })
            }
          >
            {checkInForm.gratitudeDone ? 'Agradecí hoy' : 'Agradecí hoy'}
          </button>

          <label className="field field-full">
            <span>Gratitud o reflexión</span>
            <textarea
              name="gratitudeText"
              value={gratitudeText}
              onChange={onFieldChange}
              maxLength={180}
              placeholder="Escribe una frase breve de agradecimiento, orientación o reflexión."
              rows="2"
            />
            <small className="field-hint">{gratitudeText.length}/180 caracteres</small>
          </label>

          {hasReflection ? (
            <button
              className="button button-secondary daily-checkin-share-button"
              type="button"
              onClick={() => {
                shareReflection(gratitudeText).catch(() => {});
              }}
            >
              Compartir reflexión
            </button>
          ) : null}
        </div>

        <div className="form-actions daily-checkin-actions">
          <button className="button button-primary" type="submit">
            {todayCheckIn ? 'Actualizar check-in' : 'Guardar check-in'}
          </button>
        </div>
      </form>
    </SectionCard>
  );
}
