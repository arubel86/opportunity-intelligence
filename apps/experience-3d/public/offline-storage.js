import { openDB } from 'https://cdn.jsdelivr.net/npm/idb@8/+esm';

const DB_NAME = 'hermes_3d_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'pending_uploads';

export async function initOfflineStorage() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('by_project', 'projectId');
        store.createIndex('by_status', 'status');
      }
    },
  });
}

export async function savePhotoOffline(projectId, assetType, stage, blob, metadata = {}) {
  const db = await initOfflineStorage();
  const record = {
    projectId,
    assetType,
    stage,
    blob,
    metadata,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  return await db.add(STORE_NAME, record);
}

export async function getPendingPhotos(projectId = null) {
  const db = await initOfflineStorage();
  const all = await db.getAll(STORE_NAME);
  if (projectId) {
    return all.filter(item => item.projectId === projectId && item.status === 'pending');
  }
  return all.filter(item => item.status === 'pending');
}

export async function markPhotoSynced(id) {
  const db = await initOfflineStorage();
  return await db.delete(STORE_NAME, id);
}

export async function clearProjectPhotos(projectId) {
  const db = await initOfflineStorage();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  const index = store.index('by_project');
  let cursor = await index.openCursor(IDBKeyRange.only(projectId));
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.done;
}
