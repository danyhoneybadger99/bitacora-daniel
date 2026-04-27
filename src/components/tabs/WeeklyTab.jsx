import SectionCard from '../SectionCard';

export default function WeeklyTab(props) {
  const {
    setWeekReferenceDate,
    shiftDateByDays,
    currentDate,
    weekReferenceDate,
    weeklySummary,
    formatDate,
    weeklyConsistencyLabel,
    weeklyProteinStatusLabel,
    weeklyFastingHasData,
    calorieGoal,
    proteinGoal,
  } = props;

  return (
    <>
      <SectionCard
        title="Resumen semanal"
        subtitle="Lectura ejecutiva de la semana seleccionada usando alimentos, suplementos, ejercicio y metricas."
        actions={
          <div className="week-controls">
            <button className="button button-secondary" type="button" onClick={() => setWeekReferenceDate((current) => shiftDateByDays(current, -7))}>
              Semana anterior
            </button>
            <button className="button button-secondary" type="button" onClick={() => setWeekReferenceDate(currentDate)}>
              Ir a semana actual
            </button>
            <button className="button button-secondary" type="button" onClick={() => setWeekReferenceDate((current) => shiftDateByDays(current, 7))}>
              Semana siguiente
            </button>
            <label className="inline-field">
              <span>Semana de referencia</span>
              <input type="date" value={weekReferenceDate} onChange={(event) => setWeekReferenceDate(event.target.value)} />
            </label>
          </div>
        }
      >
        <div className="week-range">
          <span>
            Semana: <strong>{formatDate(weeklySummary.start)}</strong> a <strong>{formatDate(weeklySummary.end)}</strong>
          </span>
          <p>Estas viendo el resumen completo de la semana seleccionada.</p>
        </div>

        <div className="weekly-hero-grid">
          <div className="weekly-hero-card">
            <span>Días con registro</span>
            <strong>{weeklySummary.trackedDays}</strong>
            <small>{weeklyConsistencyLabel}</small>
          </div>
          <div className="weekly-hero-card">
            <span>Calorías promedio</span>
            <strong>{weeklySummary.foodDays > 0 ? `${weeklySummary.averageCaloriesTracked.toFixed(0)} kcal` : 'Sin datos'}</strong>
            <small>{weeklySummary.foodDays > 0 ? `${weeklySummary.foodDays} días con comida` : 'Sin alimentos registrados'}</small>
          </div>
          <div className="weekly-hero-card">
            <span>Proteína semanal</span>
            <strong>{weeklySummary.foodDays > 0 ? `${weeklySummary.averageProteinTracked.toFixed(1)} g/día` : 'Sin datos'}</strong>
            <small>{weeklyProteinStatusLabel}</small>
          </div>
          <div className="weekly-hero-card">
            <span>Entrenamientos</span>
            <strong>{weeklySummary.trainingSessions}</strong>
            <small>{weeklySummary.trainingSessions > 0 ? `${weeklySummary.totalExerciseMinutes} min acumulados` : 'Sin entrenamientos'}</small>
          </div>
          <div className="weekly-hero-card">
            <span>Ayuno</span>
            <strong>{weeklyFastingHasData ? `${weeklySummary.fastingCompleted} cumplidos` : 'Sin datos'}</strong>
            <small>{weeklyFastingHasData ? `${weeklySummary.fastingHours.toFixed(1)} h reales · ${weeklySummary.fastingFreeDays} días libres` : 'Sin ayunos registrados'}</small>
          </div>
          <div className="weekly-hero-card">
            <span>Orden semanal</span>
            <strong>{weeklyConsistencyLabel}</strong>
            <small>{weeklySummary.trackedDays >= 5 ? 'Buena continuidad de registros.' : weeklySummary.trackedDays > 0 ? 'Aún faltan días para leer patrón.' : 'Sin historial para evaluar.'}</small>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Lectura rápida" subtitle="Resumen operativo para saber si la semana va ordenada." className="card-soft">
        <div className="weekly-note-stack">
          <div className="weekly-note">
            <span>Comida</span>
            <strong>
              {weeklySummary.foodDays > 0
                ? `${weeklySummary.foodDays} días registrados · ${weeklySummary.averageCaloriesTracked.toFixed(0)} kcal promedio`
                : 'Sin registros esta semana'}
            </strong>
          </div>
          <div className="weekly-note">
            <span>Proteína</span>
            <strong>
              {weeklySummary.foodDays > 0
                ? `${weeklyProteinStatusLabel} · ${weeklySummary.averageProteinTracked.toFixed(1)} g promedio diario`
                : 'Sin registros esta semana'}
            </strong>
          </div>
          <div className="weekly-note">
            <span>Consistencia</span>
            <strong>
              {weeklySummary.trackedDays > 0
                ? `${weeklyConsistencyLabel} · ${weeklySummary.trackedDays} días con actividad registrada`
                : 'Sin historial esta semana'}
            </strong>
          </div>
          <div className="weekly-note">
            <span>Ejercicio</span>
            <strong>
              {weeklySummary.trainingSessions > 0
                ? `${weeklySummary.trainingSessions} entrenamientos · ${weeklySummary.totalExerciseMinutes} min`
                : 'Sin entrenamientos registrados'}
            </strong>
          </div>
          <div className="weekly-note">
            <span>Ayuno</span>
            <strong>
              {weeklyFastingHasData
                ? `${weeklySummary.fastingCompleted} completados • ${weeklySummary.fastingInProgress} en curso • ${weeklySummary.fastingFreeDays} días libres`
                : 'Sin ayunos registrados esta semana'}
            </strong>
          </div>
          <div className="weekly-note">
            <span>Ayuno semanal</span>
            <strong>
              {weeklyFastingHasData
                ? `Horas reales: ${weeklySummary.fastingHours.toFixed(1)} h • Cumplimiento simple: ${weeklySummary.fastingAdherence !== null ? `${weeklySummary.fastingAdherence.toFixed(0)}%` : 'sin historial'}`
                : 'Sin suficiente historial aún'}
            </strong>
          </div>
        </div>
      </SectionCard>

      <div className="weekly-executive-grid">
        <SectionCard title="Nutrición" subtitle="Promedios calculados solo con días que sí tienen alimentos registrados." className="card-soft weekly-module-card">
          {weeklySummary.foodDays > 0 ? (
            <div className="mini-stat-grid">
              <div className="mini-stat">
                <span>Calorias totales de la semana</span>
                <strong>{weeklySummary.totalCalories} kcal</strong>
              </div>
              <div className="mini-stat">
                <span>Proteína total de la semana</span>
                <strong>{weeklySummary.totalProtein.toFixed(1)} g</strong>
              </div>
              <div className="mini-stat">
                <span>Calorías promedio por día</span>
                <strong>{weeklySummary.averageCaloriesTracked.toFixed(0)} kcal</strong>
              </div>
              <div className="mini-stat">
                <span>Proteína promedio por dia</span>
                <strong>{weeklySummary.averageProteinTracked.toFixed(1)} g</strong>
              </div>
              <div className="mini-stat">
                <span>Carbohidratos promedio por día</span>
                <strong>{weeklySummary.averageCarbsTracked.toFixed(1)} g</strong>
              </div>
              <div className="mini-stat">
                <span>Grasa promedio por día</span>
                <strong>{weeklySummary.averageFatTracked.toFixed(1)} g</strong>
              </div>
              <div className="mini-stat">
                <span>Días con alimentos registrados</span>
                <strong>{weeklySummary.foodDays}</strong>
              </div>
              <div className="mini-stat">
                <span>Mejor día de proteína</span>
                <strong>
                  {weeklySummary.bestProteinDay
                    ? `${formatDate(weeklySummary.bestProteinDay.date)} • ${weeklySummary.bestProteinDay.total.toFixed(1)} g`
                    : 'Sin suficientes datos'}
                </strong>
              </div>
              <div className="mini-stat">
                <span>Mejor día de calorías</span>
                <strong>
                  {weeklySummary.bestCaloriesDay
                    ? `${formatDate(weeklySummary.bestCaloriesDay.date)} • ${weeklySummary.bestCaloriesDay.total.toFixed(0)} kcal`
                    : 'Sin suficientes datos'}
                </strong>
              </div>
              <div className="mini-stat">
                <span>Promedio diario de calorías vs meta</span>
                <strong>{calorieGoal > 0 ? `${weeklySummary.averageCaloriesTracked.toFixed(0)} kcal / ${calorieGoal} kcal` : 'Sin meta configurada'}</strong>
              </div>
              <div className="mini-stat">
                <span>Promedio diario de proteína vs meta</span>
                <strong>{proteinGoal > 0 ? `${weeklySummary.averageProteinTracked.toFixed(1)} g / ${proteinGoal} g` : 'Sin meta configurada'}</strong>
              </div>
            </div>
          ) : (
            <p className="empty-state">Sin registros esta semana</p>
          )}
        </SectionCard>

        <SectionCard title="Hidratación" subtitle="Promedios calculados solo con días que sí tienen bebidas registradas." className="card-soft weekly-module-card">
          {weeklySummary.hydrationTotal > 0 ? (
            <div className="mini-stat-grid">
              <div className="mini-stat">
                <span>Total semanal</span>
                <strong>{weeklySummary.hydrationTotal.toFixed(0)} ml</strong>
              </div>
              <div className="mini-stat">
                <span>Promedio diario</span>
                <strong>{weeklySummary.hydrationAverage.toFixed(0)} ml</strong>
              </div>
              <div className="mini-stat">
                <span>Dias cumplidos</span>
                <strong>{weeklySummary.hydrationDaysMetGoal}</strong>
              </div>
              <div className="mini-stat">
                <span>Mejor dia</span>
                <strong>
                  {weeklySummary.bestHydrationDay
                    ? `${formatDate(weeklySummary.bestHydrationDay.date)} • ${weeklySummary.bestHydrationDay.total.toFixed(0)} ml`
                    : 'Sin suficientes datos'}
                </strong>
              </div>
            </div>
          ) : (
            <p className="empty-state">Sin suficientes datos esta semana</p>
          )}
        </SectionCard>

        <SectionCard title="Suplementos" subtitle="Seguimiento de tomados, pendientes y adherencia." className="card-soft weekly-module-card">
          {weeklySummary.supplementsTaken > 0 || weeklySummary.supplementsPending > 0 ? (
            <div className="mini-stat-grid">
              <div className="mini-stat">
                <span>Total tomados en la semana</span>
                <strong>{weeklySummary.supplementsTaken}</strong>
              </div>
              <div className="mini-stat">
                <span>Total pendientes en la semana</span>
                <strong>{weeklySummary.supplementsPending}</strong>
              </div>
              <div className="mini-stat">
                <span>Adherencia semanal</span>
                <strong>{weeklySummary.supplementAdherence !== null ? `${weeklySummary.supplementAdherence.toFixed(0)}%` : 'Sin suficientes datos'}</strong>
              </div>
            </div>
          ) : (
            <p className="empty-state">Sin suficientes datos esta semana</p>
          )}
        </SectionCard>

        <SectionCard title="Ayuno" subtitle="Lectura ejecutiva de logs reales, días libres y horas acumuladas." className="card-soft weekly-module-card">
          {weeklyFastingHasData ? (
            <div className="mini-stat-grid">
              <div className="mini-stat">
                <span>Ayunos completados</span>
                <strong>{weeklySummary.fastingCompleted}</strong>
              </div>
              <div className="mini-stat">
                <span>Ayunos en curso</span>
                <strong>{weeklySummary.fastingInProgress}</strong>
              </div>
              <div className="mini-stat">
                <span>Días libres</span>
                <strong>{weeklySummary.fastingFreeDays}</strong>
              </div>
              <div className="mini-stat">
                <span>Horas reales acumuladas</span>
                <strong>{weeklySummary.fastingHours.toFixed(1)} h</strong>
              </div>
              <div className="mini-stat">
                <span>Cumplimiento simple</span>
                <strong>{weeklySummary.fastingAdherence !== null ? `${weeklySummary.fastingAdherence.toFixed(0)}%` : 'Sin suficiente historial'}</strong>
              </div>
            </div>
          ) : (
            <p className="empty-state">Sin ayunos registrados esta semana</p>
          )}
        </SectionCard>

        <SectionCard title="Ejercicio" subtitle="Carga total y distribucion basica del entrenamiento." className="card-soft weekly-module-card">
          {weeklySummary.trainingSessions > 0 ? (
            <div className="mini-stat-grid">
              <div className="mini-stat">
                <span>Sesiones totales</span>
                <strong>{weeklySummary.trainingSessions}</strong>
              </div>
              <div className="mini-stat">
                <span>Minutos totales</span>
                <strong>{weeklySummary.totalExerciseMinutes} min</strong>
              </div>
              <div className="mini-stat">
                <span>Calorias quemadas</span>
                <strong>{weeklySummary.totalBurned} kcal</strong>
              </div>
              <div className="mini-stat">
                <span>Sesiones cardio</span>
                <strong>{weeklySummary.exerciseCardioSessions}</strong>
              </div>
              <div className="mini-stat">
                <span>Sesiones fuerza</span>
                <strong>{weeklySummary.exerciseStrengthSessions}</strong>
              </div>
            </div>
          ) : (
            <p className="empty-state">Sin suficientes datos esta semana</p>
          )}
        </SectionCard>

        <SectionCard title="Metricas" subtitle="Ultimas mediciones dentro de la semana seleccionada." className="card-soft weekly-module-card">
          {weeklySummary.metricCount > 0 ? (
            <div className="mini-stat-grid">
              <div className="mini-stat">
                <span>Registros</span>
                <strong>{weeklySummary.metricCount}</strong>
              </div>
              <div className="mini-stat">
                <span>Peso promedio</span>
                <strong>{weeklySummary.averageWeight !== null ? `${weeklySummary.averageWeight.toFixed(1)} kg` : 'Sin datos'}</strong>
              </div>
              <div className="mini-stat">
                <span>Grasa corporal promedio</span>
                <strong>{weeklySummary.averageBodyFat !== null ? `${weeklySummary.averageBodyFat.toFixed(1)}%` : 'Sin datos'}</strong>
              </div>
            </div>
          ) : (
            <p className="empty-state">Sin suficientes datos esta semana</p>
          )}
        </SectionCard>
      </div>
    </>
  );
}
