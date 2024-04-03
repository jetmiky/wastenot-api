import Bank from "../types/Bank";
import AuthFields from "./auth";
import { GeoPoint } from "firebase-admin/firestore";

type BankData = Bank & AuthFields;

const users: BankData[] = [
  {
    name: "Dinas Lingkungan Tangerang Selatan",
    email: "dinastangsel@gmail.com",
    password: "password",
    phoneNumber: "+621234567830",
    address: "Tangerang Selatan",
    openSchedules: [
      {
        dayOfWeek: "1",
        scheduleTimeOpen: "08:00",
        scheduleTimeClose: "17:00",
      },
      {
        dayOfWeek: "2",
        scheduleTimeOpen: "09:00",
        scheduleTimeClose: "15:00",
      },
    ],
    closedDates: ["2024-04-15", "2024-04-30"],
    geoPoint: new GeoPoint(-6.326781785730088, 106.6737223670727),
    role: "bank",
  },
  {
    name: "Bank Sampah Cempaka",
    email: "banksampahcempaka@gmail.com",
    password: "password",
    phoneNumber: "+621234567831",
    address: "Jakarta Selatan",
    openSchedules: [
      {
        dayOfWeek: "3",
        scheduleTimeOpen: "08:00",
        scheduleTimeClose: "17:00",
      },
      {
        dayOfWeek: "4",
        scheduleTimeOpen: "09:00",
        scheduleTimeClose: "15:00",
      },
    ],
    closedDates: ["2024-04-17", "2024-04-30"],
    geoPoint: new GeoPoint(-6.2846145438033165, 106.76711655686051),
    role: "bank",
  },
];

export default users;
