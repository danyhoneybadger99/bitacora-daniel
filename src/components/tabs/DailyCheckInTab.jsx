import SectionCard from '../SectionCard';
import { getDailyCheckInTrafficLight } from '../../utils/domain/checkIn';

const scaleOptions = Array.from({ length: 10 }, (_, index) => String(index + 1));

function ScaleField({ label, name, value, onChange, optional = false }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select name={name} value={value || ''} onChange={onChange}>
        {optional ? <option value="">Sin registrar</option> : null}
        {scaleOptions.map((optionValue) => (
          <option key={`${name}-${optionValue}`} value={optionValue}>
            {optionValue}/10
          </option>
        ))}
      </select>
    </label>
  );
}

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
  showSpiritualSection = false,
  massAttendedThisWeek = false,
  massAttendanceStreak = 0,
  onSpiritualMassToggle,
  onSubmit,
}) {
  const selectedEmotions = Array.isArray(checkInForm.emotions) ? checkInForm.emotions : [];
  const gratitudeText = checkInForm.gratitudeText || '';
  const hasReflection = gratitudeText.trim().length > 0;
  const trafficLight = getDailyCheckInTrafficLight(checkInForm);

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
          <ScaleField label="Estado general" name="generalState" value={checkInForm.generalState} onChange={onFieldChange} />
          <ScaleField label="Energía" name="energy" value={checkInForm.energy} onChange={onFieldChange} />
          <ScaleField label="Calidad de sueño" name="sleepQuality" value={checkInForm.sleepQuality} onChange={onFieldChange} />
          <ScaleField
            label="Estrés / tensión"
            name="stressLevel"
            value={checkInForm.stressLevel}
            onChange={onFieldChange}
            optional
          />
          <ScaleField
            label="Preparación física"
            name="physicalReadiness"
            value={checkInForm.physicalReadiness}
            onChange={onFieldChange}
            optional
          />
        </div>

        <div className={`daily-checkin-traffic daily-checkin-traffic-${trafficLight.status}`}>
          <div>
            <span>Semáforo personal</span>
            <strong>{trafficLight.label}</strong>
          </div>
          <p>{trafficLight.summary}</p>
          <small>Esto es una herramienta de seguimiento personal; no sustituye orientación profesional.</small>
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

        <div className="daily-checkin-support-grid">
          <div className="daily-checkin-support-card">
            <div className="daily-checkin-label-row">
              <strong>Dolor o lesión</strong>
              <small>Opcional</small>
            </div>
            <button
              className={`daily-checkin-chip ${checkInForm.painOrInjury ? 'daily-checkin-chip-active' : ''}`}
              type="button"
              aria-pressed={Boolean(checkInForm.painOrInjury)}
              onClick={() =>
                onFieldChange({
                  target: {
                    name: 'painOrInjury',
                    value: !checkInForm.painOrInjury,
                  },
                })
              }
            >
              Dolor o lesión
            </button>
            <label className="field field-full">
              <span>Detalle breve</span>
              <input
                type="text"
                name="painOrInjuryNote"
                value={checkInForm.painOrInjuryNote || ''}
                onChange={onFieldChange}
                maxLength={120}
                placeholder="Ej: rodilla sensible, hombro cargado."
              />
            </label>
          </div>

          <label className="field field-full daily-checkin-minimum-action">
            <span>Mínimo del día</span>
            <textarea
              name="minimumAction"
              value={checkInForm.minimumAction || ''}
              onChange={onFieldChange}
              maxLength={140}
              placeholder="Ej: caminar 20 min, tomar agua, repasar una técnica."
              rows="2"
            />
            <small className="field-hint">{(checkInForm.minimumAction || '').length}/140 caracteres</small>
          </label>
        </div>

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
            Agradecí hoy
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

        {showSpiritualSection ? (
          <div className="daily-checkin-spiritual">
            <div className="daily-checkin-label-row">
              <div>
                <strong>Vida espiritual</strong>
                <small>Seguimiento personal semanal.</small>
              </div>
              <span className="daily-checkin-spiritual-streak">
                {`Racha de misa: ${massAttendanceStreak} ${massAttendanceStreak === 1 ? 'semana seguida' : 'semanas seguidas'}`}
              </span>
            </div>

            <div className="daily-checkin-spiritual-actions">
              <button
                className={`daily-checkin-chip daily-checkin-spiritual-toggle ${massAttendedThisWeek ? 'daily-checkin-chip-active' : ''}`}
                type="button"
                aria-pressed={Boolean(massAttendedThisWeek)}
                onClick={onSpiritualMassToggle}
              >
                Fui a misa esta semana
              </button>

              <button
                className={`daily-checkin-chip daily-checkin-spiritual-toggle ${checkInForm.confessionReady ? 'daily-checkin-chip-active' : ''}`}
                type="button"
                aria-pressed={Boolean(checkInForm.confessionReady)}
                onClick={() =>
                  onFieldChange({
                    target: {
                      name: 'confessionReady',
                      value: !checkInForm.confessionReady,
                    },
                  })
                }
              >
                Estoy confesado para comulgar
              </button>
            </div>

            {checkInForm.confessionReady ? (
              <span className="daily-checkin-spiritual-status">Confesado para comulgar</span>
            ) : null}
          </div>
        ) : null}

        <div className="form-actions daily-checkin-actions">
          <button className="button button-primary" type="submit">
            {todayCheckIn ? 'Actualizar check-in' : 'Guardar check-in'}
          </button>
        </div>
      </form>
    </SectionCard>
  );
}
