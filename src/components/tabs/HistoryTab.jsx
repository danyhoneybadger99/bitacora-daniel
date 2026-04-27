import HistoryView from '../HistoryView';

export default function HistoryTab(props) {
  const {
    historyDays,
    startEditing,
    deleteRecord,
    setFoodForm,
    setEditingFoodId,
    resetFoodForm,
    setHydrationForm,
    setEditingHydrationId,
    resetHydrationForm,
    setSupplementForm,
    setEditingSupplementId,
    resetSupplementForm,
    setFastingLogForm,
    setEditingFastingLogId,
    resetFastingLogForm,
    setExerciseForm,
    setEditingExerciseId,
    resetExerciseForm,
    setMetricForm,
    setEditingMetricId,
    resetMetricForm,
  } = props;

  return (
    <HistoryView
      days={historyDays}
      onEditFood={(id) => startEditing('foods', id, setFoodForm, setEditingFoodId, 'foods')}
      onDeleteFood={(id) => deleteRecord('foods', id, setEditingFoodId, resetFoodForm)}
      onEditHydration={(id) => startEditing('hydrationEntries', id, setHydrationForm, setEditingHydrationId, 'foods')}
      onDeleteHydration={(id) => deleteRecord('hydrationEntries', id, setEditingHydrationId, resetHydrationForm)}
      onEditSupplement={(id) => startEditing('supplements', id, setSupplementForm, setEditingSupplementId, 'supplements')}
      onDeleteSupplement={(id) => deleteRecord('supplements', id, setEditingSupplementId, resetSupplementForm)}
      onEditFasting={(id) => startEditing('fastingLogs', id, setFastingLogForm, setEditingFastingLogId, 'fasting')}
      onDeleteFasting={(id) => deleteRecord('fastingLogs', id, setEditingFastingLogId, resetFastingLogForm)}
      onEditExercise={(id) => startEditing('exercises', id, setExerciseForm, setEditingExerciseId, 'exercises')}
      onDeleteExercise={(id) => deleteRecord('exercises', id, setEditingExerciseId, resetExerciseForm)}
      onEditMetric={(id) => startEditing('bodyMetrics', id, setMetricForm, setEditingMetricId, 'metrics')}
      onDeleteMetric={(id) => deleteRecord('bodyMetrics', id, setEditingMetricId, resetMetricForm)}
    />
  );
}
