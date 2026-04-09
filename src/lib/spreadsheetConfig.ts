import { STORAGE_SPREADSHEET_ID } from "./storageKeys";
import { env } from "../config/env";

export function getSpreadsheetId(): string {
  return localStorage.getItem(STORAGE_SPREADSHEET_ID)?.trim() || env.sheetId;
}

export function setSpreadsheetId(id: string): void {
  localStorage.setItem(STORAGE_SPREADSHEET_ID, id.trim());
}
