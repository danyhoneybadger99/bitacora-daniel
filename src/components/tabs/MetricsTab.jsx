import RecordForm from '../RecordForm';
import SectionCard from '../SectionCard';

export default function MetricsTab(props) {
  const {
    metricSummary,
    metricSummarySourceLabels,
    formatMetricValue,
    SectionCardClassName,
    metricBaseComparisonCards,
    metricCompositionGoal,
    metricTrend,
    metricPolarity,
    getMetricTrendPresentation,
    metricComparisonPairs,
    metricForm,
    handleFormChange,
    setMetricForm,
    handleMetricSubmit,
    resetMetricForm,
    setEditingMetricId,
    editingMetricId,
    sortedMetrics,
    formatDate,
    formatMetricText,
    duplicateMetric,
    startEditing,
    deleteRecord,
  } = props;
  const formatSignedMetric = (value, unit = '', suffix = '') => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return 'Sin dato';
    const prefix = Number(value) > 0 ? '+' : '';
    return `${prefix}${formatMetricValue(value, unit)}${suffix}`;
  };
  const getChangeClass = (value, prefer = 'neutral') => {
    const numericValue = Number(value);
    if (Number.isNaN(numericValue) || numericValue === 0 || prefer === 'neutral') return 'metric-change-neutral';
    return (prefer === 'down' && numericValue < 0) || (prefer === 'up' && numericValue > 0)
      ? 'metric-change-favorable'
      : 'metric-change-unfavorable';
  };

  return (
    <>
      <div className="metrics-summary-grid">
        <div className="metrics-summary-card">
          <span>Peso actual</span>
          <strong>{formatMetricValue(metricSummary.weight, metricSummary.weight === '--' ? '' : ' kg')}</strong>
          <small>{metricSummarySourceLabels.weight}</small>
        </div>
        <div className="metrics-summary-card">
          <span>Grasa corporal actual</span>
          <strong>{formatMetricValue(metricSummary.bodyFat, metricSummary.bodyFat === '--' ? '' : '%')}</strong>
          <small>{metricSummarySourceLabels.bodyFat}</small>
        </div>
        <div className="metrics-summary-card">
          <span>Músculo esquelético actual</span>
          <strong>{formatMetricValue(metricSummary.skeletalMuscleMass, metricSummary.skeletalMuscleMass === '--' ? '' : ' kg')}</strong>
          <small>{metricSummarySourceLabels.skeletalMuscleMass}</small>
        </div>
        <div className="metrics-summary-card">
          <span>Masa grasa actual</span>
          <strong>{formatMetricValue(metricSummary.bodyFatMass, metricSummary.bodyFatMass === '--' ? '' : ' kg')}</strong>
          <small>{metricSummarySourceLabels.bodyFatMass}</small>
        </div>
      </div>

      <SectionCard
        title="Progreso desde InBody base"
        subtitle="Compara la última medición disponible por campo contra la base del 10 abr 2026."
        className="card-soft"
      >
        <div className="metrics-trend-grid metrics-base-grid">
          {metricBaseComparisonCards.map((item) => (
            <article className="metrics-trend-card metrics-base-card" key={item.label}>
              <div className="metrics-base-card-top">
                <span>{item.label}</span>
                <small>{item.snapshotLabel}</small>
              </div>
              <strong className="metrics-base-current">{item.currentValue}</strong>
              <span className={item.trendClass}>{item.changeLabel}</span>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Objetivo 10% grasa corporal"
        subtitle="Lectura operativa usando el ultimo InBody contra la base del 10 abr 2026."
        className="card-soft"
      >
        <div className="metrics-trend-grid metrics-base-grid">
          <article className="metrics-trend-card metrics-base-card">
            <div className="metrics-base-card-top">
              <span>Peso vs abril</span>
              <small>{metricCompositionGoal?.baseDate || 'Base pendiente'}</small>
            </div>
            <strong className={`metrics-base-current ${getChangeClass(metricCompositionGoal?.weightChangeFromBase, 'down')}`}>
              {formatSignedMetric(metricCompositionGoal?.weightChangeFromBase, ' kg')}
            </strong>
            <p>Referencia esperada: -1.9 kg desde InBody base.</p>
          </article>
          <article className="metrics-trend-card metrics-base-card">
            <div className="metrics-base-card-top">
              <span>PGC vs abril</span>
              <small>Meta 10%</small>
            </div>
            <strong className={`metrics-base-current ${getChangeClass(metricCompositionGoal?.bodyFatChangeFromBase, 'down')}`}>
              {formatSignedMetric(metricCompositionGoal?.bodyFatChangeFromBase, '', ' puntos')}
            </strong>
            <p>Referencia esperada: -1.6 puntos de grasa corporal.</p>
          </article>
          <article className="metrics-trend-card metrics-base-card">
            <div className="metrics-base-card-top">
              <span>MME vs abril</span>
              <small>Musculo esqueletico</small>
            </div>
            <strong className={`metrics-base-current ${getChangeClass(metricCompositionGoal?.skeletalMuscleChangeFromBase, 'up')}`}>
              {formatSignedMetric(metricCompositionGoal?.skeletalMuscleChangeFromBase, ' kg')}
            </strong>
            <p>Referencia esperada: -0.3 kg.</p>
          </article>
          <article className="metrics-trend-card metrics-base-card">
            <div className="metrics-base-card-top">
              <span>Estimacion a 10%</span>
              <small>{metricCompositionGoal?.sourceDate || 'Sin InBody actual'}</small>
            </div>
            <strong className="metrics-base-current">
              {metricCompositionGoal?.estimatedWeightAtTarget === null || metricCompositionGoal?.estimatedWeightAtTarget === undefined
                ? 'Sin dato'
                : formatMetricValue(metricCompositionGoal.estimatedWeightAtTarget, ' kg')}
            </strong>
            <p>
              Grasa por perder aprox.{' '}
              {metricCompositionGoal?.estimatedFatToLose === null || metricCompositionGoal?.estimatedFatToLose === undefined
                ? 'sin dato'
                : formatMetricValue(metricCompositionGoal.estimatedFatToLose, ' kg')}
              .
            </p>
          </article>
        </div>
      </SectionCard>

      <SectionCard
        title="Tendencia reciente"
        subtitle="Compara tu último registro contra el inmediatamente anterior."
        className="card-soft"
      >
        <div className="metrics-trend-grid">
          <div className="metrics-trend-card">
            <span>Peso</span>
            <strong className={getMetricTrendPresentation(metricTrend.weight, metricPolarity?.weight).className}>
              {getMetricTrendPresentation(metricTrend.weight, metricPolarity?.weight).label}
            </strong>
            <p>
              {metricTrend.weight === 'sin referencia'
                ? 'Dato insuficiente para comparar.'
                : `Actual ${formatMetricValue(metricComparisonPairs.weight.current?.rawValue ?? '--', metricComparisonPairs.weight.current?.rawValue ? ' kg' : '')} frente a ${formatMetricValue(
                    metricComparisonPairs.weight.previous?.rawValue ?? '--',
                    metricComparisonPairs.weight.previous?.rawValue ? ' kg' : ''
                  )}`}
            </p>
          </div>
          <div className="metrics-trend-card">
            <span>Grasa corporal</span>
            <strong className={getMetricTrendPresentation(metricTrend.bodyFat, metricPolarity?.bodyFat).className}>
              {getMetricTrendPresentation(metricTrend.bodyFat, metricPolarity?.bodyFat).label}
            </strong>
            <p>
              {metricTrend.bodyFat === 'sin referencia'
                ? 'Dato insuficiente para comparar.'
                : `Actual ${formatMetricValue(metricComparisonPairs.bodyFat.current?.rawValue ?? '--', metricComparisonPairs.bodyFat.current?.rawValue ? '%' : '')} frente a ${formatMetricValue(
                    metricComparisonPairs.bodyFat.previous?.rawValue ?? '--',
                    metricComparisonPairs.bodyFat.previous?.rawValue ? '%' : ''
                  )}`}
            </p>
          </div>
          <div className="metrics-trend-card">
            <span>Músculo esquelético</span>
            <strong className={getMetricTrendPresentation(metricTrend.skeletalMuscleMass, metricPolarity?.skeletalMuscleMass).className}>
              {getMetricTrendPresentation(metricTrend.skeletalMuscleMass, metricPolarity?.skeletalMuscleMass).label}
            </strong>
            <p>
              {metricTrend.skeletalMuscleMass === 'sin referencia'
                ? 'Dato insuficiente para comparar.'
                : `Actual ${formatMetricValue(
                    metricComparisonPairs.skeletalMuscleMass.current?.rawValue ?? '--',
                    metricComparisonPairs.skeletalMuscleMass.current?.rawValue ? ' kg' : ''
                  )} frente a ${formatMetricValue(
                    metricComparisonPairs.skeletalMuscleMass.previous?.rawValue ?? '--',
                    metricComparisonPairs.skeletalMuscleMass.previous?.rawValue ? ' kg' : ''
                  )}`}
            </p>
          </div>
          <div className="metrics-trend-card">
            <span>Masa grasa</span>
            <strong className={getMetricTrendPresentation(metricTrend.bodyFatMass, metricPolarity?.bodyFatMass).className}>
              {getMetricTrendPresentation(metricTrend.bodyFatMass, metricPolarity?.bodyFatMass).label}
            </strong>
            <p>
              {metricTrend.bodyFatMass === 'sin referencia'
                ? 'Dato insuficiente para comparar.'
                : `Actual ${formatMetricValue(
                    metricComparisonPairs.bodyFatMass.current?.rawValue ?? '--',
                    metricComparisonPairs.bodyFatMass.current?.rawValue ? ' kg' : ''
                  )} frente a ${formatMetricValue(
                    metricComparisonPairs.bodyFatMass.previous?.rawValue ?? '--',
                    metricComparisonPairs.bodyFatMass.previous?.rawValue ? ' kg' : ''
                  )}`}
            </p>
          </div>
        </div>
      </SectionCard>

      <div className="split-layout metrics-layout">
        <div className="metrics-form-stack">
          <SectionCard title="Medidas manuales" subtitle="Tu bloque base para registrar peso, medidas y observaciones.">
            <RecordForm
              title="Nueva medición"
              fields={[
                { name: 'date', label: 'Fecha', type: 'date' },
                { name: 'weight', label: 'Peso (kg)', type: 'number', min: '0', step: '0.1' },
                { name: 'waist', label: 'Cintura (cm)', type: 'number', min: '0', step: '0.1' },
                { name: 'chest', label: 'Pecho (cm)', type: 'number', min: '0', step: '0.1' },
                { name: 'arm', label: 'Brazo (cm)', type: 'number', min: '0', step: '0.1' },
                { name: 'leg', label: 'Pierna (cm)', type: 'number', min: '0', step: '0.1' },
                { name: 'calf', label: 'Pantorrilla (cm)', type: 'number', min: '0', step: '0.1' },
                { name: 'forearm', label: 'Antebrazo (cm)', type: 'number', min: '0', step: '0.1' },
                { name: 'upperBackTorso', label: 'Dorsal / torso superior (cm)', type: 'number', min: '0', step: '0.1' },
                { name: 'hips', label: 'Cadera (cm)', type: 'number', min: '0', step: '0.1' },
                { name: 'neck', label: 'Cuello (cm)', type: 'number', min: '0', step: '0.1' },
                { name: 'bodyFat', label: 'Grasa corporal estimada (%)', type: 'number', min: '0', step: '0.1' },
                {
                  name: 'observations',
                  label: 'Observaciones',
                  type: 'textarea',
                  placeholder: 'Cambios visibles, retención, sensaciones o contexto...',
                },
              ]}
              formData={metricForm}
              onChange={handleFormChange(setMetricForm)}
              onSubmit={handleMetricSubmit}
              onCancel={() => {
                resetMetricForm();
                setEditingMetricId(null);
              }}
              isEditing={Boolean(editingMetricId)}
            />
          </SectionCard>

          <SectionCard
            title="Composición corporal avanzada"
            subtitle="Campos tipo InBody para registrar composición corporal más detallada."
            className="metrics-advanced-card"
          >
            <RecordForm
              title="Datos avanzados"
              fields={[
                { name: 'height', label: 'Altura (cm)', type: 'number', min: '0', step: '0.1' },
                { name: 'skeletalMuscleMass', label: 'Masa músculo esquelético (kg)', type: 'number', min: '0', step: '0.1' },
                { name: 'bodyFatMass', label: 'Masa grasa corporal (kg)', type: 'number', min: '0', step: '0.1' },
                { name: 'fatFreeMass', label: 'Masa libre de grasa (kg)', type: 'number', min: '0', step: '0.1' },
                { name: 'totalBodyWater', label: 'Agua corporal total (L)', type: 'number', min: '0', step: '0.1' },
                { name: 'proteinsMass', label: 'Proteínas (kg)', type: 'number', min: '0', step: '0.1' },
                { name: 'mineralsMass', label: 'Minerales (kg)', type: 'number', min: '0', step: '0.1' },
                { name: 'bmi', label: 'IMC', type: 'number', min: '0', step: '0.1' },
                { name: 'basalMetabolicRate', label: 'Tasa metabólica basal (kcal)', type: 'number', min: '0', step: '1' },
                { name: 'waistHipRatio', label: 'Relación cintura-cadera', type: 'number', min: '0', step: '0.01' },
                { name: 'visceralFatLevel', label: 'Nivel de grasa visceral', type: 'number', min: '0', step: '1' },
                { name: 'recommendedCalorieIntake', label: 'Ingesta calórica recomendada (kcal)', type: 'number', min: '0', step: '1' },
                {
                  name: 'dataSource',
                  label: 'Origen del dato',
                  type: 'select',
                  options: [
                    { value: 'manual', label: 'Manual' },
                    { value: 'inbody', label: 'InBody' },
                  ],
                },
              ]}
              formData={metricForm}
              onChange={handleFormChange(setMetricForm)}
              onSubmit={handleMetricSubmit}
              onCancel={() => {
                resetMetricForm();
                setEditingMetricId(null);
              }}
              isEditing={Boolean(editingMetricId)}
            />
          </SectionCard>
        </div>

        <SectionCard title="Registros recientes" subtitle="Revisa tus últimas mediciones con una vista más compacta.">
          <div className="metrics-card-list">
            {sortedMetrics.length === 0 ? <p className="empty-state">No hay métricas corporales registradas todavía.</p> : null}

            {sortedMetrics.map((item) => (
              <article className="metrics-card" key={item.id}>
                <div className="metrics-card-top">
                  <div>
                    <strong>{formatDate(item.date)}</strong>
                    <span>
                      {`Peso ${formatMetricText(item.weight, item.weight ? ' kg' : '')}`}
                      {` • Grasa ${formatMetricText(item.bodyFat, item.bodyFat ? '%' : '')}`}
                      {` • Músculo ${formatMetricText(item.skeletalMuscleMass, item.skeletalMuscleMass ? ' kg' : '')}`}
                      {` • Masa grasa ${formatMetricText(item.bodyFatMass, item.bodyFatMass ? ' kg' : '')}`}
                    </span>
                  </div>
                  <span className={`metrics-source-chip ${item.dataSource === 'inbody' ? 'metrics-source-chip-inbody' : ''}`}>
                    {item.dataSource === 'inbody' ? item.sourceLabel || 'InBody' : 'Manual'}
                  </span>
                </div>

                <div className="entry-details metrics-details">
                  <span>Cintura: {formatMetricText(item.waist, item.waist ? ' cm' : '')}</span>
                  {item.calf ? <span>Pantorrilla: {formatMetricText(item.calf, ' cm')}</span> : null}
                  {item.forearm ? <span>Antebrazo: {formatMetricText(item.forearm, ' cm')}</span> : null}
                  {item.upperBackTorso ? <span>Dorsal / torso superior: {formatMetricText(item.upperBackTorso, ' cm')}</span> : null}
                  <span>IMC: {formatMetricText(item.bmi)}</span>
                  <span>Agua: {formatMetricText(item.totalBodyWater, item.totalBodyWater ? ' L' : '')}</span>
                  <span>Masa libre: {formatMetricText(item.fatFreeMass, item.fatFreeMass ? ' kg' : '')}</span>
                </div>

                {item.observations ? <p className="metrics-notes">{item.observations}</p> : null}

                <div className="entry-actions">
                  <button className="button button-secondary" type="button" onClick={() => duplicateMetric(item.id)}>
                    Duplicar
                  </button>
                  <button
                    className="button button-secondary"
                    type="button"
                    onClick={() => startEditing('bodyMetrics', item.id, setMetricForm, setEditingMetricId, 'metrics')}
                  >
                    Editar
                  </button>
                  <button
                    className="button button-danger"
                    type="button"
                    onClick={() => deleteRecord('bodyMetrics', item.id, setEditingMetricId, resetMetricForm)}
                  >
                    Eliminar
                  </button>
                </div>
              </article>
            ))}
          </div>
        </SectionCard>
      </div>
    </>
  );
}
