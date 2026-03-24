import { useState, useRef, useCallback, useEffect } from "react";

interface OfflineRecording {
  id: string;
  blob: Blob;
  appointmentId: number;
  timestamp: number;
}

const DB_NAME = "asyl_ai_offline";
const STORE_NAME = "recordings";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveRecording(recording: OfflineRecording) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  tx.objectStore(STORE_NAME).put(recording);
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getQueuedRecordings(): Promise<OfflineRecording[]> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function removeRecording(id: string) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  tx.objectStore(STORE_NAME).delete(id);
}

export function useOfflineRecording() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueCount, setQueueCount] = useState(0);
  const syncingRef = useRef(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Check queue count on mount
  useEffect(() => {
    getQueuedRecordings().then((r) => setQueueCount(r.length)).catch(() => {});
  }, []);

  const queueForUpload = useCallback(async (blob: Blob, appointmentId: number) => {
    const recording: OfflineRecording = {
      id: `${appointmentId}-${Date.now()}`,
      blob,
      appointmentId,
      timestamp: Date.now(),
    };
    await saveRecording(recording);
    setQueueCount((c) => c + 1);
  }, []);

  const syncQueue = useCallback(async (uploadFn: (appointmentId: number, blob: Blob) => Promise<any>) => {
    if (syncingRef.current || !navigator.onLine) return;
    syncingRef.current = true;
    try {
      const recordings = await getQueuedRecordings();
      for (const rec of recordings) {
        try {
          await uploadFn(rec.appointmentId, rec.blob);
          await removeRecording(rec.id);
          setQueueCount((c) => Math.max(0, c - 1));
        } catch {
          break; // Stop on first failure, retry later
        }
      }
    } finally {
      syncingRef.current = false;
    }
  }, []);

  return { isOnline, queueCount, queueForUpload, syncQueue };
}
