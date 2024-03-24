import { GeoPoint } from "firebase-admin/firestore";
import { DayOfWeek, Time } from "./Strings";

interface Schedule {
  dayOfWeek: DayOfWeek;
  scheduleTimeOpen: Time;
  scheduleTimeClose: Time;
}

interface Bank {
  name: string;
  address: string;
  geoPoint: GeoPoint;
  closedDates: string[];
  openSchedules: Schedule[];
}

export default Bank;
