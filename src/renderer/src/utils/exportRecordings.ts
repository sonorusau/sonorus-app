import dayjs from "dayjs";
import {
  getPatients,
  getRecordingBatches,
  getRecordings,
} from "./storage";
import type RecordingBatch from "../types/RecordingBatch";
import type Recording from "../types/Recording";
import type HeartLocationType from "../types/HeartLocation";
import type { RecordingExportBatchPayload } from "@shared/recordings/types";

const INVALID_PATH_CHARS = /[\\/:*?"<>|]/g;

const sanitizeSegment = (value: string, fallback: string): string => {
  const trimmed = value.trim();
  const cleaned = trimmed.replace(INVALID_PATH_CHARS, "-");
  return cleaned.length > 0 ? cleaned : fallback;
};

const formatDate = (iso: string): string => {
  const parsed = dayjs(iso);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD");
};

const formatTime = (iso: string): string => {
  const parsed = dayjs(iso);
  return parsed.isValid() ? parsed.format("HH-mm-ss") : dayjs().format("HH-mm-ss");
};

const locationLabels: Record<HeartLocationType, string> = {
  aortic: "aortic",
  pulmonary: "pulmonary",
  tricuspid: "tricuspid",
  mitral: "mitral",
};

const getAudioContext = (() => {
  let context: AudioContext | null = null;
  return (): AudioContext | null => {
    if (typeof window === "undefined") {
      return null;
    }
    if (!context) {
      const AudioContextClass =
        window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) {
        return null;
      }
      context = new AudioContextClass();
    }
    return context;
  };
})();

const decodeToAudioBuffer = async (
  arrayBuffer: ArrayBuffer,
): Promise<AudioBuffer> => {
  const context = getAudioContext();
  if (!context) {
    throw new Error("Web Audio API not supported in this environment.");
  }
  if (context.state === "suspended") {
    await context.resume();
  }
  return new Promise((resolve, reject) => {
    context.decodeAudioData(
      arrayBuffer.slice(0),
      (buffer) => resolve(buffer),
      (error) => reject(error instanceof Error ? error : new Error("Failed to decode audio data.")),
    );
  });
};

const encodeAudioBufferToWav = (audioBuffer: AudioBuffer): ArrayBuffer => {
  const { numberOfChannels, sampleRate, length } = audioBuffer;
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numberOfChannels * bytesPerSample;
  const dataSize = length * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  let offset = 0;

  const writeString = (str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
    offset += str.length;
  };

  const writeUint32 = (value: number) => {
    view.setUint32(offset, value, true);
    offset += 4;
  };

  const writeUint16 = (value: number) => {
    view.setUint16(offset, value, true);
    offset += 2;
  };

  writeString("RIFF");
  writeUint32(36 + dataSize);
  writeString("WAVE");
  writeString("fmt ");
  writeUint32(16);
  writeUint16(1); // PCM
  writeUint16(numberOfChannels);
  writeUint32(sampleRate);
  writeUint32(sampleRate * blockAlign);
  writeUint16(blockAlign);
  writeUint16(bitDepth);
  writeString("data");
  writeUint32(dataSize);

  const channelData: Float32Array[] = [];
  for (let channel = 0; channel < numberOfChannels; channel++) {
    channelData[channel] = audioBuffer.getChannelData(channel);
  }

  let dataOffset = 44;
  for (let sampleIndex = 0; sampleIndex < length; sampleIndex++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = channelData[channel][sampleIndex];
      const clamped = Math.max(-1, Math.min(1, sample));
      const intSample =
        clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
      view.setInt16(
        dataOffset,
        intSample,
        true,
      );
      dataOffset += 2;
    }
  }

  return buffer;
};

const convertBlobToWav = async (blob: Blob): Promise<ArrayBuffer> => {
  const arrayBuffer = await blob.arrayBuffer();
  const audioBuffer = await decodeToAudioBuffer(arrayBuffer);
  return encodeAudioBufferToWav(audioBuffer);
};

const sortBatchesByStart = (batches: RecordingBatch[]): RecordingBatch[] => {
  return [...batches].sort(
    (a, b) =>
      dayjs(a.start_time).valueOf() - dayjs(b.start_time).valueOf(),
  );
};

const sortRecordingsByStart = (recordings: Recording[]): Recording[] => {
  return [...recordings].sort(
    (a, b) =>
      dayjs(a.start_time).valueOf() - dayjs(b.start_time).valueOf(),
  );
};

/**
 * Collects recordings from IndexedDB and normalises them into a filesystem-friendly structure.
 * The returned payload mirrors the export specification so the main process can persist the files.
 */
export const buildRecordingExportPayloads = async (): Promise<
  RecordingExportBatchPayload[]
> => {
  const [patients, batches, recordings] = await Promise.all([
    getPatients(),
    getRecordingBatches(),
    getRecordings(),
  ]);

  const batchesByPatient = new Map<number, RecordingBatch[]>();
  batches.forEach((batch) => {
    const patientId = batch.patient.id;
    const existing = batchesByPatient.get(patientId) ?? [];
    existing.push(batch);
    batchesByPatient.set(patientId, existing);
  });

  const recordingsByBatch = new Map<number, Recording[]>();
  recordings.forEach((recording) => {
    const existing = recordingsByBatch.get(recording.recording_batch_id) ?? [];
    existing.push(recording);
    recordingsByBatch.set(recording.recording_batch_id, existing);
  });

  const payloads: RecordingExportBatchPayload[] = [];

  for (const patient of patients) {
    const patientBatches = batchesByPatient.get(patient.id);
    if (!patientBatches?.length) {
      continue;
    }

    const patientDir = sanitizeSegment(
      patient.name || `patient-${patient.id}`,
      `patient-${patient.id}`,
    );

    const orderedBatches = sortBatchesByStart(patientBatches);

    for (let index = 0; index < orderedBatches.length; index++) {
      const batch = orderedBatches[index];
      const batchDate = formatDate(batch.start_time);
      const batchTime = formatTime(batch.start_time);
      const sessionDir = `${batchDate}_${batchTime}_session-${index + 1}`;

      const batchRecordings = recordingsByBatch.get(batch.id);
      if (!batchRecordings?.length) {
        continue;
      }

      const orderedRecordings = sortRecordingsByStart(batchRecordings);
      const files: RecordingExportBatchPayload["files"] = [];

      for (const recording of orderedRecordings) {
        if (!(recording.audio instanceof Blob)) {
          console.warn(
            "Skipping recording without audio blob during export",
            recording.id,
          );
          continue;
        }

        const recordingDate = formatDate(recording.start_time || batch.start_time);
        const recordingTime = formatTime(recording.start_time || batch.start_time);
        const valveLabel =
          locationLabels[recording.location as HeartLocationType] ??
          sanitizeSegment(String(recording.location), "unknown");
        const fileName = `${recordingDate}_${recordingTime}_${valveLabel}.wav`;
        const arrayBuffer = await convertBlobToWav(recording.audio);

        files.push({
          fileName,
          mimeType: "audio/wav",
          arrayBuffer,
        });
      }

      if (files.length > 0) {
        payloads.push({
          patientDir,
          sessionDir,
          files,
        });
      }
    }
  }

  return payloads;
};
