import PickupOrder from "../types/PickupOrder";
import { PhoneNumberID } from "../types/Strings";
import { GeoPoint, Timestamp } from "firebase-admin/firestore";
import { timestampFromISODateString } from "../utils/formats";

const convertDateToTimestamp = (date: string): Timestamp => {
  return timestampFromISODateString(new Date(date).toISOString());
};

const timestamp1 = convertDateToTimestamp("2024-03-07");
const timestamp2 = convertDateToTimestamp("2024-03-10");
const timestamp3 = convertDateToTimestamp("2024-03-13");
const timestamp4 = convertDateToTimestamp("2024-03-16");
const timestamp5 = convertDateToTimestamp("2024-03-19");

const pickupOrders: PickupOrder[] = [
  {
    bankId: "",
    userId: "",
    wasteImagePath: "mockups/waste1.jpg",
    wastes: [],
    requester: {
      name: "John Doe",
      address: "Jakarta",
      phone: "+621234567810" as PhoneNumberID,
      pickupSchedule: timestamp1,
      geoPoint: new GeoPoint(-6.24159802378704, 106.82038608056467),
    },
    status: "Selesai",
    realizedPickupTime: timestamp2,
    createdAt: timestamp1,
    updatedAt: timestamp2,
  },
  {
    bankId: "",
    userId: "",
    wasteImagePath: "mockups/waste2.jpg",
    wastes: [],
    requester: {
      name: "John Doe",
      address: "Jakarta",
      phone: "+621234567810" as PhoneNumberID,
      pickupSchedule: timestamp3,
      geoPoint: new GeoPoint(-6.24159802378704, 106.82038608056467),
    },
    status: "Proses diambil",
    createdAt: timestamp3,
    updatedAt: timestamp4,
  },
  {
    bankId: "",
    userId: "",
    wasteImagePath: "mockups/waste1.jpg",
    wastes: [],
    requester: {
      name: "Annie Tate",
      address: "Jakarta",
      phone: "+621234567811" as PhoneNumberID,
      pickupSchedule: timestamp2,
      geoPoint: new GeoPoint(-6.258317057556657, 106.7760611824153),
    },
    status: "Belum diproses",
    createdAt: timestamp2,
    updatedAt: timestamp2,
  },
  {
    bankId: "",
    userId: "",
    wasteImagePath: "mockups/waste2.jpg",
    wastes: [],
    requester: {
      name: "Annie Tate",
      address: "Jakarta",
      phone: "+621234567811" as PhoneNumberID,
      pickupSchedule: timestamp4,
      geoPoint: new GeoPoint(-6.258317057556657, 106.7760611824153),
    },
    status: "Proses diambil",
    createdAt: timestamp4,
    updatedAt: timestamp5,
  },
];

export default pickupOrders;
