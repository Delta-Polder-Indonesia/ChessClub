const DATABASE = "kci-papan-repertoar";
const STORE = "kartu";
const VERSION = 1;
const FALLBACK_KEY = "kci.papan.repertoar.v1";
let janjiDatabase;
let kartuMemori = [];

function bukaDatabase() {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  if (janjiDatabase) return janjiDatabase;

  janjiDatabase = new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("lineId", "lineId", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("IndexedDB gagal dibuka"));
    request.onblocked = () => reject(new Error("IndexedDB sedang diblokir tab lain"));
  }).catch((error) => {
    janjiDatabase = null;
    throw error;
  });
  return janjiDatabase;
}

function bacaFallback() {
  try {
    const raw = globalThis.localStorage?.getItem(FALLBACK_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) kartuMemori = parsed;
    }
  } catch {
    // Data latihan tetap dapat dipakai selama sesi bila storage browser dibatasi.
  }
  return kartuMemori;
}

function tulisFallback(daftar) {
  kartuMemori = daftar;
  try {
    globalThis.localStorage?.setItem(FALLBACK_KEY, JSON.stringify(daftar));
  } catch {
    // Fallback memori berlaku untuk sesi ini saja.
  }
}

function hasilRequest(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Permintaan IndexedDB gagal"));
  });
}

export async function bacaKartuRepertoar() {
  try {
    const db = await bukaDatabase();
    if (!db) return bacaFallback();
    const transaction = db.transaction(STORE, "readonly");
    return await hasilRequest(transaction.objectStore(STORE).getAll());
  } catch {
    return bacaFallback();
  }
}

export async function simpanKartuRepertoar(daftarBaru) {
  try {
    const db = await bukaDatabase();
    if (!db) throw new Error("IndexedDB tidak tersedia");
    await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE, "readwrite");
      const store = transaction.objectStore(STORE);
      for (const kartu of daftarBaru) store.put(kartu);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error || new Error("Gagal menyimpan kartu"));
      transaction.onabort = () => reject(transaction.error || new Error("Penyimpanan dibatalkan"));
    });
    return true;
  } catch {
    const semua = bacaFallback();
    const hasil = new Map(semua.map((kartu) => [kartu.id, kartu]));
    for (const kartu of daftarBaru) hasil.set(kartu.id, kartu);
    tulisFallback([...hasil.values()]);
    return false;
  }
}

export async function hapusJalurRepertoar(lineId) {
  try {
    const db = await bukaDatabase();
    if (!db) throw new Error("IndexedDB tidak tersedia");
    await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE, "readwrite");
      const store = transaction.objectStore(STORE);
      const request = store.index("lineId").openCursor(IDBKeyRange.only(lineId));
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error || new Error("Gagal menghapus repertoar"));
      transaction.onabort = () => reject(transaction.error || new Error("Penghapusan dibatalkan"));
    });
    return true;
  } catch {
    tulisFallback(bacaFallback().filter((kartu) => kartu.lineId !== lineId));
    return false;
  }
}
