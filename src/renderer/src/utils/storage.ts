import type Recording from "../types/Recording";
import type RecordingBatch from "../types/RecordingBatch";
import type Patient from "../types/Patient";
import type HeartLocation from "../types/HeartLocation";
import type Label from "../types/Label";

// Database configuration
const DB_NAME = "SonorusDB";
const DB_VERSION = 1;

// Object store names
const STORES = {
  RECORDINGS: "recordings",
  RECORDING_BATCHES: "recordingBatches",
  PATIENTS: "patients",
  SETTINGS: "settings",
} as const;

// Extended recording interface for display purposes
export interface ExtendedRecording extends Recording {
  patientName: string;
  date: string;
  time: string;
  duration: string;
  result: Label;
  status: "completed" | "flagged" | "processing";
  notes?: string;
}

// IndexedDB wrapper class
class SonorusDB {
  private db: IDBDatabase | null = null;
  private nextId = 1;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        this.loadNextId().then(() => resolve());
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains(STORES.RECORDINGS)) {
          const recordingStore = db.createObjectStore(STORES.RECORDINGS, {
            keyPath: "id",
          });
          recordingStore.createIndex(
            "recording_batch_id",
            "recording_batch_id",
          );
          recordingStore.createIndex("location", "location");
          recordingStore.createIndex("start_time", "start_time");
        }

        if (!db.objectStoreNames.contains(STORES.RECORDING_BATCHES)) {
          const batchStore = db.createObjectStore(STORES.RECORDING_BATCHES, {
            keyPath: "id",
          });
          batchStore.createIndex("patient_id", "patient.id");
          batchStore.createIndex("start_time", "start_time");
        }

        if (!db.objectStoreNames.contains(STORES.PATIENTS)) {
          const patientStore = db.createObjectStore(STORES.PATIENTS, {
            keyPath: "id",
          });
          patientStore.createIndex("name", "name");
          patientStore.createIndex("patient_uid", "patient_uid");
        }

        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          db.createObjectStore(STORES.SETTINGS, { keyPath: "key" });
        }
      };
    });
  }

  private async loadNextId(): Promise<void> {
    try {
      const setting = await this.getSetting("nextId");
      this.nextId = setting?.value || 1;
    } catch (error) {
      console.warn("Failed to load nextId, starting from 1:", error);
      this.nextId = 1;
    }
  }

  private async saveNextId(): Promise<void> {
    await this.setSetting("nextId", this.nextId);
  }

  getNextId(): number {
    const id = this.nextId;
    this.nextId++;
    this.saveNextId();
    return id;
  }

  private getStore(
    storeName: string,
    mode: IDBTransactionMode = "readonly",
  ): IDBObjectStore {
    if (!this.db) throw new Error("Database not initialized");
    const transaction = this.db.transaction([storeName], mode);
    return transaction.objectStore(storeName);
  }

  // Generic CRUD operations
  async get<T>(storeName: string, id: number): Promise<T | null> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async add<T extends { id?: number }>(
    storeName: string,
    data: Omit<T, "id">,
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName, "readwrite");
      const dataWithId = { ...data, id: this.getNextId() } as T;
      const request = store.add(dataWithId);

      request.onsuccess = () => resolve(dataWithId);
      request.onerror = () => reject(request.error);
    });
  }

  async update<T>(storeName: string, data: T): Promise<T> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName, "readwrite");
      const request = store.put(data);

      request.onsuccess = () => resolve(data);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName: string, id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName, "readwrite");
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Settings operations
  async getSetting(key: string): Promise<{ key: string; value: any } | null> {
    return this.get(STORES.SETTINGS, key as any);
  }

  async setSetting(key: string, value: any): Promise<void> {
    const store = this.getStore(STORES.SETTINGS, "readwrite");
    return new Promise((resolve, reject) => {
      const request = store.put({ key, value });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// Singleton instance
const db = new SonorusDB();

// Initialize database
let dbInitPromise: Promise<void> | null = null;

const initDB = async (): Promise<void> => {
  if (!dbInitPromise) {
    dbInitPromise = (async () => {
      await db.init();

      // Check and seed Trevin Wadu in the background (non-blocking)
      // This ensures Trevin Wadu always exists for demo purposes
      setTimeout(async () => {
        try {
          const { checkAndSeedTrevinWadu } = await import("./mockData");
          const seeded = await checkAndSeedTrevinWadu();
          if (seeded) {
            console.log(
              "🎉 Trevin Wadu seeded successfully during database initialization",
            );
          } else {
            console.log("✅ Trevin Wadu already exists in database");
          }
        } catch (error) {
          console.warn(
            "⚠️ Failed to check/seed Trevin Wadu in background:",
            error,
          );
          // Don't throw - just continue without mock data
        }
      }, 500); // Slightly longer delay to ensure database is fully initialized
    })();
  }
  return dbInitPromise;
};

// Patient management
export const savePatient = async (
  patient: Omit<Patient, "id">,
): Promise<Patient> => {
  await initDB();
  return db.add(STORES.PATIENTS, patient);
};

export const getPatients = async (): Promise<Patient[]> => {
  await initDB();
  return db.getAll<Patient>(STORES.PATIENTS);
};

export const getPatientById = async (id: number): Promise<Patient | null> => {
  await initDB();
  return db.get<Patient>(STORES.PATIENTS, id);
};

export const updatePatient = async (patient: Patient): Promise<Patient> => {
  await initDB();
  return db.update(STORES.PATIENTS, patient);
};

export const deletePatient = async (id: number): Promise<void> => {
  await initDB();
  return db.delete(STORES.PATIENTS, id);
};

// Recording Batch management
export const saveRecordingBatch = async (
  batch: Omit<RecordingBatch, "id">,
): Promise<RecordingBatch> => {
  await initDB();
  return db.add(STORES.RECORDING_BATCHES, batch);
};

export const getRecordingBatches = async (): Promise<RecordingBatch[]> => {
  await initDB();
  return db.getAll<RecordingBatch>(STORES.RECORDING_BATCHES);
};

export const getRecordingBatchById = async (
  id: number,
): Promise<RecordingBatch | null> => {
  await initDB();
  return db.get<RecordingBatch>(STORES.RECORDING_BATCHES, id);
};

export const updateRecordingBatch = async (
  batch: RecordingBatch,
): Promise<RecordingBatch> => {
  await initDB();
  return db.update(STORES.RECORDING_BATCHES, batch);
};

export const deleteRecordingBatch = async (batchId: number): Promise<void> => {
  await initDB();

  // First delete all recordings associated with this batch
  const recordings = await getRecordings();
  const batchRecordings = recordings.filter(
    (recording) => recording.recording_batch_id === batchId,
  );

  for (const recording of batchRecordings) {
    await deleteRecording(recording.id);
  }

  // Then delete the batch itself
  return db.delete(STORES.RECORDING_BATCHES, batchId);
};

// Recording management
export const saveRecording = async (
  recording: Omit<Recording, "id">,
): Promise<Recording> => {
  await initDB();
  return db.add(STORES.RECORDINGS, recording);
};

export const getRecordings = async (): Promise<Recording[]> => {
  await initDB();
  return db.getAll<Recording>(STORES.RECORDINGS);
};

export const getExtendedRecordings = async (): Promise<ExtendedRecording[]> => {
  const [recordings, patients, batches] = await Promise.all([
    getRecordings(),
    getPatients(),
    getRecordingBatches(),
  ]);

  return recordings.map((recording) => {
    const batch = batches.find((b) => b.id === recording.recording_batch_id);
    const patient = batch?.patient || { id: 0, name: "Unknown Patient" };
    const date = new Date(recording.start_time);

    // Calculate duration - recordings are typically 30 seconds
    const duration = "30s"; // Default for heart recordings

    return {
      ...recording,
      patientName: patient.name,
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString(),
      duration,
      result: "Normal" as Label, // Default - would be determined by analysis
      status: "completed" as const,
      notes: "",
    };
  });
};

export const getRecordingById = async (
  id: number,
): Promise<Recording | null> => {
  await initDB();
  return db.get<Recording>(STORES.RECORDINGS, id);
};

export const updateRecording = async (
  recording: Recording,
): Promise<Recording> => {
  await initDB();
  return db.update(STORES.RECORDINGS, recording);
};

export const deleteRecording = async (id: number): Promise<void> => {
  await initDB();
  return db.delete(STORES.RECORDINGS, id);
};

// Utility functions for grouping and filtering

// Group recording batches by patient
export const getGroupedRecordingBatches = async (): Promise<
  Record<number, RecordingBatch[]>
> => {
  const batches = await getRecordingBatches();
  const groupedBatches: Record<number, RecordingBatch[]> = {};

  batches.forEach((batch) => {
    const patientId = batch.patient.id;
    if (!groupedBatches[patientId]) {
      groupedBatches[patientId] = [];
    }
    groupedBatches[patientId].push(batch);
  });

  // Sort batches by start_time (newest first) within each patient group
  Object.keys(groupedBatches).forEach((patientId) => {
    groupedBatches[parseInt(patientId)].sort(
      (a, b) =>
        new Date(b.start_time).getTime() - new Date(a.start_time).getTime(),
    );
  });

  return groupedBatches;
};

// Get recording batches for a specific patient
export const getRecordingBatchesByPatient = async (
  patientId: number,
): Promise<RecordingBatch[]> => {
  const batches = await getRecordingBatches();
  return batches
    .filter((batch) => batch.patient.id === patientId)
    .sort(
      (a, b) =>
        new Date(b.start_time).getTime() - new Date(a.start_time).getTime(),
    );
};

// Get extended recordings grouped by patient and batch
export const getGroupedExtendedRecordings = async (): Promise<
  Record<number, Record<number, ExtendedRecording[]>>
> => {
  const [recordings, patients, batches] = await Promise.all([
    getRecordings(),
    getPatients(),
    getRecordingBatches(),
  ]);

  console.log(`Loaded ${recordings.length} recordings from database`);

  // Debug: Check if any recordings have audio data
  const recordingsWithAudio = recordings.filter(
    (r) => r.audio && r.audio instanceof Blob && r.audio.size > 0,
  );
  console.log(`${recordingsWithAudio.length} recordings have valid audio data`);

  if (recordings.length > 0 && recordingsWithAudio.length === 0) {
    console.warn(
      "No recordings found with valid audio data! This may indicate a storage issue.",
    );
  }

  const groupedRecordings: Record<
    number,
    Record<number, ExtendedRecording[]>
  > = {};

  recordings.forEach((recording) => {
    const batch = batches.find((b) => b.id === recording.recording_batch_id);
    const patient = batch?.patient || { id: 0, name: "Unknown Patient" };
    const date = new Date(recording.start_time);

    // Calculate duration - recordings are typically 30 seconds but show actual if available
    const duration = "30s"; // Default for heart recordings

    // Debug logging for each recording
    console.log(`Processing recording ${recording.id}:`, {
      hasAudio: !!recording.audio,
      audioType: recording.audio?.constructor?.name,
      audioSize: recording.audio?.size,
      location: recording.location,
    });

    const extendedRecording: ExtendedRecording = {
      ...recording,
      patientName: patient.name,
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString(),
      duration,
      result: "Normal" as Label,
      status: "completed" as const,
      notes: "",
    };

    const patientId = patient.id;
    const batchId = batch?.id || 0;

    if (!groupedRecordings[patientId]) {
      groupedRecordings[patientId] = {};
    }
    if (!groupedRecordings[patientId][batchId]) {
      groupedRecordings[patientId][batchId] = [];
    }

    groupedRecordings[patientId][batchId].push(extendedRecording);
  });

  return groupedRecordings;
};

export const getRecordingsByPatient = async (
  patientId: number,
): Promise<Recording[]> => {
  const [recordings, batches] = await Promise.all([
    getRecordings(),
    getRecordingBatches(),
  ]);

  const patientBatches = batches.filter(
    (batch) => batch.patient.id === patientId,
  );
  const batchIds = patientBatches.map((batch) => batch.id);

  return recordings.filter((recording) =>
    batchIds.includes(recording.recording_batch_id),
  );
};

export const getRecordingsByLocation = async (
  location: HeartLocation,
): Promise<Recording[]> => {
  const recordings = await getRecordings();
  return recordings.filter((recording) => recording.location === location);
};

export const getRecordingsByDateRange = async (
  startDate: Date,
  endDate: Date,
): Promise<Recording[]> => {
  const recordings = await getRecordings();
  return recordings.filter((recording) => {
    const recordingDate = new Date(recording.start_time);
    return recordingDate >= startDate && recordingDate <= endDate;
  });
};

// Storage cleanup and maintenance
export const clearAllData = async (): Promise<void> => {
  await initDB();

  const stores = Object.values(STORES);
  for (const storeName of stores) {
    const store = db["getStore"](storeName, "readwrite");
    await new Promise<void>((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
};

export const exportData = async (): Promise<string> => {
  const [recordings, batches, patients] = await Promise.all([
    getRecordings(),
    getRecordingBatches(),
    getPatients(),
  ]);

  const data = {
    recordings: recordings.map((r) => ({ ...r, audio: null })), // Exclude audio blobs from export
    recordingBatches: batches,
    patients: patients,
    timestamp: new Date().toISOString(),
  };

  return JSON.stringify(data, null, 2);
};

export const importData = async (jsonData: string): Promise<void> => {
  await initDB();

  const data = JSON.parse(jsonData);

  // Clear existing data
  await clearAllData();

  // Import new data
  if (data.patients) {
    for (const patient of data.patients) {
      await db.add(STORES.PATIENTS, patient);
    }
  }

  if (data.recordingBatches) {
    for (const batch of data.recordingBatches) {
      await db.add(STORES.RECORDING_BATCHES, batch);
    }
  }

  if (data.recordings) {
    for (const recording of data.recordings) {
      // Create empty blob for imported recordings without audio
      const recordingWithBlob = {
        ...recording,
        audio: new Blob([], { type: "audio/wav" }),
      };
      await db.add(STORES.RECORDINGS, recordingWithBlob);
    }
  }
};

// Initialize database immediately when module loads
initDB().catch(console.error);

// Re-export mock data functions for external use
export {
  seedMockDataIfEmpty,
  forceSeedMockData,
  checkAndSeedTrevinWadu,
} from "./mockData";
