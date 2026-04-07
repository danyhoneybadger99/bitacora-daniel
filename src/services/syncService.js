import { defaultState } from '../data/defaultState';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const SYNC_SCHEMA_VERSION = 1;
export const SYNC_TABLE = 'diary_snapshots';

export const syncStatusLabels = {
  local: 'Local',
  synced: 'Sincronizado',
  pending: 'Pendiente de sincronizar',
  syncing: 'Sincronizando',
  offline: 'Sin conexion',
  error: 'Error de sincronizacion',
  auth: 'Conecta una cuenta',
};

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

export function compareSnapshotRecency(localData, remoteData) {
  const localValue = getSyncComparableValue(localData);
  const remoteValue = getSyncComparableValue(remoteData);

  if (remoteValue > localValue) return 'remote';
  if (localValue > remoteValue) return 'local';
  return 'equal';
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

  const { data, error } = await supabase
    .from(SYNC_TABLE)
    .select('data, updated_at, last_synced_at, schema_version, device_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    ...data,
    data: {
      ...(data.data || {}),
      syncMeta: {
        ...(data.data?.syncMeta || {}),
        updatedAt: data.updated_at || data.data?.syncMeta?.updatedAt || '',
        lastSyncedAt: data.last_synced_at || data.data?.syncMeta?.lastSyncedAt || '',
        schemaVersion: data.schema_version || data.data?.syncMeta?.schemaVersion || SYNC_SCHEMA_VERSION,
        deviceId: data.device_id || data.data?.syncMeta?.deviceId || '',
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

  const row = {
    user_id: userId,
    data: payload,
    updated_at: timestamp,
    last_synced_at: lastSyncedAt,
    schema_version: payload.syncMeta.schemaVersion || SYNC_SCHEMA_VERSION,
    device_id: payload.syncMeta.deviceId || '',
  };

  const { data: response, error } = await supabase
    .from(SYNC_TABLE)
    .upsert(row, { onConflict: 'user_id' })
    .select('updated_at, last_synced_at')
    .single();

  if (error) throw error;

  return {
    updatedAt: response?.updated_at || timestamp,
    lastSyncedAt: response?.last_synced_at || lastSyncedAt,
  };
}
