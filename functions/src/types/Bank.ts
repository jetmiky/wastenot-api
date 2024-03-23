import { GeoPoint, Timestamp } from "firebase-admin/firestore";
import { DayOfWeek, Time } from "./Strings";

interface Schedule {
  dayOfWeek: DayOfWeek;
  scheduleTimeOpen: Time;
  scheduleTimeClose: Time;
}

interface Bank {
  address: string;
  geoPoint: GeoPoint;
  closedSchedules: Timestamp[];
  openSchedules: Schedule[];
}

export default Bank;
