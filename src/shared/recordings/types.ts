export interface RecordingExportFilePayload {
  fileName: string;
  mimeType: string;
  arrayBuffer: ArrayBuffer;
}

export interface RecordingExportBatchPayload {
  patientDir: string;
  sessionDir: string;
  files: RecordingExportFilePayload[];
}

export interface RecordingExportResult {
  success: boolean;
  canceled?: boolean;
  writtenFiles?: number;
  error?: string;
}
