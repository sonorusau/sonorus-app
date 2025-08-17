import { Repo } from "@shared/repo/data";
import { FileFilter, dialog, BrowserWindow } from "electron";
import * as fs from "fs";


/**
 * Convers an array of {@link Repo} to a txt file 
 * and saves it in file system
 * @returns
 */

export function exportRepostoTxt(repos: Repo[]): void {

  const options = {
    title: "Save file",
    defaultPath: "my_filename",
    buttonLabel: "Save",
    filters: [
      { name: 'txt', extensions: ['txt'] },
    ]
  };


  dialog.showSaveDialog(options).then(({ filePath }) => {
    if (filePath) {
      if (Array.isArray(repos)) {
        const data = repos.map(repo => `${repo.owner}/${repo.name}`).join('\n');
        fs.writeFileSync(filePath, data, 'utf-8');
      } else {
        console.error("Expected 'repos' to be an array but got:", repos);
        const data = ''; // or handle the case where repos is not an array appropriately
        fs.writeFileSync(filePath, data, 'utf-8');
      }
    }
  }).catch(err => {
    console.error('Error saving file:', err);
  });

}
