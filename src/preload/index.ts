import { contextBridge, ipcRenderer } from "electron";
import { electronAPI } from "@electron-toolkit/preload";
import { Repo } from "@shared/repo/data";
import { IAPI } from "@shared/api";
import { CommitFile } from "@shared/commit/data";
import type {
  RecordingExportBatchPayload,
  RecordingExportResult,
} from "@shared/recordings/types";

// Custom APIs for renderer
const { invoke } = ipcRenderer;

const api: IAPI = {
  loadReposFromTxt: async (): Promise<Repo[]> => {
    return invoke("system/loadReposFromTxt");
  },
  selectFilesUnderDirectories: async (): Promise<CommitFile[]> => {
    return invoke("system/selectFilesUnderDirectories");
  },
  loadCommitFiles: async (filePaths: string): Promise<CommitFile[]> => {
    return invoke("system/loadCommitFiles", filePaths);
  },
  encryptStoreGetAll: async (): Promise<Record<string, string>> => {
    return invoke("system/encryptStoreGetAll");
  },
  encryptStoreDelete: async (key: string): Promise<void> => {
    return invoke("system/encryptStoreDelete", key);
  },
  exportRepostoTxt: (repos: Repo[]): Promise<void> => {
    return ipcRenderer.invoke("system/exportRepostoTxt", repos);
  },
  encryptStoreSet: async (key: string, value: string): Promise<void> => {
    const args = { key: key, value: value };
    return invoke("system/encryptStoreSet", args);
  },
  loadFile: (filepath: string): Promise<string> => {
    return ipcRenderer.invoke("system/loadFile", filepath);
  },
  exportRecordings: async (
    payloads: RecordingExportBatchPayload[],
  ): Promise<RecordingExportResult> => {
    return ipcRenderer.invoke("system/exportRecordings", payloads);
  },
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electron", electronAPI);
    contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI;
  // @ts-ignore (define in dts)
  window.api = api;
}
