import { Timestamp } from "firebase-admin/firestore";

/**
 * Converts ISO Date String to Firestore Timestamp.
 *
 * @param {string} date Date in ISO String.
 * @return {Timestamp} Firestore Timestamp field value.
 */
export function timestampFromISODateString(date: string): Timestamp {
  return Timestamp.fromDate(new Date(date));
}

/**
 * Checks if a value is a valid JSON.
 *
 * @param {string} value Value to be checked as JSON.
 * @return {boolean}
 */
export function isValidJSON(value: string): boolean {
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
}
