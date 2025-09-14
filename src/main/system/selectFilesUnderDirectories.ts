import { CommitFile } from "@shared/commit/data";
import { dialog } from "electron";
import fs, { readdirSync } from "node:fs";
import path, { basename } from "node:path";

/**
 * Prompts to select directories.
 * Returns all local file paths under the selected directories.
 * @todo Complete this function.
 * @returns
 */
export function selectFilesUnderDirectories(): CommitFile[] {
  const commitFiles: CommitFile[] = [];
  const data: string[] | undefined = dialog.showOpenDialogSync({
    properties: ["openDirectory", "multiSelections"],
  });
  if (data === undefined) return [];
  for (let i = 0; i < data.length; i++) {
    console.log("Selected directory: " + data[i]);
    const dirFullPath: string = data[i];
    console.log("Selected dir full path: " + dirFullPath);
    const dirName: string = path.basename(dirFullPath);
    console.log("Selected dir name: " + dirName);
    const fileFullPaths: string[] = walkSync(dirFullPath, []);
    for (const fileFullPath of fileFullPaths) {
      const fileName = path.basename(fileFullPath);
      if (fileName === ".DS_Store") continue;
      const pathInRepo = fileFullPath.substring(fileFullPath.indexOf(dirName));
      console.log("Path in repo: " + pathInRepo);
      const commitFile: CommitFile = {
        fullPath: fileFullPath,
        pathInRepo: pathInRepo,
      };
      commitFiles.push(commitFile);
    }
  }
  return commitFiles;
}

// List all files in a directory in Node.js recursively in a synchronous fashion
// https://gist.github.com/kethinov/6658166
const walkSync = function (dir: string, filePaths: string[]): string[] {
  const fs = require("fs"),
    files = fs.readdirSync(dir);
  filePaths = filePaths || [];
  files.forEach(function (file) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      filePaths = walkSync(path.join(dir, file), filePaths);
    } else {
      filePaths.push(path.join(dir, file));
    }
  });
  return filePaths;
};
