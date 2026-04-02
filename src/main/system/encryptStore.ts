import Store from "electron-store";
import { safeStorage } from "electron";

export const store = new Store();

export const encryptStoreSet = (key: string, value: string): void => {
  if (!safeStorage.isEncryptionAvailable()) {
    store.set(key, value);
    return;
  }

  const encryptedValue: Buffer = safeStorage.encryptString(value);
  const encryptedValueHex = encryptedValue.toString("hex");
  store.set(key, encryptedValueHex);
};

export const encryptStoreGet = (key: string): string => {
  const encryptedValue: string = store.get(key) as string;

  if (!safeStorage.isEncryptionAvailable()) {
    return encryptedValue;
  }

  try {
    const encryptedValueBuffer: Buffer = Buffer.from(encryptedValue, "hex");
    return safeStorage.decryptString(encryptedValueBuffer);
  } catch (error) {
    console.error(`Failed to decrypt key ${key}:`, error);
    return encryptedValue;
  }
};

export const encryptStoreGetAllKeys = (): string[] => {
  return Object.keys(store.store);
};

export const encryptStoreGetAll = (): Record<string, string> => {
  return Object.keys(store.store).reduce((acc, key: string) => {
    try {
      acc[key] = encryptStoreGet(key);
    } catch (error) {
      console.error(`Failed to get key ${key}:`, error);
    }
    return acc;
  }, {});
};

export const encryptStoreDelete = (key: string): void => {
  store.delete(key);
};
