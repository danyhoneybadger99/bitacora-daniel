import { renderNewsletterHtml, renderNewsletterText } from './newsletterRenderer';

export const NEWSLETTER_ADMIN_DEFAULTS = {
  currentIssueId: 'week-1',
  status: 'draft',
  readyAt: '',
  manuallySentAt: '',
  scheduledDay: 'wednesday',
  scheduledTime: '12:00',
  timezone: 'America/Monterrey',
};

export const NEWSLETTER_ADMIN_STATUS_LABELS = {
  draft: 'Borrador',
  ready: 'Listo para enviar',
  manually_sent: 'Enviado manualmente',
};

export function createDefaultNewsletterAdmin(overrides = {}) {
  return {
    ...NEWSLETTER_ADMIN_DEFAULTS,
    ...overrides,
  };
}

export function normalizeNewsletterAdmin(newsletterAdmin = {}) {
  const status = NEWSLETTER_ADMIN_STATUS_LABELS[newsletterAdmin?.status]
    ? newsletterAdmin.status
    : NEWSLETTER_ADMIN_DEFAULTS.status;

  return createDefaultNewsletterAdmin({
    currentIssueId: String(newsletterAdmin?.currentIssueId || NEWSLETTER_ADMIN_DEFAULTS.currentIssueId),
    status,
    readyAt: String(newsletterAdmin?.readyAt || ''),
    manuallySentAt: String(newsletterAdmin?.manuallySentAt || ''),
    scheduledDay: String(newsletterAdmin?.scheduledDay || NEWSLETTER_ADMIN_DEFAULTS.scheduledDay),
    scheduledTime: String(newsletterAdmin?.scheduledTime || NEWSLETTER_ADMIN_DEFAULTS.scheduledTime),
    timezone: String(newsletterAdmin?.timezone || NEWSLETTER_ADMIN_DEFAULTS.timezone),
  });
}

export function getCurrentNewsletterIssue(options = [], currentDate = new Date()) {
  const weeklyOptions = Array.isArray(options)
    ? options.filter((item) => String(item?.id || '').startsWith('week-'))
    : [];

  if (weeklyOptions.length === 0) {
    return Array.isArray(options) ? options[0] || null : null;
  }

  const startOfYear = new Date(currentDate.getFullYear(), 0, 1);
  const weekIndex = Math.max(0, Math.floor((currentDate - startOfYear) / (7 * 24 * 60 * 60 * 1000)));

  return weeklyOptions[weekIndex % weeklyOptions.length] || weeklyOptions[0];
}

export function getNewsletterRecipientsCandidate(appUsers = []) {
  return Array.isArray(appUsers)
    ? appUsers
        .filter((item) => item?.newsletter_opt_in === true || item?.newsletterOptIn === true)
        .map((item) => ({
          userId: item.user_id || item.userId || '',
          email: String(item.email || '').trim(),
          profileType: item.profile_type || item.profileType || 'fitness-basic',
        }))
        .filter((item) => item.email)
    : [];
}

export function buildNewsletterEmailPayload(newsletter, recipient = {}) {
  if (!newsletter || !recipient?.email) return null;

  return {
    to: recipient.email,
    subject: newsletter.subject || 'Newsletter Bitácora Daniel',
    preheader: newsletter.preheader || '',
    html: renderNewsletterHtml(newsletter),
    text: renderNewsletterText(newsletter),
  };
}

const weekdayIndexByShortName = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

function getZonedDateParts(date = new Date(), timezone = NEWSLETTER_ADMIN_DEFAULTS.timezone) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));

  return {
    weekday: weekdayIndexByShortName[String(parts.weekday || '').toLowerCase()] ?? date.getDay(),
    hour: Number(parts.hour || date.getHours()),
    minute: Number(parts.minute || date.getMinutes()),
  };
}

function getSelectedNewsletterStatus(newsletterAdmin = {}, issueId = '') {
  const normalized = normalizeNewsletterAdmin(newsletterAdmin);
  return normalized.currentIssueId === issueId ? normalized.status : 'draft';
}

export function getNewsletterEditorialReminder(newsletterAdmin = {}, issueId = '', now = new Date()) {
  const normalized = normalizeNewsletterAdmin(newsletterAdmin);
  const status = getSelectedNewsletterStatus(normalized, issueId);
  const timezone = normalized.timezone || NEWSLETTER_ADMIN_DEFAULTS.timezone;
  const { weekday, hour } = getZonedDateParts(now, timezone);
  const base = {
    currentIssue: issueId || normalized.currentIssueId,
    editorialReminderLevel: 'none',
    message: '',
    nextSendAt: 'miércoles 12:00 p.m.',
    prepareByAt: 'lunes 12:00 p.m.',
    minimumPrepareByAt: 'martes 12:00 p.m.',
    timezone,
    requiresDashboardAttention: false,
  };

  if (status === 'manually_sent') {
    return {
      ...base,
      editorialReminderLevel: 'sent',
      message: 'Newsletter enviado. Revisa newsletter_send_log en Supabase.',
    };
  }

  if (status === 'ready') {
    return {
      ...base,
      editorialReminderLevel: 'ready',
      message: 'Newsletter listo. Pendiente de envío manual.',
      requiresDashboardAttention: true,
    };
  }

  const isMondayAfterNoon = weekday === 1 && hour >= 12;
  const isTuesdayAfterNoon = weekday === 2 && hour >= 12;
  const isWednesdayBeforeNoon = weekday === 3 && hour < 12;
  const isPastSuggestedSendWindow = weekday === 3 && hour >= 12;

  if (isPastSuggestedSendWindow) {
    return {
      ...base,
      editorialReminderLevel: 'critical',
      message: 'La ventana sugerida ya pasó. Revisa el contenido y marca el newsletter como listo.',
      requiresDashboardAttention: true,
    };
  }

  if (isWednesdayBeforeNoon) {
    return {
      ...base,
      editorialReminderLevel: 'critical',
      message: 'Hoy se envía el newsletter. Revisa el contenido antes de las 12:00 p.m.',
      requiresDashboardAttention: true,
    };
  }

  if (isTuesdayAfterNoon) {
    return {
      ...base,
      editorialReminderLevel: 'warning',
      message: 'Faltan 24 h para el envío. Marca el newsletter como listo.',
      requiresDashboardAttention: true,
    };
  }

  if (isMondayAfterNoon) {
    return {
      ...base,
      editorialReminderLevel: 'soft',
      message: 'Preparar newsletter semanal. Faltan 48 h para el envío sugerido.',
      requiresDashboardAttention: true,
    };
  }

  return base;
}

export function isNewsletterEditorialAlertDue(newsletterAdmin = {}, issueId = '', now = new Date()) {
  return getNewsletterEditorialReminder(newsletterAdmin, issueId, now).requiresDashboardAttention;
}
