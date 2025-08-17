export interface Commit {
  authorName: string;
  authorEmail: string;
  message: string;
  treeSha: string;
}

export interface CommitFile {
  /**
   * The actual path on the user's device for reading and uploading the local file.
   */
  fullPath: string;
  /**
   * Where you want the file to end up in in the repos.
   * Used to create commit tree.
   */
  pathInRepo: string;
}
