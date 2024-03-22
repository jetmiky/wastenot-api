import { GeoPoint, Timestamp } from "firebase-admin/firestore";

interface Schedule {
  dayOfWeek: number;
  scheduleTimeOpen: string;
  scheduleTimeClose: string;
}

interface Bank {
  address: string;
  geoPoint: GeoPoint;
  closedSchedules: Timestamp[];
  openSchedules: Schedule[];
}

export default Bank;
