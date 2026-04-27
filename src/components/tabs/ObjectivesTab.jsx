import SectionCard from '../SectionCard';

export default function ObjectivesTab(props) {
  const {
    activeObjective,
    activeObjectiveProgress,
    objectiveTypeLabels,
    formatMetricText,
    objectiveStatusLabels,
    handleObjectiveSubmit,
    objectiveForm,
    handleFormChange,
    setObjectiveForm,
    objectiveFormProgress,
    isObjectiveCutGoal,
    cutReferenceTdee,
    cutReferenceCutRangeLabel,
    cutReferenceMacrosLabel,
    hasCutReferenceLoaded,
    cutReferenceCutMin,
    cutReferenceCutMax,
    cutReferenceProteinMin,
    cutReferenceProteinRangeLabel,
    cutMayReferenceRule,
    cutMayReferenceGroups,
    formatIntegerValue,
    formatDate,
  } = props;

  return (
    <>
      <div className="metrics-summary-grid objective-summary-grid">
        <div className="metrics-summary-card">
          <span>Meta activa</span>
          <strong>{activeObjective?.title || 'Sin objetivo activo'}</strong>
          <small>{activeObjective ? objectiveTypeLabels[activeObjective.goalType] || activeObjective.goalType : 'Sin dato'}</small>
        </div>
        <div className="metrics-summary-card">
          <span>Peso actual / meta</span>
          <strong>
            {activeObjective
              ? `${formatMetricText(activeObjective.currentWeight, ' kg')} / ${formatMetricText(activeObjective.targetWeight, ' kg')}`
              : 'Sin suficientes datos'}
          </strong>
          <small>{activeObjective ? `Inicio ${formatMetricText(activeObjective.startWeight, ' kg')}` : 'Sin dato'}</small>
        </div>
        <div className="metrics-summary-card objective-progress-summary-card">
          <span>Progreso estimado</span>
          <strong>{activeObjectiveProgress === null ? 'Sin suficientes datos' : `${activeObjectiveProgress.toFixed(0)}%`}</strong>
          <small>{activeObjective ? objectiveStatusLabels[activeObjective.status] || activeObjective.status : 'Sin dato'}</small>
        </div>
        <div className="metrics-summary-card">
          <span>Guardrail central</span>
          <strong>{activeObjective ? `${activeObjective.averageCaloriesTarget || '--'} kcal` : 'Sin dato'}</strong>
          <small>{activeObjective ? `Proteína mínima ${activeObjective.proteinMinimum || '--'} g` : 'Sin dato'}</small>
        </div>
      </div>

      <SectionCard title="Meta activa" subtitle="Dirección estratégica de semanas o meses, separada de tus metas diarias." className="card-soft">
        <form className="record-form" onSubmit={handleObjectiveSubmit}>
          <div className="form-grid">
            <label className="field">
              <span>Titulo de la meta</span>
              <input name="title" type="text" value={objectiveForm.title} onChange={handleFormChange(setObjectiveForm)} placeholder="Ej. Corte mayo 2026" />
            </label>
            <label className="field">
              <span>Tipo de meta</span>
              <select name="goalType" value={objectiveForm.goalType} onChange={handleFormChange(setObjectiveForm)}>
                {Object.entries(objectiveTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Fecha de inicio</span>
              <input name="startDate" type="date" value={objectiveForm.startDate} onChange={handleFormChange(setObjectiveForm)} />
            </label>
            <label className="field">
              <span>Fecha limite</span>
              <input name="deadlineDate" type="date" value={objectiveForm.deadlineDate} onChange={handleFormChange(setObjectiveForm)} />
            </label>
            <label className="field">
              <span>Peso inicial</span>
              <input name="startWeight" type="number" min="0" step="0.1" value={objectiveForm.startWeight} onChange={handleFormChange(setObjectiveForm)} />
            </label>
            <label className="field">
              <span>Peso actual</span>
              <input name="currentWeight" type="number" min="0" step="0.1" value={objectiveForm.currentWeight} onChange={handleFormChange(setObjectiveForm)} />
            </label>
            <label className="field">
              <span>Peso objetivo</span>
              <input name="targetWeight" type="number" min="0" step="0.1" value={objectiveForm.targetWeight} onChange={handleFormChange(setObjectiveForm)} />
            </label>
            <label className="field">
              <span>Estado de la meta</span>
              <select name="status" value={objectiveForm.status} onChange={handleFormChange(setObjectiveForm)}>
                {Object.entries(objectiveStatusLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
            <label className="field field-full">
              <span>Notas</span>
              <textarea name="notes" rows="3" value={objectiveForm.notes} onChange={handleFormChange(setObjectiveForm)} placeholder="Contexto, estrategia y enfoque de esta meta..." />
            </label>
          </div>

          <div className="objective-progress-panel">
            <div className="objective-progress-copy">
              <strong>{objectiveFormProgress === null ? 'Sin suficientes datos' : `${objectiveFormProgress.toFixed(0)}% de avance estimado`}</strong>
              <span>
                {objectiveForm.startWeight && objectiveForm.currentWeight && objectiveForm.targetWeight
                  ? `De ${objectiveForm.startWeight} kg hacia ${objectiveForm.targetWeight} kg, con actual ${objectiveForm.currentWeight} kg`
                  : 'Completa pesos inicial, actual y objetivo para estimar el progreso.'}
              </span>
            </div>
            <div className="progress-track" aria-hidden="true">
              <div className="progress-fill" style={{ width: `${objectiveFormProgress || 0}%` }} />
            </div>
            <div className="objective-plan-strip">
              <span>
                <small>Peso inicial</small>
                <strong>{formatMetricText(objectiveForm.startWeight, ' kg')}</strong>
              </span>
              <span>
                <small>Peso actual</small>
                <strong>{formatMetricText(objectiveForm.currentWeight, ' kg')}</strong>
              </span>
              <span>
                <small>Peso objetivo</small>
                <strong>{formatMetricText(objectiveForm.targetWeight, ' kg')}</strong>
              </span>
              <span>
                <small>Fecha límite</small>
                <strong>{objectiveForm.deadlineDate ? formatDate(objectiveForm.deadlineDate) : 'Sin fecha'}</strong>
              </span>
            </div>
          </div>

          {isObjectiveCutGoal ? (
            <div className="objective-cut-reference-panel">
              <div className="objective-cut-reference-head">
                <strong>Referencia de corte cargada</strong>
                <small>Apoyo visual tomado desde Ajustes para que la meta de corte no pierda contexto operativo.</small>
              </div>
              <div className="mini-stat-grid objective-cut-reference-grid">
                <div className="mini-stat">
                  <span>TDEE operativo</span>
                  <strong>{formatIntegerValue(cutReferenceTdee, 'kcal', 'Sin dato')}</strong>
                </div>
                <div className="mini-stat">
                  <span>Rango útil de corte</span>
                  <strong>{cutReferenceCutRangeLabel}</strong>
                </div>
                <div className="mini-stat">
                  <span>Macros de referencia</span>
                  <strong>{cutReferenceMacrosLabel}</strong>
                </div>
                <div className="mini-stat">
                  <span>Estado</span>
                  <strong>{hasCutReferenceLoaded ? 'Referencia cargada' : 'Aún sin referencia'}</strong>
                </div>
              </div>
            </div>
          ) : null}

          <div className="form-actions">
            <button className="button button-primary" type="submit">Guardar objetivo</button>
          </div>
        </form>
      </SectionCard>

      <div className="split-layout objective-layout">
        <SectionCard title="Guardrails nutricionales" subtitle="Limites simples para sostener la ejecucion semanal." className="card-soft">
          <form className="record-form objective-subform" onSubmit={handleObjectiveSubmit}>
            {isObjectiveCutGoal && hasCutReferenceLoaded ? (
              <p className="section-helper objective-cut-reference-helper">
                Referencia visible: TDEE operativo {formatIntegerValue(cutReferenceTdee, 'kcal', 'Sin dato')} • Corte útil {cutReferenceCutRangeLabel} • Proteína {cutReferenceProteinRangeLabel}
              </p>
            ) : null}
            <div className="form-grid">
              <label className="field">
                <span>Calorias promedio objetivo</span>
                <input
                  name="averageCaloriesTarget"
                  type="number"
                  min="0"
                  step="1"
                  value={objectiveForm.averageCaloriesTarget}
                  onChange={handleFormChange(setObjectiveForm)}
                  placeholder={isObjectiveCutGoal && !objectiveForm.averageCaloriesTarget && cutReferenceCutMin !== null ? String(cutReferenceCutMin) : ''}
                />
              </label>
              <label className="field">
                <span>Limite superior promedio</span>
                <input
                  name="averageUpperLimit"
                  type="number"
                  min="0"
                  step="1"
                  value={objectiveForm.averageUpperLimit}
                  onChange={handleFormChange(setObjectiveForm)}
                  placeholder={isObjectiveCutGoal && !objectiveForm.averageUpperLimit && cutReferenceCutMax !== null ? String(cutReferenceCutMax) : ''}
                />
              </label>
              <label className="field">
                <span>Minimo habitual</span>
                <input name="minimumUsual" type="number" min="0" step="1" value={objectiveForm.minimumUsual} onChange={handleFormChange(setObjectiveForm)} />
              </label>
              <label className="field">
                <span>Proteína mínima</span>
                <input
                  name="proteinMinimum"
                  type="number"
                  min="0"
                  step="1"
                  value={objectiveForm.proteinMinimum}
                  onChange={handleFormChange(setObjectiveForm)}
                  placeholder={isObjectiveCutGoal && !objectiveForm.proteinMinimum && cutReferenceProteinMin !== null ? String(cutReferenceProteinMin) : ''}
                />
              </label>
              <label className="field">
                <span>Hidratacion base</span>
                <input name="hydrationBase" type="number" min="0" step="50" value={objectiveForm.hydrationBase} onChange={handleFormChange(setObjectiveForm)} />
              </label>
              <label className="field">
                <span>Hidratacion alta actividad</span>
                <input name="hydrationHighActivity" type="number" min="0" step="50" value={objectiveForm.hydrationHighActivity} onChange={handleFormChange(setObjectiveForm)} />
              </label>
            </div>
            <div className="form-actions">
              <button className="button button-primary" type="submit">Guardar guardrails</button>
            </div>
          </form>
        </SectionCard>

        <SectionCard title="Recordatorios estrategicos" subtitle="Reglas simples para ejecutar la meta con consistencia." className="card-soft">
          <form className="record-form objective-subform" onSubmit={handleObjectiveSubmit}>
            <label className="field field-full">
              <span>Checklist o recordatorios</span>
              <textarea
                name="strategicReminders"
                rows="6"
                value={objectiveForm.strategicReminders}
                onChange={handleFormChange(setObjectiveForm)}
                placeholder="- Priorizar promedio semanal&#10;- Proteger masa muscular"
              />
            </label>
            <div className="form-actions">
              <button className="button button-primary" type="submit">Guardar recordatorios</button>
            </div>
          </form>
        </SectionCard>

        <SectionCard
          title="Alimentos base de corte"
          subtitle="Referencia limpia para mayo: simple, visual y alineada con la nota del coach."
          className="card-soft objective-food-reference-card"
        >
          <div className="objective-food-reference-summary">
            <strong>Guía rápida de consulta</strong>
            <p>Úsala para elegir comidas y compras limpias del corte sin convertir esta pestaña en una tabla nutricional pesada.</p>
          </div>
          <div className="objective-food-reference-rule">
            <strong>Regla de coach</strong>
            <p>{cutMayReferenceRule}</p>
          </div>
          <div className="objective-food-reference-grid">
            {cutMayReferenceGroups.map((group) => (
              <article className="objective-food-group" key={group.title}>
                <div className="objective-food-group-head">
                  <span>{group.title}</span>
                  {group.description ? <small>{group.description}</small> : null}
                </div>
                <div className="objective-food-chip-list">
                  {group.items.map((item) => (
                    <span className="objective-food-chip" key={`${group.title}-${item}`}>
                      {item}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </SectionCard>
      </div>
    </>
  );
}
