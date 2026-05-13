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
    subject: newsletter.subject || 'Newsletter Bitacora Daniel',
    preheader: newsletter.preheader || '',
    html: renderNewsletterHtml(newsletter),
    text: renderNewsletterText(newsletter),
  };
}

export function isNewsletterEditorialAlertDue(newsletterAdmin = {}, issueId = '', now = new Date()) {
  const normalized = normalizeNewsletterAdmin(newsletterAdmin);
  const selectedIssueStatus = normalized.currentIssueId === issueId ? normalized.status : 'draft';

  if (selectedIssueStatus === 'ready' || selectedIssueStatus === 'manually_sent') return false;

  const day = now.getDay();
  const hour = now.getHours();
  const isTuesdayAfterNoon = day === 2 && hour >= 12;
  const isWednesdayOrLater = day >= 3;

  return isTuesdayAfterNoon || isWednesdayOrLater;
}
