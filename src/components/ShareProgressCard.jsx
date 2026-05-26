import { useEffect, useMemo, useRef, useState } from 'react';
import {
  buildShareCardText,
  createShareCardPngBlob,
  defaultTemplateByCardType,
  getShareTemplatesForType,
  getShareStoryVisual,
  shareAvailabilityLabels,
  shareProgressCardTypes,
} from '../utils/domain/shareProgress';

function getBadgeValue(badge, mode) {
  return mode === 'personal' ? badge.personalValue : badge.publicValue;
}

function getBadgesForMode(summary, mode, detailLevel = 'discreet') {
  const badgeLimit = Number.isFinite(Number(summary?.badgeLimit)) ? Number(summary.badgeLimit) : 4;

  if (mode === 'personal' && summary?.type === 'food' && Array.isArray(summary?.macroBadges) && summary.macroBadges.length > 0) {
    return summary.macroBadges.slice(0, 4);
  }

  if (mode === 'personal' && Array.isArray(summary?.personalBadges) && summary.personalBadges.length > 0) {
    return summary.personalBadges.slice(0, 4);
  }

  if (mode === 'public' && detailLevel === 'macros' && Array.isArray(summary?.macroBadges) && summary.macroBadges.length > 0) {
    return summary.macroBadges.slice(0, 4);
  }

  return (summary?.badges || summary?.metrics || []).slice(0, badgeLimit);
}

function getAvailabilityClass(availability) {
  if (availability === 'ready') return 'share-option-ready';
  if (availability === 'in_progress' || availability === 'under_construction') return 'share-option-progress';
  if (availability === 'no_record_today') return 'share-option-empty';
  return 'share-option-missing';
}

function getStoryTextDensityClass(value = '', baseClass = '') {
  const text = String(value || '');
  if (text.length > 34) return `${baseClass} ${baseClass}-compact`.trim();
  if (text.length > 22) return `${baseClass} ${baseClass}-balanced`.trim();
  return baseClass;
}

function getShareOptionDescription(cardType, optionSummary) {
  const availability = optionSummary?.availability || 'missing_data_source';

  if (cardType === 'food') {
    return availability === 'no_record_today' ? 'Registra una comida para compartirla' : 'Comida registrada';
  }

  if (cardType === 'exercise') {
    return availability === 'no_record_today' ? 'Registra una sesion para compartirla' : 'Sesion registrada';
  }

  if (cardType === 'daily' && availability === 'under_construction') {
    return 'Todavia se esta construyendo el dia';
  }

  return optionSummary?.primaryMetric || optionSummary?.subtitle || 'Pendiente';
}

function getPrimaryMetricLines(summary, detailLevel = 'discreet') {
  if (summary?.type === 'food' && detailLevel === 'macros' && Array.isArray(summary?.macroPrimaryMetricLines)) {
    return summary.macroPrimaryMetricLines.slice(0, 2);
  }

  if (Array.isArray(summary?.primaryMetricLines) && summary.primaryMetricLines.length > 0) {
    return summary.primaryMetricLines.slice(0, 2);
  }

  return [summary?.primaryMetric || ''];
}

function getShareOptionStatusLabel(cardType, availability) {
  if ((cardType === 'food' || cardType === 'exercise') && availability === 'ready') {
    return 'Listo para story';
  }

  return shareAvailabilityLabels[availability] || 'Pendiente';
}

export default function ShareProgressCard({ summaries, summary, launchRequest }) {
  const normalizedSummaries = summaries || { daily: summary };
  const [isOpen, setIsOpen] = useState(false);
  const [cardType, setCardType] = useState('daily');
  const [selectedPostIds, setSelectedPostIds] = useState({});
  const [foodPhotoDataUrl, setFoodPhotoDataUrl] = useState('');
  const [foodPhotoName, setFoodPhotoName] = useState('');
  const foodPhotoInputRef = useRef(null);
  const [mode, setMode] = useState('public');
  const [nutritionDetail, setNutritionDetail] = useState('discreet');
  const [templateId, setTemplateId] = useState(defaultTemplateByCardType.daily);
  const [feedback, setFeedback] = useState('');
  const [busyAction, setBusyAction] = useState('');
  const selectedGroupSummary = normalizedSummaries?.[cardType] || normalizedSummaries?.daily || summary;
  const selectedSummary = useMemo(() => {
    const options = Array.isArray(selectedGroupSummary?.options) ? selectedGroupSummary.options : [];
    if (options.length === 0) return selectedGroupSummary;

    const selectedId = selectedPostIds[cardType];
    return options.find((item) => String(item.id) === String(selectedId)) || options[options.length - 1] || options[0];
  }, [cardType, selectedGroupSummary, selectedPostIds]);
  const availableTemplates = useMemo(() => getShareTemplatesForType(cardType), [cardType]);
  const template = availableTemplates.find((item) => item.id === templateId) || availableTemplates[0];
  const visibleBadges = useMemo(
    () => getBadgesForMode(selectedSummary, mode, nutritionDetail),
    [mode, nutritionDetail, selectedSummary]
  );
  const shareText = useMemo(
    () => buildShareCardText(selectedSummary, { mode, templateId: template?.id, detailLevel: nutritionDetail }),
    [mode, nutritionDetail, selectedSummary, template?.id]
  );
  const storyVisual = useMemo(
    () => getShareStoryVisual(selectedSummary, { detailLevel: nutritionDetail }),
    [nutritionDetail, selectedSummary]
  );
  const canShareSelected = selectedSummary?.availability === 'ready';

  useEffect(() => {
    const nextTemplateId = defaultTemplateByCardType[cardType] || availableTemplates[0]?.id;
    if (!availableTemplates.some((item) => item.id === templateId) && nextTemplateId) {
      setTemplateId(nextTemplateId);
    }
  }, [availableTemplates, cardType, templateId]);

  async function copyText() {
    try {
      setBusyAction('copy');
      await navigator.clipboard.writeText(shareText);
      setFeedback('Caption copiado.');
    } catch {
      setFeedback('No se pudo copiar automaticamente. Puedes seleccionar el texto manualmente.');
    } finally {
      setBusyAction('');
    }
  }

  async function createImageBlob() {
    const blob = await createShareCardPngBlob(selectedSummary, {
      mode,
      templateId: template?.id,
      photoDataUrl: cardType === 'food' ? foodPhotoDataUrl : '',
      detailLevel: nutritionDetail,
    });
    if (!blob) throw new Error('No se pudo generar la imagen.');
    return blob;
  }

  async function downloadImage() {
    if (!canShareSelected) {
      setFeedback('Esta tarjeta aun necesita un dato real antes de compartirse.');
      return;
    }

    try {
      setBusyAction('download');
      setFeedback('Generando imagen...');
      const blob = await createImageBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bitacora-daniel-progreso-${selectedSummary?.date || 'hoy'}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setFeedback('Imagen descargada.');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'No se pudo descargar la imagen.');
    } finally {
      setBusyAction('');
    }
  }

  async function shareImage() {
    if (!canShareSelected) {
      setFeedback('Esta tarjeta aun necesita un dato real antes de compartirse.');
      return;
    }

    try {
      setBusyAction('share');
      setFeedback('Preparando tarjeta...');
      const blob = await createImageBlob();
      const file = new File([blob], `bitacora-daniel-progreso-${selectedSummary?.date || 'hoy'}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: 'Bitacora Daniel',
          text: shareText,
          files: [file],
        });
        setFeedback('Tarjeta lista para compartir.');
        return;
      }

      await downloadImage();
      setFeedback('Tu navegador no permite compartir archivos aqui. Descargue la imagen como fallback.');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'No se pudo compartir la tarjeta.');
    } finally {
      setBusyAction('');
    }
  }

  useEffect(() => {
    if (!launchRequest?.nonce && !launchRequest?.cardType) return;

    const nextType = launchRequest.cardType || 'daily';
    setCardType(nextType);
    setTemplateId(defaultTemplateByCardType[nextType] || getShareTemplatesForType(nextType)[0]?.id);
    if (launchRequest.itemId) {
      setSelectedPostIds((current) => ({
        ...current,
        [nextType]: String(launchRequest.itemId),
      }));
    }
    setFeedback('');
    setIsOpen(true);
  }, [launchRequest?.cardType, launchRequest?.itemId, launchRequest?.nonce]);

  if (!selectedSummary) return null;

  const selectedOptions = Array.isArray(selectedGroupSummary?.options) ? selectedGroupSummary.options : [];
  const selectedPhotoUrl = cardType === 'food' ? foodPhotoDataUrl : '';
  const dailyPostReady = ['food', 'exercise'].some((item) => normalizedSummaries?.[item]?.availability === 'ready');
  const shareGroupOrder = dailyPostReady
    ? [
        ['daily_post', 'Post del dia'],
        ['achievements', 'Logros y avances'],
        ['preparation', 'En preparacion'],
      ]
    : [
        ['achievements', 'Logros y avances'],
        ['daily_post', 'Post del dia'],
        ['preparation', 'En preparacion'],
      ];
  const cardSortOrder = { food: 1, exercise: 2, sobriety: 3, krav: 4, physical: 5, daily: 6, monthly: 7 };

  function selectCardType(nextType) {
    setCardType(nextType);
    setTemplateId(defaultTemplateByCardType[nextType] || getShareTemplatesForType(nextType)[0]?.id);
    setFeedback('');
  }

  function handleFoodPhotoChange(event) {
    const file = event.target.files?.[0];
    if (!file) {
      setFoodPhotoDataUrl('');
      setFoodPhotoName('');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFoodPhotoDataUrl(typeof reader.result === 'string' ? reader.result : '');
      setFoodPhotoName(file.name);
    };
    reader.readAsDataURL(file);
  }

  return (
    <section className="share-progress-entry card-soft">
      <div>
        <span>Comparte un avance</span>
        <strong>Crear tarjeta social</strong>
        <p>Elige un logro, comida o entrenamiento que valga la pena compartir hoy.</p>
      </div>
      <button className="button button-primary" type="button" onClick={() => setIsOpen(true)}>
        Crear tarjeta
      </button>

      {isOpen ? (
        <div className="modal-backdrop share-progress-modal" role="dialog" aria-modal="true" aria-label="Compartir progreso">
          <div className="modal-card share-progress-modal-card">
            <div className="modal-header">
              <div>
                <h3>Compartir progreso</h3>
                <p>Elige un avance real para convertirlo en historia.</p>
              </div>
              <button className="button button-secondary share-modal-close" type="button" onClick={() => setIsOpen(false)}>
                Cerrar
              </button>
            </div>

            <div className="share-progress-body">
              <div className="share-progress-preview-column">
                <article
                  className={`share-story-card share-story-card-${cardType} share-story-card-${template?.id || 'daily'} ${selectedPhotoUrl ? 'share-story-card-with-photo' : ''}`}
                  style={selectedPhotoUrl ? { '--share-card-photo': `url("${selectedPhotoUrl}")` } : undefined}
                >
                  <div className="share-story-shell">
                    <header>
                      <span>{storyVisual.eyebrow}</span>
                      <small>{selectedSummary.dateLabel}</small>
                    </header>
                    <div className="share-story-status">
                      <strong className={getStoryTextDensityClass(storyVisual.headline, 'share-story-title')}>
                        {storyVisual.headline}
                      </strong>
                      <div className="share-story-primary">
                        <span className={getStoryTextDensityClass(storyVisual.heroValue, 'share-story-primary-value')}>
                          {storyVisual.heroValue}
                        </span>
                        <small>{storyVisual.heroUnit}</small>
                      </div>
                      <p>{storyVisual.contextLine}</p>
                      {storyVisual.description && storyVisual.description !== storyVisual.contextLine ? (
                        <p className="share-story-description">{storyVisual.description}</p>
                      ) : null}
                    </div>
                    <div className="share-story-metrics">
                      {visibleBadges.map((badge) => (
                        <div className="share-story-metric" key={badge.label}>
                          <span className={badge.met ? 'share-metric-dot share-metric-dot-ok' : 'share-metric-dot'} />
                          <div>
                            <strong>{badge.label}</strong>
                            <small>{getBadgeValue(badge, mode)}</small>
                          </div>
                        </div>
                      ))}
                    </div>
                    <footer>
                      <strong>{storyVisual.storyLine}</strong>
                      <span>Bitácora Daniel</span>
                    </footer>
                  </div>
                </article>
              </div>

              <div className="share-progress-side">
                <div className="share-card-picker">
                  <div>
                    <strong>Elige que quieres compartir</strong>
                    <p>Elige un avance real para convertirlo en historia.</p>
                  </div>
                  {shareGroupOrder.map(([groupId, groupLabel]) => (
                    <div className={`share-card-group ${groupId === 'preparation' ? 'share-card-group-preparation' : ''}`} key={groupId}>
                      <span>{groupLabel}</span>
                      {groupId === 'daily_post' ? (
                        <p className="share-card-group-helper">
                          Para compartir comida o ejercicio, primero registra una comida o una sesion del dia. Despues aparecera aqui como lista para compartir.
                        </p>
                      ) : null}
                      {groupId === 'preparation' ? (
                        <p className="share-card-group-helper">
                          Estas tarjetas quedan guardadas para una siguiente fase. No son errores.
                        </p>
                      ) : null}
                      <div className="share-card-options">
                        {shareProgressCardTypes
                          .filter((item) => item.group === groupId)
                          .filter((item) => Boolean(normalizedSummaries?.[item.id]))
                          .sort((a, b) => (cardSortOrder[a.id] || 99) - (cardSortOrder[b.id] || 99))
                          .map((item) => {
                            const optionSummary = normalizedSummaries?.[item.id];
                            const availability = optionSummary?.availability || 'missing_data_source';
                            const isSelected = item.id === cardType;
                            return (
                              <button
                                className={`share-card-option ${isSelected ? 'share-card-option-active' : ''} ${getAvailabilityClass(availability)}`}
                                key={item.id}
                                type="button"
                                onClick={() => selectCardType(item.id)}
                              >
                                <span>{item.label}</span>
                                <strong>{getShareOptionStatusLabel(item.id, availability)}</strong>
                                <small>{getShareOptionDescription(item.id, optionSummary)}</small>
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  ))}
                </div>

                {selectedOptions.length > 1 ? (
                  <label className="share-post-selector">
                    <span>{cardType === 'food' ? 'Comida para compartir' : 'Sesion para compartir'}</span>
                    <select
                      value={String(selectedSummary?.id || '')}
                      onChange={(event) => {
                        setSelectedPostIds((current) => ({
                          ...current,
                          [cardType]: event.target.value,
                        }));
                        setFeedback('');
                      }}
                    >
                      {selectedOptions.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.optionLabel || item.title}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : selectedOptions.length === 1 && canShareSelected && (cardType === 'food' || cardType === 'exercise') ? (
                  <div className="share-selected-post-note">
                    <span>{cardType === 'food' ? 'Comida seleccionada' : 'Sesion seleccionada'}</span>
                    <strong>{selectedOptions[0].optionLabel || selectedOptions[0].subtitle || selectedOptions[0].title}</strong>
                  </div>
                ) : null}

                {cardType === 'food' ? (
                  <div className="share-food-photo-control">
                    <p className="section-helper">Foto opcional. Solo se usa para esta imagen; no se guarda.</p>
                    <input
                      ref={foodPhotoInputRef}
                      className="share-food-photo-input"
                      type="file"
                      accept="image/*"
                      onChange={handleFoodPhotoChange}
                    />
                    {foodPhotoName ? (
                      <div className="share-food-photo-preview">
                        {foodPhotoDataUrl ? <img src={foodPhotoDataUrl} alt="Preview del platillo" /> : null}
                        <div className="share-food-photo-meta">
                          <span>{foodPhotoName}</span>
                          <div className="entry-actions">
                            <button
                              className="button button-secondary"
                              type="button"
                              onClick={() => foodPhotoInputRef.current?.click()}
                            >
                              Cambiar foto
                            </button>
                            <button
                              className="button button-ghost"
                              type="button"
                              onClick={() => {
                                setFoodPhotoDataUrl('');
                                setFoodPhotoName('');
                                if (foodPhotoInputRef.current) foodPhotoInputRef.current.value = '';
                              }}
                            >
                              Quitar foto
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button
                          className="button button-secondary"
                          type="button"
                          onClick={() => foodPhotoInputRef.current?.click()}
                        >
                          Agregar foto del platillo
                        </button>
                      </>
                    )}
                  </div>
                ) : null}

                <div className="share-progress-controls share-progress-controls-simple">
                  <label>
                    <span>Modo</span>
                    <select value={mode} onChange={(event) => setMode(event.target.value)}>
                      <option value="public">Publico</option>
                      <option value="personal">Personal</option>
                    </select>
                  </label>
                  {availableTemplates.length > 1 ? (
                    <label>
                      <span>Estilo</span>
                      <select value={template?.id || templateId} onChange={(event) => setTemplateId(event.target.value)}>
                        {availableTemplates.map((item) => (
                          <option key={item.id} value={item.id}>{item.label}</option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                  {cardType === 'food' && mode === 'public' ? (
                    <label>
                      <span>Nivel de detalle</span>
                      <select value={nutritionDetail} onChange={(event) => setNutritionDetail(event.target.value)}>
                        <option value="discreet">Discreto</option>
                        <option value="macros">Con macros</option>
                      </select>
                    </label>
                  ) : null}
                </div>

                <p className="section-helper">
                  Modo publico oculta calorias exactas, peso, grasa corporal y datos sensibles. Modo personal muestra mas detalle para uso propio.
                </p>
                <pre className="share-progress-text-preview">{shareText}</pre>
                <div className="share-progress-action-footer">
                  {!canShareSelected ? (
                    <div className="alert-banner share-missing-data-note">
                      {selectedSummary?.availability === 'no_record_today'
                        ? 'Todavia no hay registro hoy para generar esta tarjeta. Copiar caption sigue disponible como recordatorio.'
                        : selectedSummary?.availability === 'under_construction'
                          ? 'Esta tarjeta se desbloquea cuando el dia llega a 5/6 habitos.'
                          : 'Tarjeta en preparacion. Falta conectar una fuente real; no es un error.'}
                    </div>
                  ) : null}
                  <div className="entry-actions share-progress-actions">
                    <button className="button button-primary" type="button" onClick={downloadImage} disabled={Boolean(busyAction) || !canShareSelected}>
                      {busyAction === 'download' ? 'Generando...' : 'Descargar imagen'}
                    </button>
                    <button className="button button-secondary" type="button" onClick={shareImage} disabled={Boolean(busyAction) || !canShareSelected}>
                      {busyAction === 'share' ? 'Preparando...' : 'Compartir'}
                    </button>
                    <button className="button button-secondary" type="button" onClick={copyText} disabled={Boolean(busyAction)}>
                      {busyAction === 'copy' ? 'Copiando...' : 'Copiar caption'}
                    </button>
                  </div>
                  {feedback ? <p className="form-feedback form-feedback-success">{feedback}</p> : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
