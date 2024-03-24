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
