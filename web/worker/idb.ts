/** Tiny IndexedDB key/value store used to persist the local SQLite database file. */
const DB_NAME = "tyremate-web"
const STORE = "files"
export const LOCAL_DB_KEY = "local-database"

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function withStore<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open()
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode)
      const req = fn(tx.objectStore(STORE))
      tx.oncomplete = () => resolve(req.result)
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error ?? new Error("IndexedDB transaction aborted"))
    })
  } finally {
    db.close()
  }
}

export function idbGet(key: string): Promise<Uint8Array | undefined> {
  return withStore("readonly", (s) => s.get(key))
}

export function idbPut(key: string, value: Uint8Array): Promise<IDBValidKey> {
  return withStore("readwrite", (s) => s.put(value, key))
}

export function idbDelete(key: string): Promise<undefined> {
  return withStore("readwrite", (s) => s.delete(key))
}
