const defaultDisclaimer =
  'Las respuestas de IA son estimaciones. Registra tus datos reales lo mejor posible y usa criterio personal; esto no sustituye consejo médico o nutricional.';

const sectionLabels = {
  intro: 'Introducción',
  aiTip: 'Tip de IA',
  personalReflection: 'Reflexión personal',
  actionStep: 'Acción de la semana',
  bitacoraPrompt: 'Prompt sugerido para la bitácora',
  disclaimerNote: 'Nota final',
};

function normalizeNewsletter(newsletter = {}) {
  return {
    subject: String(newsletter.subject || 'Newsletter Bitácora Daniel').trim(),
    preheader: String(newsletter.preheader || '').trim(),
    title: String(newsletter.title || newsletter.subject || 'Bitácora Daniel').trim(),
    intro: String(newsletter.intro || '').trim(),
    aiTip: String(newsletter.aiTip || '').trim(),
    personalReflection: String(newsletter.personalReflection || '').trim(),
    actionStep: String(newsletter.actionStep || '').trim(),
    bitacoraPrompt: String(newsletter.bitacoraPrompt || '').trim(),
    disclaimerNote: String(newsletter.disclaimerNote || defaultDisclaimer).trim(),
  };
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderHtmlSection(label, content, options = {}) {
  if (!content) return '';

  const isPrompt = Boolean(options.isPrompt);
  const background = isPrompt ? '#f6f1eb' : '#ffffff';
  const border = isPrompt ? '#e2d4c2' : '#e7ecef';

  return `
    <tr>
      <td style="padding: 0 0 14px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; background: ${background}; border: 1px solid ${border}; border-radius: 14px;">
          <tr>
            <td style="padding: 16px 18px;">
              <p style="margin: 0 0 8px 0; color: #8b3f47; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;">${escapeHtml(label)}</p>
              <p style="margin: 0; color: #24313a; font-size: 15px; line-height: 1.55;">${escapeHtml(content)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

export function renderNewsletterHtml(newsletter) {
  const normalized = normalizeNewsletter(newsletter);

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(normalized.subject)}</title>
  </head>
  <body style="margin: 0; padding: 0; background: #f2f5f1; color: #24313a; font-family: Arial, Helvetica, sans-serif;">
    <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; color: transparent;">
      ${escapeHtml(normalized.preheader)}
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; background: #f2f5f1;">
      <tr>
        <td align="center" style="padding: 28px 14px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; max-width: 640px; background: #ffffff; border: 1px solid #dde5df; border-radius: 22px; overflow: hidden;">
            <tr>
              <td style="padding: 28px 26px 16px 26px;">
                <p style="margin: 0 0 10px 0; color: #60707a; font-size: 12px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase;">Bitácora Daniel</p>
                <h1 style="margin: 0; color: #17212b; font-size: 28px; line-height: 1.15;">${escapeHtml(normalized.title)}</h1>
                ${
                  normalized.preheader
                    ? `<p style="margin: 12px 0 0 0; color: #586875; font-size: 15px; line-height: 1.5;">${escapeHtml(normalized.preheader)}</p>`
                    : ''
                }
              </td>
            </tr>
            <tr>
              <td style="padding: 0 26px 10px 26px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                  ${renderHtmlSection(sectionLabels.intro, normalized.intro)}
                  ${renderHtmlSection(sectionLabels.aiTip, normalized.aiTip)}
                  ${renderHtmlSection(sectionLabels.personalReflection, normalized.personalReflection)}
                  ${renderHtmlSection(sectionLabels.actionStep, normalized.actionStep)}
                  ${renderHtmlSection(sectionLabels.bitacoraPrompt, normalized.bitacoraPrompt, { isPrompt: true })}
                  ${renderHtmlSection(sectionLabels.disclaimerNote, normalized.disclaimerNote)}
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 18px 26px 26px 26px; border-top: 1px solid #edf1ee;">
                <p style="margin: 0; color: #74818a; font-size: 12px; line-height: 1.5;">
                  Recibes este contenido porque aceptaste recibir tips de bienestar, hábitos y progreso de Bitácora Daniel.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function renderNewsletterText(newsletter) {
  const normalized = normalizeNewsletter(newsletter);
  const lines = [
    `Asunto: ${normalized.subject}`,
    `Preheader: ${normalized.preheader}`,
    '',
    normalized.title,
    '',
    `${sectionLabels.intro}:`,
    normalized.intro,
    '',
    `${sectionLabels.aiTip}:`,
    normalized.aiTip,
    '',
    `${sectionLabels.personalReflection}:`,
    normalized.personalReflection,
    '',
    `${sectionLabels.actionStep}:`,
    normalized.actionStep,
    '',
    `${sectionLabels.bitacoraPrompt}:`,
    normalized.bitacoraPrompt,
    '',
    `${sectionLabels.disclaimerNote}:`,
    normalized.disclaimerNote,
  ];

  return lines.filter((line, index) => line || lines[index - 1]).join('\n');
}

export function renderNewsletterPreview(newsletter) {
  const normalized = normalizeNewsletter(newsletter);

  return {
    subject: normalized.subject,
    preheader: normalized.preheader,
    html: renderNewsletterHtml(normalized),
    text: renderNewsletterText(normalized),
  };
}
