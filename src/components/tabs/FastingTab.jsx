import RecordForm from '../RecordForm';
import SectionCard from '../SectionCard';

export default function FastingTab(props) {
  const {
    isTodayFastingFree,
    toggleTodayNoFasting,
    hasActiveRealFastingLog,
    activeFastingLog,
    fastingFeedback,
    displayedFastingStatusLabel,
    displayedFastingSummaryText,
    displayedFastingProtocolLabel,
    activeFastingAutophagy,
    shouldTreatTodayAsFastingFree,
    displayedFastingStatus,
    displayedFastingElapsedLabel,
    activeFastingGoalHours,
    formatHoursLabel,
    activeFastingProgressLabel,
    displayedFastingDisplay,
    getFastingStatusClass,
    activeFastingStatus,
    displayedFastingProgressPercent,
    displayedFastingBreakLabel,
    activeFastingDifferenceHours,
    activeFastingDifferenceText,
    formatDateTimeHuman,
    startFastingNow,
    breakFastingNow,
    markFastingAsCompleted,
    clearFastingTimes,
    editingFastingLogId,
    resetFastingLogForm,
    setEditingFastingLogId,
    setShowFastingManualForm,
    showFastingManualForm,
    fastingLogForm,
    handleFastingLogChange,
    handleFastingLogSubmit,
    fastingFeelingLabels,
    sortedFastingLogs,
    getFastingStatusLabel,
    fastingNow,
    getFastingElapsedHours,
    getEffectiveFastingTargetHours,
    formatFastingStatusCopy,
    getEstimatedFastingBreakDateTime,
    formatDate,
    startEditing,
    deleteRecord,
    startNocturnalFasting,
    start36HourFasting,
    start72HourFasting,
    showFastingProtocolBuilder,
    setShowFastingProtocolBuilder,
    fastingProtocolForm,
    fastingDayLabels,
    fastingTypeLabels,
    handleFastingProtocolChange,
    handleFastingProtocolSubmit,
    resetFastingProtocolForm,
    setEditingFastingProtocolId,
    editingFastingProtocolId,
    sortedFastingProtocols,
    formatProtocolLabel,
  } = props;

  return (
    <div className="fasting-tab-stack">
      <SectionCard title="Resumen de hoy" subtitle="Vista rapida basada solo en registros reales y días libres." className="card-soft fasting-today-summary-card">
        <div className="section-inline-actions section-inline-actions-tight fasting-day-toggle">
          <button
            className={`button ${isTodayFastingFree ? 'button-primary' : 'button-secondary'}`}
            type="button"
            onClick={toggleTodayNoFasting}
            disabled={hasActiveRealFastingLog()}
          >
            {isTodayFastingFree ? 'Quitar día libre' : 'Hoy no hay ayuno'}
          </button>
          <span className="section-helper">
            {hasActiveRealFastingLog()
              ? 'Rompe o cierra el ayuno activo antes de marcar día libre.'
              : isTodayFastingFree
                ? activeFastingLog
                  ? 'Hay un ayuno real activo; el día libre no sobrescribe ese registro.'
                  : 'Hoy queda excluido del seguimiento de ayuno.'
                : 'Marca el día como libre si no quieres ayuno hoy.'}
          </span>
        </div>
        {fastingFeedback.text ? (
          <div className="alert-banner">
            <strong>{fastingFeedback.type === 'warning' ? 'Atencion:' : 'Ayuno:'}</strong> {fastingFeedback.text}
          </div>
        ) : null}
        <div className="supplement-summary-grid fasting-summary-grid">
          <div className="supplement-summary-card fasting-summary-primary-card fasting-summary-card-status">
            <span>Estado real</span>
            <strong>{displayedFastingStatusLabel}</strong>
            <small className="fasting-summary-note">{displayedFastingSummaryText}</small>
          </div>
          <div className="supplement-summary-card fasting-summary-card-protocol">
            <span>Registro de hoy</span>
            <strong>{displayedFastingProtocolLabel}</strong>
            {activeFastingAutophagy && !shouldTreatTodayAsFastingFree ? <small className="fasting-summary-note">Hito visual activado desde 16 h de ayuno activo.</small> : null}
          </div>
          <div className="supplement-summary-card fasting-summary-card-elapsed">
            <span>Horas acumuladas</span>
            <strong>{displayedFastingStatus === 'pendiente' ? 'Sin registro' : displayedFastingElapsedLabel}</strong>
          </div>
          <div className="supplement-summary-card fasting-summary-card-goal">
            <span>Meta del registro</span>
            <strong>{shouldTreatTodayAsFastingFree ? 'Día libre' : activeFastingGoalHours ? formatHoursLabel(activeFastingGoalHours) : 'Sin meta definida'}</strong>
          </div>
          <div className="supplement-summary-card fasting-summary-card-progress">
            <span>Progreso</span>
            <strong>{activeFastingProgressLabel}</strong>
          </div>
        </div>
        <div className="fasting-live-card fasting-today-live-card">
          <div className="fasting-live-header">
            <div>
              <strong>{displayedFastingDisplay}</strong>
              <span>{displayedFastingSummaryText}</span>
              {activeFastingAutophagy && !shouldTreatTodayAsFastingFree ? <small className="fasting-summary-note">Hito visual activado desde 16 h de ayuno activo.</small> : null}
            </div>
            <div className="fasting-live-badges">
              {activeFastingAutophagy && !shouldTreatTodayAsFastingFree ? <span className="fasting-autophagy-badge">En autofagia</span> : null}
              <span className={`metrics-source-chip ${getFastingStatusClass(shouldTreatTodayAsFastingFree ? 'cumplido' : activeFastingStatus)}`}>
                {displayedFastingStatusLabel}
              </span>
            </div>
          </div>
          <div className="progress-track" aria-hidden="true">
            <div className="progress-fill" style={{ width: `${displayedFastingStatus === 'pendiente' || shouldTreatTodayAsFastingFree ? 0 : Math.min(displayedFastingProgressPercent, 100)}%` }} />
          </div>
          <div className="fasting-live-metrics">
            <div className="fasting-live-metric">
              <span>Estado</span>
              <strong>{displayedFastingStatusLabel}</strong>
            </div>
            <div className="fasting-live-metric">
              <span>Acumulado</span>
              <strong>{displayedFastingStatus === 'pendiente' ? 'Sin registro' : displayedFastingElapsedLabel}</strong>
            </div>
            <div className="fasting-live-metric">
              <span>Objetivo</span>
              <strong>{shouldTreatTodayAsFastingFree ? 'Día libre' : activeFastingGoalHours ? formatHoursLabel(activeFastingGoalHours) : 'Sin meta'}</strong>
            </div>
            <div className="fasting-live-metric">
              <span>Progreso</span>
              <strong>{activeFastingProgressLabel}</strong>
            </div>
          </div>
          <div className="entry-details">
            <span>{activeFastingLog?.actualStartDateTime ? `Inicio real ${formatDateTimeHuman(activeFastingLog.actualStartDateTime)}` : 'Inicio real sin dato'}</span>
            <span>{displayedFastingBreakLabel}</span>
            {displayedFastingStatus === 'roto' && activeFastingDifferenceHours !== null ? <span>{activeFastingDifferenceText}</span> : null}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Registro real del día" subtitle="Captura manual. Esto es lo que manda Dashboard, Ayuno y Semanal." className="card-soft fasting-section-card">
        <div className="fasting-columns">
          <div className="fasting-column">
            <div className="fasting-action-panel">
              <div className="entry-actions fasting-quick-actions fasting-primary-actions">
                <button className={`button ${hasActiveRealFastingLog() ? 'button-secondary' : 'button-primary'}`} type="button" onClick={startFastingNow}>
                  Iniciar ahora
                </button>
                <button className={`button ${hasActiveRealFastingLog() ? 'button-primary' : 'button-secondary'}`} type="button" onClick={breakFastingNow}>
                  Romper ayuno ahora
                </button>
                <button className="button button-secondary" type="button" onClick={markFastingAsCompleted}>
                  Marcar como cumplido
                </button>
              </div>
              <div className="entry-actions fasting-quick-actions fasting-secondary-actions">
                <button className="button button-secondary" type="button" onClick={toggleTodayNoFasting} disabled={hasActiveRealFastingLog()}>
                  Marcar día libre
                </button>
                <button className="button button-secondary" type="button" onClick={clearFastingTimes}>
                  Limpiar horas
                </button>
                <button
                  className="button button-secondary"
                  type="button"
                  onClick={() => {
                    if (editingFastingLogId) {
                      resetFastingLogForm();
                      setEditingFastingLogId(null);
                      setShowFastingManualForm(false);
                      return;
                    }
                    setShowFastingManualForm((current) => !current);
                  }}
                >
                  {showFastingManualForm || editingFastingLogId ? 'Ocultar registro manual' : 'Agregar registro manual'}
                </button>
              </div>
            </div>
            {showFastingManualForm || editingFastingLogId ? (
              <RecordForm
                title="Registro manual avanzado"
                fields={[
                  { name: 'date', label: 'Fecha', type: 'date' },
                  { name: 'expectedProtocol', label: 'Plantilla o tipo de ayuno', type: 'text', placeholder: 'Ej. Ayuno 36 horas, 12 h nocturno, 72 horas...' },
                  { name: 'targetHours', label: 'Meta manual (horas)', type: 'number', min: '0', step: '0.1' },
                  { name: 'actualStartDateTime', label: 'Fecha y hora real de inicio', type: 'datetime-local' },
                  { name: 'actualBreakDateTime', label: 'Fecha y hora real de ruptura (solo si ya terminó)', type: 'datetime-local' },
                  { name: 'actualDuration', label: 'Duracion real (horas)', type: 'number', min: '0', step: '0.1' },
                  {
                    name: 'completed',
                    label: 'Cumplido',
                    type: 'select',
                    options: [
                      { value: 'si', label: 'Si' },
                      { value: 'no', label: 'No' },
                    ],
                  },
                  {
                    name: 'hunger',
                    label: 'Hambre',
                    type: 'select',
                    options: Object.entries(fastingFeelingLabels).map(([value, label]) => ({ value, label })),
                  },
                  {
                    name: 'energy',
                    label: 'Energía',
                    type: 'select',
                    options: Object.entries(fastingFeelingLabels).map(([value, label]) => ({ value, label })),
                  },
                  {
                    name: 'cravings',
                    label: 'Antojos',
                    type: 'select',
                    options: Object.entries(fastingFeelingLabels).map(([value, label]) => ({ value, label })),
                  },
                  { name: 'notes', label: 'Notas', type: 'textarea', placeholder: 'Cómo te sentiste, desviaciones o contexto...' },
                ]}
                formData={fastingLogForm}
                onChange={handleFastingLogChange}
                onSubmit={handleFastingLogSubmit}
                onCancel={() => {
                  resetFastingLogForm();
                  setEditingFastingLogId(null);
                  setShowFastingManualForm(false);
                }}
                isEditing={Boolean(editingFastingLogId)}
              />
            ) : (
              <p className="section-helper fasting-manual-helper">Usa el registro manual solo para corregir fechas, meta, duración o sensaciones. Las acciones rápidas cubren el uso diario.</p>
            )}
          </div>

          <div className="fasting-column">
            <div className="fasting-live-card fasting-active-summary-card">
              <div className="fasting-live-header">
                <div>
                  <strong>{displayedFastingProtocolLabel || 'Sin protocolo esperado'}</strong>
                  <span>Resumen del ayuno activo: {displayedFastingStatusLabel}</span>
                </div>
                <span className={`metrics-source-chip ${getFastingStatusClass(shouldTreatTodayAsFastingFree ? 'cumplido' : activeFastingStatus)}`}>
                  {activeFastingProgressLabel}
                </span>
              </div>
              <div className="fasting-live-metrics">
                <div className="fasting-live-metric">
                  <span>Transcurrido</span>
                  <strong>{displayedFastingStatus === 'pendiente' ? 'Sin registro' : displayedFastingElapsedLabel}</strong>
                </div>
                <div className="fasting-live-metric">
                  <span>Objetivo</span>
                  <strong>{shouldTreatTodayAsFastingFree ? 'Día libre' : activeFastingGoalHours ? formatHoursLabel(activeFastingGoalHours) : 'Sin meta'}</strong>
                </div>
                <div className="fasting-live-metric">
                  <span>Estado</span>
                  <strong>{displayedFastingStatusLabel}</strong>
                </div>
                <div className="fasting-live-metric">
                  <span>Progreso</span>
                  <strong>{activeFastingProgressLabel}</strong>
                </div>
              </div>
              <div className="entry-details">
                <span>{activeFastingLog?.actualStartDateTime ? `Inicio real ${formatDateTimeHuman(activeFastingLog.actualStartDateTime)}` : 'Inicio real sin dato'}</span>
                <span>{displayedFastingBreakLabel}</span>
                {activeFastingStatus === 'roto' ? <span>{activeFastingDifferenceText}</span> : null}
              </div>
            </div>

            <div className="metrics-card-list">
              {sortedFastingLogs.length === 0 ? <p className="empty-state">Todavía no has registrado ayunos.</p> : null}
              {sortedFastingLogs.map((item) => {
                const status = getFastingStatusLabel(item, null, fastingNow);
                const durationHours = getFastingElapsedHours(item, fastingNow);
                const expected = getEffectiveFastingTargetHours(item, null);
                const goalReachedWhileActive = status === 'en curso' && expected > 0 && durationHours >= expected;
                const statusLabel = formatFastingStatusCopy(status, { reachedGoal: goalReachedWhileActive });
                const estimatedBreakDateTime = getEstimatedFastingBreakDateTime(item.actualStartDateTime, expected);

                return (
                  <article className="metrics-card" key={item.id}>
                    <div className="metrics-card-top">
                      <div>
                        <strong>{item.expectedProtocol || 'Sin protocolo esperado'}</strong>
                        <span>{formatDate(item.date)}</span>
                      </div>
                      <span className={`metrics-source-chip ${getFastingStatusClass(status)}`}>
                        {statusLabel}
                      </span>
                    </div>
                    <div className="entry-details">
                      <span>{item.actualStartDateTime ? `Inicio ${formatDateTimeHuman(item.actualStartDateTime)}` : 'Inicio real sin dato'}</span>
                      <span>
                        {item.actualBreakDateTime && status !== 'en curso'
                          ? `Ruptura real ${formatDateTimeHuman(item.actualBreakDateTime)}`
                          : item.actualBreakDateTime && status === 'en curso'
                            ? `Ruptura estimada ${formatDateTimeHuman(item.actualBreakDateTime)}`
                            : status === 'en curso' && estimatedBreakDateTime
                              ? `Ruptura estimada ${formatDateTimeHuman(estimatedBreakDateTime)}`
                              : status === 'en curso'
                                ? 'Ruptura pendiente'
                                : 'Ruptura real sin dato'}
                      </span>
                      <span>{durationHours > 0 ? `${formatHoursLabel(durationHours)} acumuladas` : 'Sin duracion'}</span>
                      {goalReachedWhileActive ? <span>Meta alcanzada · ayuno en curso</span> : null}
                      {expected > 0 && status === 'roto' ? <span>Faltaron {formatHoursLabel(Math.max(expected - durationHours, 0))}</span> : null}
                      <span>Hambre {fastingFeelingLabels[item.hunger] || item.hunger}</span>
                      <span>Energía {fastingFeelingLabels[item.energy] || item.energy}</span>
                    </div>
                    {item.notes ? <p className="metrics-notes">{item.notes}</p> : null}
                    <div className="entry-actions">
                      <button
                        className="button button-secondary"
                        type="button"
                        onClick={() => {
                          setShowFastingManualForm(true);
                          startEditing('fastingLogs', item.id, props.setFastingLogForm, setEditingFastingLogId, 'fasting');
                        }}
                      >
                        Editar
                      </button>
                      <button
                        className="button button-danger"
                        type="button"
                        onClick={() => deleteRecord('fastingLogs', item.id, setEditingFastingLogId, resetFastingLogForm)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Plantillas de apoyo" subtitle="Atajos secundarios para crear registros reales. No deciden el estado del día." className="card-soft fasting-section-card fasting-templates-card">
        <div className="entry-actions fasting-quick-actions">
          <button className="button button-secondary" type="button" onClick={startNocturnalFasting}>
            Iniciar 12 h nocturno
          </button>
          <button className="button button-secondary" type="button" onClick={start36HourFasting}>
            Iniciar 36 h
          </button>
          <button className="button button-secondary" type="button" onClick={start72HourFasting}>
            Iniciar 72 h
          </button>
          <button className="button button-secondary" type="button" onClick={toggleTodayNoFasting} disabled={hasActiveRealFastingLog()}>
            Marcar día libre
          </button>
          <button className="button button-secondary" type="button" onClick={() => setShowFastingProtocolBuilder((current) => !current)}>
            {showFastingProtocolBuilder ? 'Ocultar plantillas avanzadas' : 'Mostrar plantillas avanzadas'}
          </button>
        </div>

        {showFastingProtocolBuilder ? (
          <div className="fasting-columns fasting-advanced-templates">
            <div className="fasting-column">
              <RecordForm
                title="Plantilla semanal opcional"
                fields={[
                  {
                    name: 'dayOfWeek',
                    label: 'Día de la semana',
                    type: 'select',
                    options: Object.entries(fastingDayLabels).map(([value, label]) => ({ value, label })),
                  },
                  {
                    name: 'fastingType',
                    label: 'Tipo de ayuno',
                    type: 'select',
                    options: Object.entries(fastingTypeLabels).map(([value, label]) => ({ value, label })),
                  },
                  { name: 'startTime', label: 'Hora de inicio', type: 'time' },
                  { name: 'eatingWindow', label: 'Hora de fin o ventana de comida', type: 'text', placeholder: 'Ej. 07:00 a 08:00 o protocolo esperado' },
                  { name: 'expectedDuration', label: 'Duracion esperada (horas)', type: 'number', min: '0', step: '0.1' },
                  { name: 'notes', label: 'Notas opcionales', type: 'textarea', placeholder: 'Contexto, flexibilidad o recordatorios...' },
                ]}
                formData={fastingProtocolForm}
                onChange={handleFastingProtocolChange}
                onSubmit={handleFastingProtocolSubmit}
                onCancel={() => {
                  resetFastingProtocolForm();
                  setEditingFastingProtocolId(null);
                }}
                isEditing={Boolean(editingFastingProtocolId)}
              />
            </div>

            <div className="fasting-column">
              <div className="fasting-protocol-list">
                {sortedFastingProtocols.length === 0 ? <p className="empty-state">Aun no tienes plantillas semanales guardadas.</p> : null}
                {sortedFastingProtocols.map((item) => (
                  <article className="fasting-protocol-item" key={item.id}>
                    <div className="fasting-protocol-content">
                      <div className="fasting-protocol-main">
                        <strong className="fasting-protocol-day">{fastingDayLabels[item.dayOfWeek] || item.dayOfWeek}</strong>
                        <span className="fasting-protocol-type">{`Plantilla: ${formatProtocolLabel(item)}`}</span>
                      </div>
                      <div className="fasting-protocol-meta">
                        <span className="fasting-protocol-goal">{item.expectedDuration ? `Objetivo ${item.expectedDuration} h` : 'Sin duracion'}</span>
                        <span className="fasting-protocol-window">{item.eatingWindow || 'Sin ventana definida'}</span>
                        {item.notes ? <span className="fasting-protocol-window">{item.notes}</span> : null}
                      </div>
                    </div>
                    <div className="entry-actions fasting-protocol-actions">
                      <button
                        className="button button-secondary"
                        type="button"
                        onClick={() => startEditing('fastingProtocols', item.id, props.setFastingProtocolForm, setEditingFastingProtocolId, 'fasting')}
                      >
                        Editar
                      </button>
                      <button
                        className="button button-danger"
                        type="button"
                        onClick={() => deleteRecord('fastingProtocols', item.id, setEditingFastingProtocolId, resetFastingProtocolForm)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p className="section-helper">Las plantillas son apoyo opcional. El estado diario sigue saliendo solo de registros reales o días libres.</p>
        )}
      </SectionCard>
    </div>
  );
}
