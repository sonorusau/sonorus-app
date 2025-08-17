import { CommitFile } from "./commit/data";
import { Repo } from "./repo/data";

export interface IAPI {
  /**
   * Prompts to select a txt file and
   * loads an array of {@link Repo} instances from it.
   * @returns
   */
  loadReposFromTxt: () => Promise<Repo[]>;
  exportRepostoTxt: (repos: Repo[]) => Promise<void>;
  /**
   * Prompts to select directories.
   * Returns all file paths under the selected directories.
   * @returns
   */
  selectFilesUnderDirectories: () => Promise<CommitFile[]>;
  loadCommitFiles: (filePaths: string) => Promise<CommitFile[]>;
  encryptStoreGetAll: () => Promise<Record<string, string>>;
  encryptStoreDelete: (key: string) => Promise<void>;
  encryptStoreSet: (key: string, value: string) => Promise<void>;
  loadFile: (filePath: string) => Promise<string>;
}
