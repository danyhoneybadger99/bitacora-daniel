import { useState } from 'react';
import { formatDate, formatDateTimeHuman } from '../utils/date';

const mealTypeLabels = {
  desayuno: 'Desayuno',
  comida: 'Comida',
  cena: 'Cena',
  snack: 'Snack',
};

const mealTypeOrder = ['desayuno', 'comida', 'cena', 'snack'];

function truncateText(text, maxLength = 90) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
}

function HistoryGroup({ title, items, typeLabel, onEdit, onDelete, renderSummary }) {
  if (items.length === 0) return null;

  return (
    <div className="history-group">
      <div className="history-group-header">
        <h4>{title}</h4>
        <span>{items.length}</span>
      </div>
      <div className="history-items">
        {items.map((item) => (
          <article className="history-item" key={item.id}>
            <div>
              <strong>{typeLabel}</strong>
              <p>{renderSummary(item)}</p>
            </div>
            <div className="entry-actions">
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
    </div>
  );
}

function FoodHistoryGroup({ items, onEdit, onDelete }) {
  if (items.length === 0) return null;

  const groupedFoods = mealTypeOrder
    .map((mealType) => ({
      mealType,
      label: mealTypeLabels[mealType],
      items: items
        .filter((item) => item.mealType === mealType)
        .sort((a, b) => {
          const timeA = a.time || '99:99';
          const timeB = b.time || '99:99';

          if (timeA !== timeB) return timeA.localeCompare(timeB);
          return String(b.id).localeCompare(String(a.id));
        }),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="history-group">
      <div className="history-group-header">
        <h4>Alimentos</h4>
        <span>{items.length}</span>
      </div>
      <div className="history-food-groups">
        {groupedFoods.map((group) => (
          <div className="history-food-group" key={group.mealType}>
            <h5>{group.label}</h5>
            <div className="history-items">
              {group.items.map((item) => (
                <article className="history-item" key={item.id}>
                  <div>
                    <strong>
                      {item.name || 'Sin nombre'}
                      {item.time ? ` - ${item.time}` : ''}
                    </strong>
                    <p>
                      {truncateText([
                        item.quantity && `${item.quantity} ${item.unit || ''}`.trim(),
                        item.category,
                        `${item.calories || 0} kcal`,
                        `${item.protein || 0} g prot`,
                        `${item.carbs || 0} g carbos`,
                        `${item.fat || 0} g grasa`,
                        item.notes,
                      ]
                        .filter(Boolean)
                        .join(' • '))}
                    </p>
                  </div>
                  <div className="entry-actions">
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
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HistoryView({
  days,
  onEditFood,
  onDeleteFood,
  onEditHydration,
  onDeleteHydration,
  onEditSupplement,
  onDeleteSupplement,
  onEditFasting,
  onDeleteFasting,
  onEditExercise,
  onDeleteExercise,
  onEditMetric,
  onDeleteMetric,
}) {
  const [expandedDays, setExpandedDays] = useState(() => ({}));

  function getFastingHistoryStatus(item) {
    return item?.derivedStatus || 'pendiente';
  }

  if (days.length === 0) {
    return <p className="empty-state">Todavia no hay registros en el historial.</p>;
  }

  return (
    <div className="history-view">
      {days.map((day) => (
        <section className={`card history-day-card ${expandedDays[day.date] === false ? 'history-day-collapsed' : ''}`} key={day.date}>
          <div className="card-header">
            <div>
              <h2>{formatDate(day.date)}</h2>
              <p>
                {day.totalItems} registro{day.totalItems === 1 ? '' : 's'} en este dia
              </p>
            </div>
            <button
              className="button button-secondary"
              type="button"
              onClick={() =>
                setExpandedDays((current) => ({
                  ...current,
                  [day.date]: current[day.date] === false,
                }))
              }
            >
              {expandedDays[day.date] === false ? 'Expandir' : 'Colapsar'}
            </button>
          </div>

          <div className="history-day-summary">
            {day.summary.calories > 0 ? <span>{day.summary.calories} kcal</span> : null}
            {day.summary.protein > 0 ? <span>{day.summary.protein.toFixed(1)} g proteina</span> : null}
            {day.summary.hydrationMl > 0 ? <span>{day.summary.hydrationMl.toFixed(0)} ml hidratacion</span> : null}
            {day.summary.supplementsTaken > 0 ? <span>{day.summary.supplementsTaken} suplemento(s) tomados</span> : null}
            {day.summary.fastingCompleted > 0 ? <span>{day.summary.fastingCompleted} ayuno(s) cumplidos</span> : null}
            {day.summary.exerciseMinutes > 0 ? <span>{day.summary.exerciseMinutes} min de ejercicio</span> : null}
            {day.summary.weight ? <span>Peso {day.summary.weight} kg</span> : null}
          </div>

          {expandedDays[day.date] === false ? null : (
            <>
              <FoodHistoryGroup items={day.foods} onEdit={onEditFood} onDelete={onDeleteFood} />

              <HistoryGroup
                title="Hidratacion"
                items={day.hydrationEntries}
                typeLabel="Bebida"
                onEdit={onEditHydration}
                onDelete={onDeleteHydration}
                renderSummary={(item) =>
                  truncateText([
                    item.name || item.drinkType || 'sin nombre',
                    `${item.quantity || 0} ${item.unit || 'ml'}`,
                    item.containsCaffeine === 'si' ? 'cafeina' : null,
                    item.containsElectrolytes === 'si' ? 'con electrolitos' : null,
                    item.time ? item.time : null,
                    item.notes || null,
                  ]
                    .filter(Boolean)
                    .join(' • '))
                }
              />

              <HistoryGroup
                title="Suplementos y medicamentos"
                items={day.supplements}
                typeLabel="Suplemento / medicamento"
                onEdit={onEditSupplement}
                onDelete={onDeleteSupplement}
                renderSummary={(item) =>
                  truncateText(
                    `${item.name || 'sin nombre'} • ${item.category} • ${item.dose || 'sin dato'} ${item.unit || ''} • ${
                      item.time || 'sin hora'
                    }`
                  )
                }
              />

              <HistoryGroup
                title="Ayuno"
                items={day.fastingLogs}
                typeLabel="Ayuno"
                onEdit={onEditFasting}
                onDelete={onDeleteFasting}
                renderSummary={(item) =>
                  truncateText([
                    item.expectedProtocol || 'sin protocolo esperado',
                    item.actualDuration ? `${item.actualDuration} h` : 'sin duracion',
                    getFastingHistoryStatus(item),
                    item.actualStartDateTime ? `inicio ${formatDateTimeHuman(item.actualStartDateTime)}` : null,
                    item.actualBreakDateTime ? `ruptura ${formatDateTimeHuman(item.actualBreakDateTime)}` : null,
                    item.notes || null,
                  ]
                    .filter(Boolean)
                    .join(' • '))
                }
              />

              <HistoryGroup
                title="Ejercicio"
                items={day.exercises}
                typeLabel="Ejercicio"
                onEdit={onEditExercise}
                onDelete={onDeleteExercise}
                renderSummary={(item) =>
                  truncateText(
                    `${item.name || 'Sin nombre'} • ${item.duration || 0} min • ${item.caloriesBurned || 0} kcal${
                      item.notes ? ` • ${item.notes}` : ''
                    }`
                  )
                }
              />

              <HistoryGroup
                title="Metricas corporales"
                items={day.bodyMetrics}
                typeLabel="Metricas"
                onEdit={onEditMetric}
                onDelete={onDeleteMetric}
                renderSummary={(item) =>
                  truncateText([
                    `Peso ${item.weight || 0} kg`,
                    item.bodyFat ? `grasa corporal ${item.bodyFat}%` : null,
                    item.skeletalMuscleMass ? `musculo esqueletico ${item.skeletalMuscleMass} kg` : null,
                    item.bodyFatMass ? `masa grasa ${item.bodyFatMass} kg` : null,
                    `cintura ${item.waist || 0} cm`,
                    item.chest ? `pecho ${item.chest} cm` : null,
                    `brazo ${item.arm || 0} cm`,
                    `pierna ${item.leg || 0} cm`,
                    item.hips ? `cadera ${item.hips} cm` : null,
                    item.neck ? `cuello ${item.neck} cm` : null,
                    item.dataSource ? `origen ${item.dataSource === 'inbody' ? 'InBody' : 'Manual'}` : null,
                    item.observations || null,
                  ]
                    .filter(Boolean)
                    .join(' • '))
                }
              />
            </>
          )}
        </section>
      ))}
    </div>
  );
}
