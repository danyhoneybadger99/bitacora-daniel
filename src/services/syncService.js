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

export async function signInWithSupabasePassword({ email, password }) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase no esta configurado.');
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session || null;
}

export async function signUpWithSupabasePassword({ email, password }) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase no esta configurado.');
  }

  const { data, error } = await supabase.auth.signUp({ email, password });
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
