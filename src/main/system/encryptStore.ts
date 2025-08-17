import Store from "electron-store";
import { safeStorage } from "electron";

export const store = new Store();

export const encryptStoreSet = (key: string, value: string): void => {
  if (!safeStorage.isEncryptionAvailable()) {
    console.error("Encryption is not avalaible");
  }

  const encryptedValue: Buffer = safeStorage.encryptString(value);
  const encryptedValueHex = encryptedValue.toString("hex");
  store.set(key, encryptedValueHex);
}

export const encryptStoreGet = (key: string): string => {
  if (!safeStorage.isEncryptionAvailable()) {
    console.error("Encryption is not avalaible");
  }

  const encryptedValue: string = store.get(key) as string;
  const encryptedValueBuffer: Buffer = Buffer.from(encryptedValue, "hex");
  return safeStorage.decryptString(encryptedValueBuffer);
}

export const encryptStoreGetAllKeys = (): string[] => {
  return Object.keys(store.store)
}

export const encryptStoreGetAll = (): Record<string, string> => {
  return Object.keys(store.store).reduce((acc, key: string) => {
    acc[key] = encryptStoreGet(key);
    return acc;
  }, {})
}

export const encryptStoreDelete = (key: string): void => {
  store.delete(key);
}
