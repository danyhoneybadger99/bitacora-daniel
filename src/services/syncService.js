import { defaultState } from '../data/defaultState';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const SYNC_SCHEMA_VERSION = 1;
export const SYNC_TABLE = 'diary_snapshots';
const isDevSyncLogEnabled = typeof import.meta !== 'undefined' ? Boolean(import.meta.env?.DEV) : false;

export const syncStatusLabels = {
  local: 'Local',
  synced: 'Sincronizado',
  pending: 'Pendiente de sincronizar',
  syncing: 'Sincronizando',
  offline: 'Sin conexion',
  error: 'Error de sincronizacion',
  auth: 'Conecta una cuenta',
};

export function logSyncDebug(event, details = {}) {
  if (!isDevSyncLogEnabled) return;
  console.log(`[Bitacora Daniel][sync] ${event}`, details);
}

export function createDeviceId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `device-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

export function ensureSyncMeta(data = {}, fallbackDeviceId = '') {
  const currentMeta = data?.syncMeta || {};

  return {
    ...data,
    syncMeta: {
      updatedAt: currentMeta.updatedAt || '',
      lastSyncedAt: currentMeta.lastSyncedAt || '',
      deviceId: currentMeta.deviceId || fallbackDeviceId || createDeviceId(),
      schemaVersion: Number(currentMeta.schemaVersion) || SYNC_SCHEMA_VERSION,
    },
  };
}

export function markDataUpdated(data, { updatedAt, deviceId }) {
  const nextData = ensureSyncMeta(data, deviceId);

  return {
    ...nextData,
    syncMeta: {
      ...nextData.syncMeta,
      updatedAt,
      deviceId: deviceId || nextData.syncMeta.deviceId,
      schemaVersion: SYNC_SCHEMA_VERSION,
    },
  };
}

export function markDataSynced(data, { lastSyncedAt, deviceId }) {
  const nextData = ensureSyncMeta(data, deviceId);

  return {
    ...nextData,
    syncMeta: {
      ...nextData.syncMeta,
      lastSyncedAt,
      deviceId: deviceId || nextData.syncMeta.deviceId,
      schemaVersion: SYNC_SCHEMA_VERSION,
    },
  };
}

export function sanitizeDataForRemote(data) {
  const nextData = ensureSyncMeta(data);
  const { privateVault, ...rest } = nextData;

  // Keep device-local lock data out of Supabase in phase 1.
  return {
    ...rest,
    syncMeta: {
      ...nextData.syncMeta,
      schemaVersion: SYNC_SCHEMA_VERSION,
    },
  };
}

export function mergeRemoteSnapshot({ remoteData, localData, deviceId, lastSyncedAt = '' }) {
  const nextRemote = ensureSyncMeta(remoteData, deviceId);

  return {
    ...nextRemote,
    privateVault: localData?.privateVault || defaultState.privateVault,
    syncMeta: {
      ...nextRemote.syncMeta,
      deviceId: deviceId || localData?.syncMeta?.deviceId || nextRemote.syncMeta.deviceId,
      lastSyncedAt: lastSyncedAt || nextRemote.syncMeta.lastSyncedAt || '',
      schemaVersion: SYNC_SCHEMA_VERSION,
    },
  };
}

function getSyncComparableValue(data) {
  const value = data?.syncMeta?.updatedAt || '';
  return value ? new Date(value).getTime() : 0;
}

export function getSnapshotSummary(data = {}) {
  return {
    updatedAt: data?.syncMeta?.updatedAt || '',
    lastSyncedAt: data?.syncMeta?.lastSyncedAt || '',
    deviceId: data?.syncMeta?.deviceId || '',
    foods: Array.isArray(data?.foods) ? data.foods.length : 0,
    dailyCheckIns: Array.isArray(data?.dailyCheckIns) ? data.dailyCheckIns.length : 0,
    supplements: Array.isArray(data?.supplements) ? data.supplements.length : 0,
    fastingLogs: Array.isArray(data?.fastingLogs) ? data.fastingLogs.length : 0,
    exercises: Array.isArray(data?.exercises) ? data.exercises.length : 0,
    bodyMetrics: Array.isArray(data?.bodyMetrics) ? data.bodyMetrics.length : 0,
    privateEntries: Array.isArray(data?.privateHormonalEntries) ? data.privateHormonalEntries.length : 0,
    objectives: Array.isArray(data?.objectives) ? data.objectives.length : 0,
  };
}

export function compareSnapshotRecency(localData, remoteData) {
  const localValue = getSyncComparableValue(localData);
  const remoteValue = getSyncComparableValue(remoteData);

  // Phase 1 conflict strategy: last write wins based on updatedAt.
  if (remoteValue > localValue) return 'remote';
  if (localValue > remoteValue) return 'local';
  return 'equal';
}

function getComparableSnapshot(data = {}) {
  const sanitized = sanitizeDataForRemote(data);

  return {
    ...sanitized,
    backupMeta: {
      lastExportAt: '',
      lastImportAt: '',
    },
    syncMeta: {
      updatedAt: '',
      lastSyncedAt: '',
      deviceId: '',
      schemaVersion: sanitized.syncMeta?.schemaVersion || SYNC_SCHEMA_VERSION,
    },
  };
}

export function isEffectivelyDefaultSnapshot(data = {}) {
  return JSON.stringify(getComparableSnapshot(data)) === JSON.stringify(getComparableSnapshot(defaultState));
}

export function chooseSnapshotWinner(localData, remoteData) {
  const localIsDefault = isEffectivelyDefaultSnapshot(localData);
  const remoteIsDefault = isEffectivelyDefaultSnapshot(remoteData);

  if (localIsDefault && !remoteIsDefault) return 'remote';
  if (remoteIsDefault && !localIsDefault) return 'local';

  return compareSnapshotRecency(localData, remoteData);
}

export function explainSnapshotWinner(localData, remoteData) {
  const localIsDefault = isEffectivelyDefaultSnapshot(localData);
  const remoteIsDefault = isEffectivelyDefaultSnapshot(remoteData);
  const localValue = getSyncComparableValue(localData);
  const remoteValue = getSyncComparableValue(remoteData);
  const winner = chooseSnapshotWinner(localData, remoteData);

  if (localIsDefault && !remoteIsDefault) {
    return { winner, reason: 'local-default-vs-remote-with-data', localValue, remoteValue };
  }

  if (remoteIsDefault && !localIsDefault) {
    return { winner, reason: 'remote-default-vs-local-with-data', localValue, remoteValue };
  }

  if (remoteValue > localValue) {
    return { winner, reason: 'remote-updatedAt-newer', localValue, remoteValue };
  }

  if (localValue > remoteValue) {
    return { winner, reason: 'local-updatedAt-newer', localValue, remoteValue };
  }

  return { winner, reason: 'timestamps-equal', localValue, remoteValue };
}

export async function getSupabaseSession() {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session || null;
}

export function onSupabaseAuthChange(callback) {
  if (!isSupabaseConfigured || !supabase) {
    return { unsubscribe() {} };
  }

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session || null);
  });

  return data.subscription;
}

export const supabasePasswordMinLength = 6;

export function validateSupabaseEmail(email) {
  const normalizedEmail = String(email || '').trim();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!normalizedEmail) return 'Escribe un correo para continuar.';
  if (!emailPattern.test(normalizedEmail)) return 'Escribe un correo valido.';

  return '';
}

export function validateSupabaseCredentials({ email, password }) {
  const normalizedEmail = String(email || '').trim();
  const normalizedPassword = String(password || '');
  const emailValidationMessage = validateSupabaseEmail(normalizedEmail);

  if (emailValidationMessage) return emailValidationMessage;
  if (!normalizedPassword) return 'Escribe tu contrasena.';
  if (normalizedPassword.length < supabasePasswordMinLength) {
    return `La contrasena debe tener minimo ${supabasePasswordMinLength} caracteres.`;
  }

  return '';
}

export function isSupabaseEmailNotConfirmedError(error) {
  const rawMessage = error instanceof Error ? error.message : String(error || '');
  const message = rawMessage.toLowerCase();
  const code = String(error?.code || '').toLowerCase();
  return message.includes('email not confirmed') || code.includes('email_not_confirmed');
}

export function getSupabaseAuthErrorMessage(error, action = 'sign-in') {
  const rawMessage = error instanceof Error ? error.message : String(error || '');
  const message = rawMessage.toLowerCase();
  const code = String(error?.code || '').toLowerCase();
  const status = Number(error?.status || 0);

  if (isSupabaseEmailNotConfirmedError(error)) {
    return 'Tu cuenta existe, pero falta confirmar el correo.';
  }

  if (message.includes('invalid login credentials') || code.includes('invalid_credentials')) {
    return 'Correo o contrasena incorrectos. Si acabas de crear la cuenta, revisa primero si falta confirmar el correo.';
  }

  if (message.includes('already registered') || message.includes('user already exists') || code.includes('user_already_exists')) {
    return 'Ese correo ya tiene cuenta. Usa "Entrar y sincronizar" o recupera el acceso desde Supabase si olvidaste la contrasena.';
  }

  if (message.includes('password') && (message.includes('6') || message.includes('weak') || code.includes('weak_password'))) {
    return `La contrasena debe tener minimo ${supabasePasswordMinLength} caracteres.`;
  }

  if (message.includes('signup') && (message.includes('disabled') || message.includes('not allowed'))) {
    return 'El registro de nuevas cuentas esta desactivado en Supabase. Activalo temporalmente para crear usuarios nuevos.';
  }

  if (status === 429 || message.includes('rate limit') || message.includes('too many')) {
    return 'Supabase limito los intentos por seguridad. Espera unos minutos y vuelve a intentar.';
  }

  if (message.includes('failed to fetch') || message.includes('network') || message.includes('fetch')) {
    return 'No se pudo conectar con Supabase. Revisa internet o la configuracion del proyecto.';
  }

  return action === 'sign-up'
    ? rawMessage || 'No se pudo crear la cuenta.'
    : rawMessage || 'No se pudo iniciar sesion.';
}

export async function signInWithSupabasePassword({ email, password }) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase no esta configurado.');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: String(email || '').trim(),
    password,
  });
  if (error) throw error;
  return data.session || null;
}

export async function signUpWithSupabasePassword({ email, password }) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase no esta configurado.');
  }

  const { data, error } = await supabase.auth.signUp({
    email: String(email || '').trim(),
    password,
  });
  if (error) throw error;
  return data;
}

export async function resendSupabaseSignupConfirmation({ email }) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase no esta configurado.');
  }

  const normalizedEmail = String(email || '').trim();
  const validationMessage = validateSupabaseEmail(normalizedEmail);
  if (validationMessage) throw new Error(validationMessage);

  const { data, error } = await supabase.auth.resend({
    type: 'signup',
    email: normalizedEmail,
  });
  if (error) throw error;
  return data;
}

export async function signOutFromSupabase() {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function fetchRemoteSnapshot(userId) {
  if (!isSupabaseConfigured || !supabase || !userId) return null;

  logSyncDebug('pull:start', { userId, table: SYNC_TABLE });

  const { data, error } = await supabase
    .from(SYNC_TABLE)
    .select('payload, updated_at, last_synced_at, user_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const payload = data.payload || {};
  logSyncDebug('pull:success', {
    userId,
    updatedAt: data.updated_at || '',
    lastSyncedAt: data.last_synced_at || '',
    summary: getSnapshotSummary(payload),
  });

  return {
    ...data,
    payload: {
      ...payload,
      syncMeta: {
        ...(payload.syncMeta || {}),
        updatedAt: data.updated_at || payload.syncMeta?.updatedAt || '',
        lastSyncedAt: data.last_synced_at || payload.syncMeta?.lastSyncedAt || '',
        schemaVersion: payload.syncMeta?.schemaVersion || SYNC_SCHEMA_VERSION,
        deviceId: payload.syncMeta?.deviceId || '',
      },
    },
  };
}

export async function pushRemoteSnapshot({ userId, data }) {
  if (!isSupabaseConfigured || !supabase || !userId) {
    throw new Error('No hay una sesion valida para sincronizar.');
  }

  const payload = sanitizeDataForRemote(data);
  const timestamp = payload.syncMeta.updatedAt || new Date().toISOString();
  const lastSyncedAt = new Date().toISOString();
  logSyncDebug('push:start', {
    userId,
    updatedAt: timestamp,
    summary: getSnapshotSummary(payload),
  });

  const row = {
    user_id: userId,
    payload,
    updated_at: timestamp,
    last_synced_at: lastSyncedAt,
  };

  const { data: response, error } = await supabase
    .from(SYNC_TABLE)
    .upsert(row, { onConflict: 'user_id' })
    .select('updated_at, last_synced_at')
    .single();

  if (error) throw error;
  logSyncDebug('push:success', {
    userId,
    updatedAt: response?.updated_at || timestamp,
    lastSyncedAt: response?.last_synced_at || lastSyncedAt,
  });

  return {
    updatedAt: response?.updated_at || timestamp,
    lastSyncedAt: response?.last_synced_at || lastSyncedAt,
  };
}
