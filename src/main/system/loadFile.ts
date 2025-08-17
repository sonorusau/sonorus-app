import * as fs from "fs";

/**
 * Takes a file path
 * returns content of file
 * @returns
 */

export function loadFile(evt, filePath: string): string {
  const content: string = fs.readFileSync(filePath, "utf-8");
  return content;
}




