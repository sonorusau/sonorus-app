import { app, shell, BrowserWindow, ipcMain, safeStorage } from "electron";
import { join } from "path";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import icon from "../../resources/icon.png?asset";
import Store from "electron-store";
import { loadReposFromTxt } from "./system/loadReposFromTxt";
import { exportRepostoTxt } from "./system/exportRepostoTxt";
import { selectFilesUnderDirectories } from "./system/selectFilesUnderDirectories";
import {
  encryptStoreSet,
  encryptStoreGetAllKeys,
  encryptStoreGetAll,
  encryptStoreDelete
} from "./system/encryptStore";
import { loadFile } from "./system/loadFile";

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === "linux" ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, "../preload/index.mjs"),
      sandbox: false,
    },
  });

  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId("com.electron");

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  const getAll = () => {
    console.log(store.store);
    console.log(Object.keys(store.store));
  }

  const store = new Store();

  // IPC test
  ipcMain.on("ping", () => console.log("pong"));
  ipcMain.handle("system/loadReposFromTxt", loadReposFromTxt);
 
  ipcMain.handle(
    "system/selectFilesUnderDirectories",
    selectFilesUnderDirectories,
  );
  ipcMain.handle("system/loadFile", (evt, filePath) => loadFile(evt, filePath));

  ipcMain.handle("system/exportRepostoTxt", (event, repos) => {
    try {
      console.log(repos)
      exportRepostoTxt(repos);
      return { success: true };
    } catch (error) {
      console.error('Error exporting repos:', error);
      return { success: false};
    }
  });


  ipcMain.handle("system/encryptStoreDelete", async (_event, key) => {
    return encryptStoreDelete(key);
  });

  ipcMain.handle("system/encryptStoreSet", async (_event, { key, value }) => {
    encryptStoreSet(key, value);
    getAll();
    return true;
  });

  ipcMain.handle("system/encryptStoreGetAll", async () => {
    return encryptStoreGetAll();
  });

  ipcMain.handle("system/encryptStoreGetAllKeys", async () => {
    return encryptStoreGetAllKeys();
  });

  const githubCloudKey = "githubCloud";
  const githubEnterpriseServerKey = "githubEnterpriseServer";

  if (!(githubCloudKey in store.store)) {
    encryptStoreSet(githubCloudKey, "");
  }

  if (!(githubEnterpriseServerKey in store.store)) {
    encryptStoreSet(githubEnterpriseServerKey, "");
  }

  ipcMain.handle("encryptStoreSet", async (_event, { key, value }) => {
    encryptStoreSet(key, value);
    getAll();
    return true;
  });

  if (true || process.env.TEST) {
    getAll();
    const testStoreKey = "testKey";
    store.set(testStoreKey, "testVal");
    const encryptionAvalaible = safeStorage.isEncryptionAvailable();
    console.log(`Encryption Avalaible: ${encryptionAvalaible}`);
    console.log(`Test electron store: ${store.get(testStoreKey)}`);
    if (encryptionAvalaible) {
      const encryptedString = safeStorage.encryptString("test");
      const decryptedString = safeStorage.decryptString(encryptedString);
      encryptStoreSet(testStoreKey, "testVal");
    }
  }


  createWindow();

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
