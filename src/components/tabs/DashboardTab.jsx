import ProgressCard from '../ProgressCard';
import GoalForm from '../GoalForm';
import SectionCard from '../SectionCard';

const checkInInsightCopyByProfile = {
  'krav-360': {
    lowEnergy: ['Energía baja. Prioriza técnica y recuperación.', 'Repasa suave + movilidad ligera'],
    lowSleep: ['Sueño bajo. Baja intensidad y cuida reacción.', 'Técnica limpia, sin forzar sparring'],
    stress: ['Tensión alta. Control emocional antes de entrenar.', 'Respira, camina y entrena básico'],
    highState: ['Buen estado. Día para progresar con intención.', 'Practica la técnica prioritaria'],
    stable: ['Día estable. Suma constancia sin exceso.', 'Haz una sesión técnica corta'],
  },
  'fitness-basic': {
    lowEnergy: ['Energía baja. Cuida hidratación y comida.', 'Camina ligero + agua suficiente'],
    lowSleep: ['Sueño bajo. Recupera antes de exigir más.', 'Come simple y duerme temprano'],
    stress: ['Estrés alto. Mantén el día simple.', 'Respira, hidrátate y muévete suave'],
    highState: ['Buen estado. Día para cumplir básicos.', 'Proteína, agua y movimiento primero'],
    stable: ['Día estable. Mantén adherencia.', 'Completa comida, agua y movimiento'],
  },
  'daniel-full': {
    lowEnergy: ['Energía baja. Disciplina con recuperación.', 'Ora/reflexiona y baja intensidad'],
    lowSleep: ['Dormiste mal. Protege enfoque y sobriedad.', 'Haz lo esencial y duerme temprano'],
    stress: ['Estrés alto. Vuelve al centro.', 'Respira, ora y trabaja una cosa profunda'],
    highState: ['Buen estado. Día para trabajo profundo.', 'Entrena, ora y ejecuta lo importante'],
    stable: ['Día estable. Sostén disciplina.', 'Cumple básicos y reflexión breve'],
  },
  default: {
    lowEnergy: ['Energía baja. Hoy enfócate en recuperación.', 'Camina ligero + hidrátate bien'],
    lowSleep: ['Dormiste mal. Reduce intensidad hoy.', 'Evita estrés y duerme temprano'],
    stress: ['Alto estrés detectado.', 'Respira y baja el ritmo'],
    highState: ['Buen estado. Día para avanzar.', 'Haz lo más importante primero'],
    stable: ['Día estable.', 'Mantén disciplina'],
  },
};

function buildCheckInInsight(copy, key) {
  return {
    insight: copy[key][0],
    action: copy[key][1],
  };
}

function getCheckInInsight(checkIn, profileType = 'default') {
  if (!checkIn) return null;

  const { energy, sleepQuality, emotions = [], generalState } = checkIn;
  const copy = checkInInsightCopyByProfile[profileType] || checkInInsightCopyByProfile.default;

  if (energy <= 4) {
    return buildCheckInInsight(copy, 'lowEnergy');
  }

  if (sleepQuality <= 4) {
    return buildCheckInInsight(copy, 'lowSleep');
  }

  if (emotions.includes("Estresado") || emotions.includes("Ansioso")) {
    return buildCheckInInsight(copy, 'stress');
  }

  if (energy >= 7 && generalState >= 7) {
    return buildCheckInInsight(copy, 'highState');
  }

  return buildCheckInInsight(copy, 'stable');
}
export default function DashboardTab(props) {
  const {
    todaySummary,
    calorieGoal,
    formatIntegerValue,
    calorieProgress,
    proteinGoal,
    dashboardProteinReferenceLabel,
    formatUnitValue,
    proteinProgress,
    proteinAlert,
    dashboardProteinHelper,
    dashboardFatSubtitle,
    dailyFatProgress,
    dailyFatTone,
    dailyFatStatus,
    displayedFastingProtocolLabel,
    displayedFastingStatusLabel,
    displayedFastingProgressPercent,
    displayedFastingRemainingHours,
    activeFastingElapsedHours,
    formatHoursLabel,
    todaySummaryWeight,
    weightGoal,
    formatWeightValue,
    weightProgress,
    getWeightMessage,
    hydrationBaseGoal,
    hydrationProgress,
    hydrationTone,
    todaysExercises,
    hydrationHighActivityGoal,
    kravDashboardSnapshot,
    formatKravPercent,
    isKravEnabled,
    isCheckInEnabled,
    isFastingEnabled,
    isSupplementsEnabled,
    isObjectivesEnabled,
    setActiveTab,
    fatAlert,
    isSundayReminderVisible,
    dailyFatLimitGrams,
    goalForm,
    handleFormChange,
    setGoalForm,
    handleGoalSubmit,
    latestMetric,
    dashboardCutReferenceMiniLabel,
    cutReferenceTdee,
    todaysFoods,
    todaysSupplements,
    activeFastingAutophagy,
    shouldTreatTodayAsFastingFree,
    activeFastingStatus,
    activeFastingReachedGoal,
    activeObjective,
    metricFieldSnapshots,
    formatMetricText,
    todayDailyCheckIn,
    checkInEmotionOptions,
    profileType,
  } = props;
  const checkInInsight = getCheckInInsight(todayDailyCheckIn, profileType);
  const primaryCheckInEmotionValue = Array.isArray(todayDailyCheckIn?.emotions)
    ? todayDailyCheckIn.emotions[0]
    : '';
  const primaryCheckInEmotion = checkInEmotionOptions?.find((item) => item.value === primaryCheckInEmotionValue)?.label || primaryCheckInEmotionValue;

  return (
    <>
      <div className="progress-card-grid">
        <ProgressCard
          title="Calorias"
          className="dashboard-mobile-card-calories"
          value={formatIntegerValue(todaySummary.calories, 'kcal', '0 kcal')}
          subtitle={
            calorieGoal > 0
              ? `Meta diaria: ${formatIntegerValue(calorieGoal, 'kcal', '0 kcal')}`
              : 'Define una meta para ver progreso.'
          }
          progress={calorieProgress}
          tone="energy"
          helper={
            calorieGoal > 0
              ? `${formatIntegerValue(Math.max(calorieGoal - todaySummary.calories, 0), 'kcal', '0 kcal')} restantes`
              : 'Sin meta configurada'
          }
        />

        <ProgressCard
          title="Proteína"
          className="dashboard-mobile-card-protein"
          value={formatUnitValue(todaySummary.protein, 'g', { maximumFractionDigits: 1, fallback: '0 g' })}
          subtitle={
            proteinGoal > 0
              ? `Mínimo diario: ${formatUnitValue(proteinGoal, 'g', { maximumFractionDigits: 1, fallback: '0 g' })}`
              : dashboardProteinReferenceLabel
          }
          progress={proteinProgress}
          tone={proteinAlert ? 'alert' : 'success'}
          helper={dashboardProteinHelper}
        />

        <ProgressCard
          title="Grasa diaria"
          className="dashboard-mobile-card-fat"
          value={formatUnitValue(todaySummary.fat, 'g', { maximumFractionDigits: 1, fallback: '0 g' })}
          subtitle={dashboardFatSubtitle}
          progress={dailyFatProgress}
          tone={dailyFatTone}
          helper={dailyFatStatus}
        />

        {isFastingEnabled ? (
          <ProgressCard
            title="Ayuno"
            className="dashboard-mobile-card-fasting"
            value={displayedFastingProtocolLabel}
            subtitle={
            todaySummary.fastingStatus === 'día libre'
              ? 'Día libre'
              : todaySummary.fastingStatus === 'sin registro'
                ? 'Sin registro de ayuno'
                : todaySummary.fastingStatus === 'pendiente'
                  ? 'Sin registro de ayuno'
                  : displayedFastingStatusLabel
          }
            progress={
            todaySummary.fastingStatus === 'cumplido'
              ? 100
              : todaySummary.fastingStatus === 'en curso'
                ? displayedFastingProgressPercent
                : todaySummary.fastingStatus === 'roto'
                  ? Math.min(displayedFastingProgressPercent, 100)
                  : 0
          }
            tone={todaySummary.fastingStatus === 'roto' ? 'alert' : todaySummary.fastingStatus === 'en curso' ? 'energy' : 'success'}
            helper={`${
            todaySummary.fastingStatus === 'día libre'
              ? 'Día libre guardado'
              : todaySummary.fastingStatus === 'sin registro'
                ? 'Sin registro real hoy'
                : todaySummary.fastingStatus === 'pendiente'
                  ? 'Sin registro real hoy'
                  : `${formatHoursLabel(activeFastingElapsedHours)} acumuladas`
          }${
            displayedFastingRemainingHours !== null && todaySummary.fastingStatus === 'en curso'
              ? ` · ${formatHoursLabel(displayedFastingRemainingHours)} restantes`
              : todaySummary.fastingStatus === 'cumplido'
                ? ' · Meta alcanzada'
                : ''
          }`}
          />
        ) : null}

        <ProgressCard
          title="Peso actual"
          className="dashboard-mobile-card-weight"
          value={todaySummaryWeight}
          subtitle={weightGoal > 0 ? `Objetivo: ${formatWeightValue(weightGoal, 'kg', '--')}` : 'Configura un peso objetivo.'}
          progress={weightProgress}
          tone="weight"
          helper={
            todaySummary.bodyFat !== '--' || todaySummary.skeletalMuscleMass !== '--'
              ? `Grasa: ${formatMetricText(todaySummary.bodyFat, todaySummary.bodyFat === '--' ? '' : '%')} · Músculo: ${formatMetricText(
                  todaySummary.skeletalMuscleMass,
                  todaySummary.skeletalMuscleMass === '--' ? '' : ' kg'
                )}`
              : getWeightMessage(todaySummary.weight === '--' ? null : Number(todaySummary.weight), weightGoal)
          }
        />

        <ProgressCard
          title="Hidratacion"
          className="dashboard-mobile-card-hydration"
          value={formatUnitValue(todaySummary.hydrationMl, 'ml', { maximumFractionDigits: 0, fallback: '0 ml' })}
          subtitle={`Meta diaria: ${formatUnitValue(hydrationBaseGoal || 0, 'ml', { maximumFractionDigits: 0, fallback: '0 ml' })}`}
          progress={hydrationProgress}
          tone={hydrationTone}
          helper={
            todaysExercises.length > 0 && hydrationHighActivityGoal > 0
              ? `Alta actividad: ${formatUnitValue(hydrationHighActivityGoal, 'ml', { maximumFractionDigits: 0, fallback: '0 ml' })}`
              : `${formatUnitValue(Math.max((hydrationBaseGoal || 0) - todaySummary.hydrationMl, 0), 'ml', { maximumFractionDigits: 0, fallback: '0 ml' })} restantes`
          }
        />

        <ProgressCard
          title="Actividad"
          className="dashboard-mobile-card-activity"
          value={formatIntegerValue(todaySummary.exerciseCalories, 'kcal', '0 kcal')}
          subtitle={`${formatIntegerValue(todaySummary.exerciseMinutes, 'min', '0 min')} de ejercicio hoy`}
          progress={Math.min((todaySummary.exerciseMinutes / 60) * 100, 100)}
          tone="movement"
          helper={`${todaySummary.exerciseEntries} sesiones registradas`}
        />

        {isKravEnabled ? (
          <article className="progress-card progress-card-krav dashboard-krav-progress-card dashboard-mobile-card-krav">
          <div className="progress-card-top dashboard-krav-head">
            <div className="dashboard-krav-title-group">
              <span>Krav Maga</span>
              <span className="dashboard-krav-belt">{`Cinta ${kravDashboardSnapshot.currentBelt.toLowerCase()}`}</span>
            </div>
            <strong>{formatKravPercent(kravDashboardSnapshot.totalProgress)}</strong>
          </div>
          <div className="dashboard-krav-meta">
            <span>{`Objetivo: ${kravDashboardSnapshot.targetBelt}`}</span>
            <span>{`${kravDashboardSnapshot.pendingTechniques} pendientes`}</span>
          </div>
          <small className="dashboard-krav-next" title={kravDashboardSnapshot.nextTechniqueName}>
            Próxima: {kravDashboardSnapshot.nextTechniqueName}
          </small>
          <div className="progress-track" aria-hidden="true">
            <div className="progress-fill" style={{ width: `${Math.max(0, Math.min(100, Number(kravDashboardSnapshot.totalProgress) || 0))}%` }} />
          </div>
          <div className="entry-actions dashboard-krav-actions">
            <button className="button button-secondary" type="button" onClick={() => setActiveTab('krav')}>
              Abrir Krav Maga
            </button>
          </div>
          </article>
        ) : null}

        {isCheckInEnabled ? (
          <article className="progress-card dashboard-checkin-progress-card dashboard-mobile-card-checkin">
            <div className="dashboard-checkin-left">
              <div className="progress-card-top dashboard-checkin-head">
                <div>
                  <span>Check-in diario</span>
                  <small>Estado personal de hoy</small>
                </div>
                <strong className="dashboard-checkin-score">{todayDailyCheckIn ? `${todayDailyCheckIn.generalState}/10` : '--'}</strong>
              </div>
              {todayDailyCheckIn ? (
                <div className="dashboard-checkin-mini-grid">
                  <span>Energía {todayDailyCheckIn.energy}/10</span>
                  <span>Sueño {todayDailyCheckIn.sleepQuality}/10</span>
                  <span>{primaryCheckInEmotion || 'Sin emoción'}</span>
                  <span className="dashboard-checkin-gratitude-chip">
                    {todayDailyCheckIn.gratitudeDone ? 'Gratitud registrada' : 'Sin gratitud'}
                  </span>
                </div>
              ) : (
                <div className="dashboard-checkin-empty">
                  <strong>Sin check-in hoy</strong>
                  <p>Registra estado, energía, sueño y gratitud en menos de un minuto.</p>
                </div>
              )}
            </div>

            <div className="dashboard-checkin-right">
              {checkInInsight ? (
                <div className="dashboard-checkin-guide">
                  <span>Guía de hoy</span>
                  <strong>{checkInInsight.insight}</strong>
                  <p>{checkInInsight.action}</p>
                </div>
              ) : (
                <div className="dashboard-checkin-guide dashboard-checkin-guide-empty">
                  <span>Guía de hoy</span>
                  <strong>Haz tu check-in para orientar el día.</strong>
                  <p>Un minuto basta para registrar estado, sueño y enfoque.</p>
                </div>
              )}
              <button className="button button-secondary dashboard-checkin-button" type="button" onClick={() => setActiveTab('checkin')}>
                Abrir check-in
              </button>
            </div>
          </article>
        ) : null}
      </div>

      {proteinAlert || fatAlert || isSundayReminderVisible ? (
        <div className="dashboard-alert-stack">
          {proteinAlert ? (
            <div className="alert-banner">
              <strong>Alerta de proteína:</strong> hoy llevas {formatUnitValue(todaySummary.protein, 'g', { maximumFractionDigits: 1, fallback: '0 g' })} y tu mínimo configurado es {formatUnitValue(proteinGoal, 'g', { maximumFractionDigits: 1, fallback: '0 g' })}.
            </div>
          ) : null}

          {fatAlert ? (
            <div className="alert-banner">
              <strong>Alerta de grasa:</strong> hoy llevas {formatUnitValue(todaySummary.fat, 'g', { maximumFractionDigits: 1, fallback: '0 g' })}; límite operativo {formatUnitValue(dailyFatLimitGrams, 'g', { maximumFractionDigits: 0, fallback: '80 g' })}.
            </div>
          ) : null}

          {isSundayReminderVisible ? (
            <div className="alert-banner alert-banner-sunday">
              <strong>Domingo con control:</strong> evita azúcar, harina y exceso de calorías. No tires a la basura el esfuerzo de la semana.
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="dashboard-main-grid">
        <SectionCard
          title="Metas diarias"
          subtitle="Estas metas se guardan localmente y se usan en el dashboard y el resumen semanal."
          className="card-soft"
        >
          <GoalForm
            formData={goalForm}
            onChange={handleFormChange(setGoalForm)}
            onSubmit={handleGoalSubmit}
          />
        </SectionCard>

        <SectionCard title="Pulso del día" subtitle="Lectura rápida de lo que ya registraste." className="card-soft">
          <div className="mini-stat-grid">
            <div className="mini-stat">
              <span>Comida</span>
              <strong>{todaySummary.foodEntries} registros</strong>
            </div>
            <div className="mini-stat">
              <span>Macros extra</span>
              <strong>
                {formatUnitValue(todaySummary.carbs, 'g', { maximumFractionDigits: 1, fallback: '0 g' })} carbos · {formatUnitValue(todaySummary.fat, 'g', { maximumFractionDigits: 1, fallback: '0 g' })} grasa
              </strong>
            </div>
            {isSupplementsEnabled ? (
              <div className="mini-stat">
                <span>Suplementos</span>
                <strong>{todaySummary.supplementsTakenToday} tomados / {todaySummary.supplementsPendingToday} pendientes</strong>
              </div>
            ) : null}
            {isFastingEnabled ? (
              <div className="mini-stat">
                <span>Ayuno</span>
                <strong>{displayedFastingStatusLabel}</strong>
              </div>
            ) : null}
            <div className="mini-stat">
              <span>Métricas de hoy / último dato</span>
              <strong>
                {todaySummary.metricEntries} hoy
                {latestMetric ? ` · peso ${formatMetricText(latestMetric.weight, ' kg')}` : ' · sin dato'}
              </strong>
              <small className="helper-text">
                El dashboard resume comida, suplementos y ejercicio de hoy, pero usa la última métrica disponible aunque no sea de hoy.
              </small>
            </div>
            <div className="mini-stat">
              <span>Corte útil</span>
              <strong>{dashboardCutReferenceMiniLabel}</strong>
              <small>{cutReferenceTdee !== null ? `TDEE operativo ${formatIntegerValue(cutReferenceTdee, 'kcal', 'Sin dato')}` : 'Referencia desde Ajustes'}</small>
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="dashboard-grid dashboard-compact-grid">
        <SectionCard title="Alimentos" subtitle="Resumen de hoy" className="card-soft dashboard-compact-card">
          <div className="dashboard-snapshot">
            <strong>{todaysFoods.length === 0 ? 'Sin registros' : formatIntegerValue(todaySummary.calories, 'kcal', '0 kcal')}</strong>
            <p>{todaysFoods.length === 0 ? 'Sin alimentos registrados hoy.' : `${todaySummary.foodEntries} registros · ${formatUnitValue(todaySummary.protein, 'g', { maximumFractionDigits: 1, fallback: '0 g' })} proteína`}</p>
          </div>
        </SectionCard>

        <SectionCard title="Hidratación" subtitle="Resumen de hoy" className="card-soft dashboard-compact-card">
          <div className="dashboard-snapshot">
            <strong>{formatUnitValue(todaySummary.hydrationMl, 'ml', { maximumFractionDigits: 0, fallback: '0 ml' })}</strong>
            <p>{`Meta ${formatUnitValue(hydrationBaseGoal || 0, 'ml', { maximumFractionDigits: 0, fallback: '0 ml' })}${todaysExercises.length > 0 && hydrationHighActivityGoal > 0 ? ` · alta ${formatUnitValue(hydrationHighActivityGoal, 'ml', { maximumFractionDigits: 0, fallback: '0 ml' })}` : ''}`}</p>
          </div>
        </SectionCard>


        {isSupplementsEnabled ? (
          <SectionCard title="Suplementos" subtitle="Resumen de hoy" className="card-soft dashboard-compact-card">
          <div className="dashboard-snapshot">
            <strong>{todaysSupplements.length === 0 ? 'Sin registros' : `${todaySummary.supplementsTakenToday} tomados`}</strong>
            <p>{todaysSupplements.length === 0 ? 'Sin suplementos registrados hoy.' : `${todaySummary.supplementsPendingToday} pendientes · ${todaySummary.medicationsToday} medicamentos`}</p>
          </div>
        </SectionCard>

        ) : null}

        <SectionCard title="Ejercicio" subtitle="Resumen de hoy" className="card-soft dashboard-compact-card">
          <div className="dashboard-snapshot">
            <strong>{todaysExercises.length === 0 ? 'Sin registros' : formatIntegerValue(todaySummary.exerciseMinutes, 'min', '0 min')}</strong>
            <p>{todaysExercises.length === 0 ? 'Sin ejercicio registrado hoy.' : `${formatIntegerValue(todaySummary.exerciseCalories, 'kcal', '0 kcal')} · ${todaySummary.exerciseEntries} sesiones`}</p>
          </div>
        </SectionCard>

        {isFastingEnabled ? (
          <SectionCard title="Ayuno" subtitle={displayedFastingProtocolLabel} className="card-soft dashboard-compact-card">
          <div className="dashboard-snapshot">
            <strong>{displayedFastingStatusLabel}</strong>
            {activeFastingAutophagy && !shouldTreatTodayAsFastingFree ? <span className="fasting-autophagy-badge fasting-autophagy-badge-compact">En autofagia</span> : null}
            {activeFastingAutophagy && !shouldTreatTodayAsFastingFree ? <small className="dashboard-hint">Hito visual activado desde 16 h de ayuno activo.</small> : null}
            <p>
              {todaySummary.fastingStatus === 'día libre'
                ? 'Hoy no hay ayuno.'
                : todaySummary.fastingStatus === 'sin registro'
                  ? 'Sin registro de ayuno hoy.'
                  : todaySummary.fastingStatus === 'pendiente'
                    ? 'Sin registro de ayuno hoy.'
                    : activeFastingStatus === 'en curso' && activeFastingReachedGoal
                      ? `${formatHoursLabel(activeFastingElapsedHours)} acumuladas · Meta alcanzada y ayuno en curso`
                      : `${formatHoursLabel(activeFastingElapsedHours)} acumuladas${
                          displayedFastingRemainingHours !== null ? ` · ${formatHoursLabel(displayedFastingRemainingHours)} restantes` : ' · Meta alcanzada'
                        }`}
            </p>
          </div>
        </SectionCard>

        ) : null}

        {isObjectivesEnabled ? (
          <SectionCard title="Objetivo actual" subtitle={activeObjective ? activeObjective.title : 'Sin objetivo activo'} className="card-soft dashboard-compact-card">
          <div className="dashboard-snapshot">
            <strong>
              {activeObjective?.targetWeight ? `${formatWeightValue(activeObjective.targetWeight, 'kg', '--')} meta` : 'Sin dato'}
            </strong>
            <p>
              {activeObjective
                ? `${formatIntegerValue(activeObjective.averageCaloriesTarget, 'kcal', '--')} prom · tope ${formatIntegerValue(activeObjective.averageUpperLimit, 'kcal', '--')}`
                : 'Todavía no has definido una meta activa.'}
            </p>
            {activeObjective ? (
              <small>{`Min habitual ${formatIntegerValue(activeObjective.minimumUsual, 'kcal', '--')} · Prot mínima ${formatUnitValue(activeObjective.proteinMinimum, 'g', { maximumFractionDigits: 1, fallback: '--' })}`}</small>
            ) : null}
          </div>
        </SectionCard>

        ) : null}

        <SectionCard title="Métricas" subtitle={latestMetric ? 'Último dato disponible' : 'Sin métricas'} className="card-soft dashboard-compact-card">
          <div className="dashboard-snapshot">
            <strong>{metricFieldSnapshots.weight.date ? formatMetricText(metricFieldSnapshots.weight.rawValue, ' kg') : 'Sin dato'}</strong>
            <p>
              {metricFieldSnapshots.weight.date
                ? `${formatMetricText(metricFieldSnapshots.bodyFat.rawValue, '%')} grasa · ${formatMetricText(metricFieldSnapshots.skeletalMuscleMass.rawValue, ' kg')} músculo`
                : 'Aún no has registrado métricas.'}
            </p>
          </div>
        </SectionCard>
      </div>
    </>
  );
}
