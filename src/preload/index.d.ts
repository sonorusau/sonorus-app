import { ElectronAPI } from "@electron-toolkit/preload";
import { IAPI } from "@shared/api";

declare global {
  interface Window {
    electron: IElectronAPI;
    api: IAPI;
  }
}
