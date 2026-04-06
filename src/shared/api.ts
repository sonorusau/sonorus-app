// Interfaces preserved for backend functionality
export interface IAPI {
  loadReposFromTxt: () => Promise<any[]>;
  exportRepostoTxt: (repos: any[]) => Promise<void>;
  selectFilesUnderDirectories: () => Promise<any[]>;
  loadCommitFiles: (filePaths: string) => Promise<any[]>;
  encryptStoreGetAll: () => Promise<Record<string, string>>;
  encryptStoreDelete: (key: string) => Promise<void>;
  encryptStoreSet: (key: string, value: string) => Promise<void>;
  loadFile: (filePath: string) => Promise<string>;
  authLogin: (email: string, password: string) => Promise<AuthResponse>;
  authRegister: (
    name: string,
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  authValidate: (sessionToken: string) => Promise<AuthResponse>;
  authLogout: (sessionToken: string) => Promise<{ success: boolean }>;
}

export interface IAPI {
  loadReposFromTxt: () => Promise<any[]>;
  exportRepostoTxt: (repos: any[]) => Promise<void>;
  selectFilesUnderDirectories: () => Promise<any[]>;
  loadCommitFiles: (filePaths: string) => Promise<any[]>;
  encryptStoreGetAll: () => Promise<Record<string, string>>;
  encryptStoreDelete: (key: string) => Promise<void>;
  encryptStoreSet: (key: string, value: string) => Promise<void>;
  loadFile: (filePath: string) => Promise<string>;
  authLogin: (email: string, password: string) => Promise<AuthResponse>;
  authRegister: (
    name: string,
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  authValidate: (sessionToken: string) => Promise<AuthResponse>;
  authLogout: (sessionToken: string) => Promise<{ success: boolean }>;
  authGetSession: () => Promise<string | null>;
  authSetSession: (token: string) => Promise<void>;
  authClearSession: () => Promise<void>;
}

export interface AuthResponse {
  success: boolean;
  user?: {
    id: number;
    email: string;
    name: string;
  };
  sessionToken?: string;
  error?: string;
}
